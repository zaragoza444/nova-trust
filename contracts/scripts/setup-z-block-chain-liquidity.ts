import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Contract, ContractFactory, formatUnits, id, JsonRpcProvider, NonceManager, parseUnits, Wallet, ZeroHash } from "ethers";

interface BootstrapConfig {
  rpcUrl: string;
  privateKey: string;
  expectedChainId: bigint;
  initialOwner: string;
  complianceAdmin: string;
  treasuryOperator: string;
  assetIssuer: string;
  auditor: string;
  networkName: string;
  outputPath: string;
  m1FiatSupply: bigint;
  m1FiatLiquidity: bigint;
  acxSupply: bigint;
  acxLiquidity: bigint;
  shivaSupply: bigint;
  shivaLiquidity: bigint;
  wzLiquidity: bigint;
  wzAcxLiquidity: bigint;
  wzShivaLiquidity: bigint;
}

interface DeploymentRecord {
  address: string;
  deploymentTxHash: string;
}

interface DeployedContract {
  contract: any;
  record: DeploymentRecord;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const contractsRoot = path.resolve(scriptDir, "..");
const erc20Abi = [
  "function approve(address spender,uint256 value) external returns (bool)",
  "function allowance(address owner,address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for Z Blockchain liquidity setup`);
  }
  return value;
}

function parseTokenAmount(envName: string) {
  return parseUnits(requireEnv(envName), 18);
}

function loadArtifact(contractName: string) {
  const artifactPath = path.resolve(contractsRoot, "artifacts", "src", `${contractName}.sol`, `${contractName}.json`);
  const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as { abi: unknown[]; bytecode: string };
  if (!artifact.bytecode || artifact.bytecode === "0x") {
    throw new Error(`Artifact for ${contractName} is missing bytecode. Run npm run build --workspace @nova/contracts first.`);
  }
  return artifact;
}

async function loadConfig(walletAddress: string): Promise<BootstrapConfig> {
  const initialOwner = process.env.ZBC_INITIAL_OWNER ?? walletAddress;
  return {
    rpcUrl: requireEnv("ZBC_RPC_URL"),
    privateKey: requireEnv("ZBC_DEPLOYER_PRIVATE_KEY"),
    expectedChainId: BigInt(process.env.ZBC_EXPECTED_CHAIN_ID ?? "44002"),
    initialOwner,
    complianceAdmin: process.env.ZBC_COMPLIANCE_ADMIN ?? initialOwner,
    treasuryOperator: process.env.ZBC_TREASURY_OPERATOR ?? initialOwner,
    assetIssuer: process.env.ZBC_ASSET_ISSUER ?? initialOwner,
    auditor: process.env.ZBC_AUDITOR ?? initialOwner,
    networkName: process.env.ZBC_NETWORK_NAME ?? "Z Blockchain",
    outputPath:
      process.env.ZBC_BOOTSTRAP_MANIFEST_PATH ??
      path.resolve(contractsRoot, "deployments", "z-block-chain-liquidity.json"),
    m1FiatSupply: parseTokenAmount("ZBC_M1FIAT_SUPPLY"),
    m1FiatLiquidity: parseTokenAmount("ZBC_M1FIAT_LIQUIDITY"),
    acxSupply: parseTokenAmount("ZBC_ACX_SUPPLY"),
    acxLiquidity: parseTokenAmount("ZBC_ACX_LIQUIDITY"),
    shivaSupply: parseTokenAmount("ZBC_SHIVA_SUPPLY"),
    shivaLiquidity: parseTokenAmount("ZBC_SHIVA_LIQUIDITY"),
    wzLiquidity: parseTokenAmount("ZBC_WZ_LIQUIDITY"),
    wzAcxLiquidity: parseTokenAmount("ZBC_WZ_ACX_LIQUIDITY"),
    wzShivaLiquidity: parseTokenAmount("ZBC_WZ_SHIVA_LIQUIDITY")
  };
}

async function deployContract(signer: NonceManager, contractName: string, args: unknown[]): Promise<DeployedContract> {
  const artifact = loadArtifact(contractName);
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(...args);
  const deploymentTx = contract.deploymentTransaction();
  if (!deploymentTx) throw new Error(`No deployment transaction found for ${contractName}`);
  await deploymentTx.wait();
  await contract.waitForDeployment();
  return { contract, record: { address: await contract.getAddress(), deploymentTxHash: deploymentTx.hash } };
}

