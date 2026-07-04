import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ContractFactory, JsonRpcProvider, Wallet } from "ethers";

interface DeployConfig {
  rpcUrl: string;
  privateKey: string;
  initialOwner: string;
  complianceAdmin: string;
  treasuryOperator: string;
  assetIssuer: string;
  auditor: string;
  outputPath: string;
  networkName: string;
}

interface DeploymentRecord {
  address: string;
  deploymentTxHash: string;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const contractsRoot = path.resolve(scriptDir, "..");

function loadDeployConfig(): DeployConfig {
  const rpcUrl = process.env.NOVA_RPC_URL ?? "http://127.0.0.1:8545";
  const privateKey = process.env.NOVA_DEPLOYER_PRIVATE_KEY ?? "";

  if (!privateKey) {
    throw new Error("NOVA_DEPLOYER_PRIVATE_KEY is required to deploy contracts");
  }

  const initialOwner = process.env.NOVA_INITIAL_OWNER ?? process.env.NOVA_DEPLOYER_ADDRESS ?? "";
  if (!initialOwner) {
    throw new Error("NOVA_INITIAL_OWNER or NOVA_DEPLOYER_ADDRESS is required");
  }

  const outputPath =
    process.env.NOVA_DEPLOYMENT_MANIFEST_PATH ?? path.resolve(contractsRoot, "deployments", "local.json");

  return {
    rpcUrl,
    privateKey,
    initialOwner,
    complianceAdmin: process.env.NOVA_COMPLIANCE_ADMIN ?? initialOwner,
    treasuryOperator: process.env.NOVA_TREASURY_OPERATOR ?? initialOwner,
    assetIssuer: process.env.NOVA_ASSET_ISSUER ?? initialOwner,
    auditor: process.env.NOVA_AUDITOR ?? initialOwner,
    outputPath,
    networkName: process.env.NOVA_NETWORK_NAME ?? "Nova One"
  };
}

function loadArtifact(contractName: string) {
  const artifactPath = path.resolve(contractsRoot, "artifacts", "src", `${contractName}.sol`, `${contractName}.json`);
  const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as {
    abi: unknown[];
    bytecode: string;
  };

  if (!artifact.bytecode || artifact.bytecode === "0x") {
    throw new Error(`Artifact for ${contractName} is missing bytecode. Run npm run build --workspace @nova/contracts first.`);
  }

  return artifact;
}

async function deployContract(wallet: Wallet, contractName: string, args: unknown[]) {
  const artifact = loadArtifact(contractName);
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();

  const deploymentTx = contract.deploymentTransaction();
  if (!deploymentTx) {
    throw new Error(`No deployment transaction found for ${contractName}`);
  }

  return {
    contract,
    record: {
      address: await contract.getAddress(),
      deploymentTxHash: deploymentTx.hash
    } satisfies DeploymentRecord
  };
}

async function grantRole(contract: { hasRole: Function; grantRole: Function }, role: string, account: string) {
  const alreadyGranted = (await contract.hasRole(role, account)) as boolean;
  if (alreadyGranted) {
    return;
  }

  const tx = await contract.grantRole(role, account);
  await tx.wait();
}

async function main() {
  const config = loadDeployConfig();
  const provider = new JsonRpcProvider(config.rpcUrl);
  const wallet = new Wallet(config.privateKey, provider);
  const network = await provider.getNetwork();

  const identity = await deployContract(wallet, "IdentityRegistry", [config.initialOwner]);
  const compliance = await deployContract(wallet, "ComplianceRegistry", [config.initialOwner, identity.record.address]);
  const settlement = await deployContract(wallet, "NovaSettlementToken", [config.initialOwner, compliance.record.address]);
  const wrappedNovaOne = await deployContract(wallet, "WrappedNovaOneToken", []);
  const assetFactory = await deployContract(wallet, "NovaAssetFactory", [config.initialOwner]);
  const treasury = await deployContract(wallet, "TreasuryController", [config.initialOwner, settlement.record.address]);
  const auditEvents = await deployContract(wallet, "AuditEvents", [config.initialOwner]);

  await grantRole(identity.contract, await identity.contract.COMPLIANCE_ADMIN_ROLE(), config.complianceAdmin);
  await grantRole(compliance.contract, await compliance.contract.COMPLIANCE_ADMIN_ROLE(), config.complianceAdmin);
  await grantRole(settlement.contract, await settlement.contract.TREASURY_OPERATOR_ROLE(), config.treasuryOperator);
  await grantRole(assetFactory.contract, await assetFactory.contract.ASSET_ISSUER_ROLE(), config.assetIssuer);
  await grantRole(treasury.contract, await treasury.contract.TREASURY_OPERATOR_ROLE(), config.treasuryOperator);
  await grantRole(auditEvents.contract, await auditEvents.contract.AUDITOR_ROLE(), config.auditor);

  const manifest = {
    network: {
      name: config.networkName,
      chainId: network.chainId.toString(),
      rpcUrl: config.rpcUrl
    },
    deployer: await wallet.getAddress(),
    owner: config.initialOwner,
    roles: {
      complianceAdmin: config.complianceAdmin,
      treasuryOperator: config.treasuryOperator,
      assetIssuer: config.assetIssuer,
      auditor: config.auditor
    },
    contracts: {
      identityRegistry: identity.record,
      complianceRegistry: compliance.record,
      settlementToken: settlement.record,
      wrappedNovaOneToken: wrappedNovaOne.record,
      assetFactory: assetFactory.record,
      treasuryController: treasury.record,
      auditEvents: auditEvents.record
    },
    deployedAt: new Date().toISOString()
  };

  mkdirSync(path.dirname(config.outputPath), { recursive: true });
  writeFileSync(config.outputPath, JSON.stringify(manifest, null, 2));

  console.log("Nova contracts deployed");
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error("Nova deployment failed", error);
  process.exit(1);
});
