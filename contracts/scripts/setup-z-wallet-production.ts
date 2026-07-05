import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Contract, formatEther, id, JsonRpcProvider, NonceManager, parseUnits, Wallet, ZeroHash } from "ethers";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const contractsRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(contractsRoot, "..");

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for Z Wallet production setup`);
  }
  return value;
}

function loadManifest(manifestPath: string) {
  return JSON.parse(readFileSync(manifestPath, "utf8")) as {
    network?: { chainId?: string; rpcUrl?: string };
    deployer?: string;
    contracts?: {
      identityRegistry?: { address: string };
      complianceRegistry?: { address: string };
    };
    zWallet?: {
      address: string;
      role: string;
      registeredAt?: string;
    };
  };
}

async function main() {
  const manifestPath = path.resolve(
    repoRoot,
    process.env.ZBC_BOOTSTRAP_MANIFEST_PATH ?? "contracts/deployments/z-blockchain-production-liquidity.json"
  );
  const manifest = loadManifest(manifestPath);
  const rpcUrl = process.env.ZBC_RPC_URL ?? manifest.network?.rpcUrl ?? "http://127.0.0.1:8546";
  const expectedChainId = BigInt(process.env.ZBC_EXPECTED_CHAIN_ID ?? manifest.network?.chainId ?? "44002");
  const walletAddress = requireEnv("Z_WALLET_ADDRESS").toLowerCase();
  const participantRole = process.env.Z_WALLET_PARTICIPANT_ROLE ?? "z-wallet-production";
  const kycAttestation = process.env.Z_WALLET_KYC_ATTESTATION ?? "Z_WALLET_PRODUCTION_KYC";

  const identityAddress = manifest.contracts?.identityRegistry?.address;
  const complianceAddress = manifest.contracts?.complianceRegistry?.address;
  if (!identityAddress || !complianceAddress) {
    throw new Error("Manifest is missing identityRegistry or complianceRegistry addresses. Run Z Blockchain bootstrap first.");
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const adminWallet = new Wallet(requireEnv("ZBC_DEPLOYER_PRIVATE_KEY"), provider);
  const admin = new NonceManager(adminWallet);
  const network = await provider.getNetwork();
  if (network.chainId !== expectedChainId) {
    throw new Error(`Connected to chain ${network.chainId}, expected ${expectedChainId}`);
  }

  const identity = new Contract(
    identityAddress,
    [
      "function registerParticipant(address participant,string participantType,string jurisdiction,bytes32 kycAttestation,bytes32 metadataHash)",
      "function isEligible(address account) view returns (bool)",
      "function getParticipant(address account) view returns (tuple(bool isActive,string participantType,string jurisdiction,bytes32 kycReference,bytes32 kybReference,uint64 updatedAt))"
    ],
    admin
  );
  const compliance = new Contract(
    complianceAddress,
    ["function setStatus(address participant,bool frozen,bool blacklisted,uint256 riskScore,string jurisdiction)"],
    admin
  );

  const participant = await identity.getParticipant(walletAddress);
  const alreadyRegistered = participant.isActive && participant.participantType !== "";
  if (!alreadyRegistered) {
    const tx = await identity.registerParticipant(walletAddress, participantRole, "GLOBAL", id(kycAttestation), ZeroHash);
    await tx.wait();
    console.log(`Registered Z Wallet ${walletAddress} as ${participantRole}`);
  } else {
    console.log(`Z Wallet ${walletAddress} already registered on IdentityRegistry`);
  }

  const complianceTx = await compliance.setStatus(walletAddress, false, false, 0, "GLOBAL");
  await complianceTx.wait();
  console.log(`Activated compliance profile for ${walletAddress}`);

  let nativeBalance = await provider.getBalance(walletAddress);
  if (nativeBalance === 0n) {
    const fundTx = await admin.sendTransaction({ to: walletAddress, value: parseUnits("100", 18) });
    await fundTx.wait();
    nativeBalance = await provider.getBalance(walletAddress);
    console.log(`Funded Z Wallet with 100 Z for gas (tx ${fundTx.hash})`);
  }

  const signingWallet = process.env.Z_WALLET_PRIVATE_KEY ? new Wallet(process.env.Z_WALLET_PRIVATE_KEY, provider) : null;
  if (signingWallet) {
    const derivedAddress = (await signingWallet.getAddress()).toLowerCase();
    if (derivedAddress !== walletAddress) {
      throw new Error(`Z_WALLET_PRIVATE_KEY does not match Z_WALLET_ADDRESS (${walletAddress})`);
    }
    console.log("Verified Z_WALLET_PRIVATE_KEY matches configured production wallet");
  } else {
    console.log("Z_WALLET_PRIVATE_KEY not set — registration complete without signing verification");
  }

  manifest.zWallet = {
    address: walletAddress,
    role: participantRole,
    label: "Z Wallet Production Treasury",
    registeredAt: new Date().toISOString(),
    nativeBalanceZ: formatEther(await provider.getBalance(walletAddress)),
    identityRegistry: identityAddress,
    complianceRegistry: complianceAddress
  };

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log("");
  console.log("Z Wallet production setup complete");
  console.log(`  Address     ${walletAddress}`);
  console.log(`  Role        ${participantRole}`);
  console.log(`  Native Z    ${formatEther(nativeBalance)}`);
  console.log(`  Manifest    ${manifestPath}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