async function waitForTransaction(tx: { wait: () => Promise<unknown> }) {
  await tx.wait();
}

async function grantRole(contract: any, role: string, account: string) {
  if (await contract.hasRole(role, account)) return;
  await waitForTransaction(await contract.grantRole(role, account));
}

async function approveIfNeeded(token: Contract, owner: string, spender: string, amount: bigint) {
  if ((await token.allowance(owner, spender)) >= amount) return;
  await waitForTransaction(await token.approve(spender, amount));
}

async function issueAsset(
  assetFactory: DeployedContract,
  assetId: string,
  assetClass: string,
  assetName: string,
  assetSymbol: string,
  issueSize: bigint,
  treasury: string
) {
  await waitForTransaction(
    await assetFactory.contract.issueAsset(assetId, assetClass, "GLOBAL", assetName, assetSymbol, issueSize, treasury)
  );
  const assets = (await assetFactory.contract.getAssets()) as Array<{ assetToken: string; assetId: string }>;
  const match = assets.find((item) => item.assetId === assetId);
  if (!match) throw new Error(`Failed to resolve issued asset ${assetId}`);
  return match.assetToken as string;
}

async function bootstrapLiquidityPool(
  signer: NonceManager,
  walletAddress: string,
  compliance: DeployedContract,
  token0Address: string,
  token1Address: string,
  poolName: string,
  poolSymbol: string,
  amount0: bigint,
  amount1: bigint,
  token0Symbol: string,
  token1Symbol: string
) {
  const liquidityPool = await deployContract(signer, "NovaLiquidityPool", [token0Address, token1Address, poolName, poolSymbol]);
  const token0 = new Contract(token0Address, erc20Abi, signer);
  const token1 = new Contract(token1Address, erc20Abi, signer);
  await approveIfNeeded(token0, walletAddress, liquidityPool.record.address, amount0);
  await approveIfNeeded(token1, walletAddress, liquidityPool.record.address, amount1);
  await waitForTransaction(await liquidityPool.contract.addLiquidity(amount0, amount1, walletAddress));
  await waitForTransaction(await compliance.contract.setLiquidityVenue(liquidityPool.record.address, true));
  return {
    symbol: poolSymbol,
    name: poolName,
    token0: token0Address,
    token1: token1Address,
    pool: liquidityPool.record,
    initialAmounts: { [token0Symbol]: formatUnits(amount0, 18), [token1Symbol]: formatUnits(amount1, 18) }
  };
}

async function main() {
  const provider = new JsonRpcProvider(process.env.ZBC_RPC_URL ?? "http://127.0.0.1:8546");
  const wallet = new Wallet(requireEnv("ZBC_DEPLOYER_PRIVATE_KEY"), provider);
  const signer = new NonceManager(wallet);
  const walletAddress = await wallet.getAddress();
  const config = await loadConfig(walletAddress);
  const network = await provider.getNetwork();

  if (network.chainId !== config.expectedChainId) {
    throw new Error(`Connected to chain ${network.chainId}, expected ${config.expectedChainId} for ${config.networkName}`);
  }

  const identity = await deployContract(signer, "IdentityRegistry", [config.initialOwner]);
  const compliance = await deployContract(signer, "ComplianceRegistry", [config.initialOwner, identity.record.address]);
  const settlement = await deployContract(signer, "NovaSettlementToken", [config.initialOwner, compliance.record.address]);
  const wrappedZ = await deployContract(signer, "WrappedZBlockChainToken", []);
  const assetFactory = await deployContract(signer, "NovaAssetFactory", [config.initialOwner]);
  const treasury = await deployContract(signer, "TreasuryController", [config.initialOwner, settlement.record.address]);
  const auditEvents = await deployContract(signer, "AuditEvents", [config.initialOwner]);

  await grantRole(identity.contract, await identity.contract.COMPLIANCE_ADMIN_ROLE(), config.complianceAdmin);
  await grantRole(compliance.contract, await compliance.contract.COMPLIANCE_ADMIN_ROLE(), config.complianceAdmin);
  await grantRole(settlement.contract, await settlement.contract.TREASURY_OPERATOR_ROLE(), config.treasuryOperator);
  await grantRole(assetFactory.contract, await assetFactory.contract.ASSET_ISSUER_ROLE(), config.assetIssuer);
  await grantRole(treasury.contract, await treasury.contract.TREASURY_OPERATOR_ROLE(), config.treasuryOperator);
  await grantRole(auditEvents.contract, await auditEvents.contract.AUDITOR_ROLE(), config.auditor);

  await waitForTransaction(
    await identity.contract.registerParticipant(walletAddress, "z-bank-treasury", "GLOBAL", id("ZBC_DEPLOYER_KYC"), ZeroHash)
  );
  await waitForTransaction(await compliance.contract.setStatus(walletAddress, false, false, 0, "GLOBAL"));

  const m1FiatAddress = await issueAsset(assetFactory, "M1FIAT-ZBC-001", "Stablecoin", "M1 Fiat Token", "M1FIAT", config.m1FiatSupply, walletAddress);
  const acxAddress = await issueAsset(assetFactory, "ACX-ZBC-001", "Exchange", "ACX Token", "ACX", config.acxSupply, walletAddress);
  const shivaAddress = await issueAsset(assetFactory, "SHIVA-ZBC-001", "Utility", "Shiva Token", "SHIVA", config.shivaSupply, walletAddress);

  const totalWzWrap = config.wzLiquidity + config.wzAcxLiquidity + config.wzShivaLiquidity;
  await waitForTransaction(await wrappedZ.contract.deposit({ value: totalWzWrap }));

  const pools = [
    await bootstrapLiquidityPool(signer, walletAddress, compliance, m1FiatAddress, wrappedZ.record.address, "M1FIAT / WZ Liquidity Pool", "NLP-M1FIAT-WZ", config.m1FiatLiquidity, config.wzLiquidity, "M1FIAT", "WZ"),
    await bootstrapLiquidityPool(signer, walletAddress, compliance, acxAddress, wrappedZ.record.address, "ACX / WZ Liquidity Pool", "NLP-ACX-WZ", config.acxLiquidity, config.wzAcxLiquidity, "ACX", "WZ"),
    await bootstrapLiquidityPool(signer, walletAddress, compliance, shivaAddress, wrappedZ.record.address, "SHIVA / WZ Liquidity Pool", "NLP-SHIVA-WZ", config.shivaLiquidity, config.wzShivaLiquidity, "SHIVA", "WZ")
  ];

  const manifest = {
    network: {
      name: config.networkName,
      chainId: network.chainId.toString(),
      rpcUrl: config.rpcUrl,
      chainChart: "config/chains/z-block-chain.v1.json",
      zBankIntegration: "config/integrations/z-bank-online.v1.json",
      tradableTokenRegistry: "config/tokens/z-block-chain-tradable-tokens.v1.json"
    },
    deployer: walletAddress,
    contracts: {
      identityRegistry: identity.record,
      complianceRegistry: compliance.record,
      settlementToken: settlement.record,
      wrappedZBlockChainToken: wrappedZ.record,
      assetFactory: assetFactory.record,
      treasuryController: treasury.record,
      auditEvents: auditEvents.record
    },
    tradableTokens: [
      { symbol: "M1FIAT", address: m1FiatAddress, capabilities: { transferable: true, tradable: true, swappable: true, zBankLoadable: true } },
      { symbol: "ACX", address: acxAddress, capabilities: { transferable: true, tradable: true, swappable: true, zBankLoadable: true } },
      { symbol: "SHIVA", address: shivaAddress, capabilities: { transferable: true, tradable: true, swappable: true, zBankLoadable: true } }
    ],
    liquidity: { wrappedNativeToken: { symbol: "WZ", address: wrappedZ.record.address }, pools, complianceVenueApproved: true },
    deployedAt: new Date().toISOString()
  };

  mkdirSync(path.dirname(config.outputPath), { recursive: true });
  writeFileSync(config.outputPath, JSON.stringify(manifest, null, 2));
  console.log("Z Blockchain production liquidity bootstrap complete");
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error("Z Blockchain production liquidity bootstrap failed", error);
  process.exit(1);
});
