import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Contract, ContractFactory, formatUnits, id, JsonRpcProvider, parseUnits, Wallet, ZeroHash } from "ethers";

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
  wnovaLiquidity: bigint;
  wnovaAcxLiquidity: bigint;
  wnovaShivaLiquidity: bigint;
}

interface DeploymentRecord {
  address: string;
  deploymentTxHash: string;
}

interface DeployedContract {
  contract: any;
  record: DeploymentRecord;
}

interface IssuedAssetRecord {
  assetId: string;
  symbol: string;
  name: string;
  assetClass: string;
  jurisdiction: string;
  address: string;
  supply: string;
}

interface LiquidityPoolRecord {
  symbol: string;
  name: string;
  token0: string;
  token1: string;
  pool: DeploymentRecord;
  initialAmounts: Record<string, string>;
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
    throw new Error(`${name} is required for production liquidity setup`);
  }
  return value;
}

function parseTokenAmount(envName: string) {
  return parseUnits(requireEnv(envName), 18);
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

async function loadConfig(walletAddress: string): Promise<BootstrapConfig> {
  const initialOwner = process.env.NOVA_INITIAL_OWNER ?? walletAddress;
  const outputPath =
    process.env.NOVA_PRODUCTION_BOOTSTRAP_MANIFEST_PATH ??
    path.resolve(contractsRoot, "deployments", "nova-one-liquidity.json");

  return {
    rpcUrl: requireEnv("NOVA_RPC_URL"),
    privateKey: requireEnv("NOVA_DEPLOYER_PRIVATE_KEY"),
    expectedChainId: BigInt(process.env.NOVA_EXPECTED_CHAIN_ID ?? "22016"),
    initialOwner,
    complianceAdmin: process.env.NOVA_COMPLIANCE_ADMIN ?? initialOwner,
    treasuryOperator: process.env.NOVA_TREASURY_OPERATOR ?? initialOwner,
    assetIssuer: process.env.NOVA_ASSET_ISSUER ?? initialOwner,
    auditor: process.env.NOVA_AUDITOR ?? initialOwner,
    networkName: process.env.NOVA_NETWORK_NAME ?? "Nova One",
    outputPath,
    m1FiatSupply: parseTokenAmount("NOVA_M1FIAT_SUPPLY"),
    m1FiatLiquidity: parseTokenAmount("NOVA_M1FIAT_LIQUIDITY"),
    acxSupply: parseTokenAmount("NOVA_ACX_SUPPLY"),
    acxLiquidity: parseTokenAmount("NOVA_ACX_LIQUIDITY"),
    shivaSupply: parseTokenAmount("NOVA_SHIVA_SUPPLY"),
    shivaLiquidity: parseTokenAmount("NOVA_SHIVA_LIQUIDITY"),
    wnovaLiquidity: parseTokenAmount("NOVA_WNOVA_LIQUIDITY"),
    wnovaAcxLiquidity: parseTokenAmount("NOVA_WNOVA_ACX_LIQUIDITY"),
    wnovaShivaLiquidity: parseTokenAmount("NOVA_WNOVA_SHIVA_LIQUIDITY")
  };
}

async function deployContract(wallet: Wallet, contractName: string, args: unknown[]): Promise<DeployedContract> {
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
    }
  };
}

async function waitForTransaction(tx: { wait: () => Promise<unknown> }) {
  await tx.wait();
}

async function grantRole(contract: any, role: string, account: string) {
  const alreadyGranted = (await contract.hasRole(role, account)) as boolean;
  if (alreadyGranted) {
    return;
  }

  await waitForTransaction(await contract.grantRole(role, account));
}

async function approveIfNeeded(token: Contract, owner: string, spender: string, amount: bigint) {
  const currentAllowance = (await token.allowance(owner, spender)) as bigint;
  if (currentAllowance >= amount) {
    return;
  }

  await waitForTransaction(await token.approve(spender, amount));
}

function requireSingleSignerBootstrap(config: BootstrapConfig, walletAddress: string) {
  const roleAccounts = {
    NOVA_INITIAL_OWNER: config.initialOwner,
    NOVA_COMPLIANCE_ADMIN: config.complianceAdmin,
    NOVA_ASSET_ISSUER: config.assetIssuer
  };

  for (const [envName, account] of Object.entries(roleAccounts)) {
    if (account.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error(
        `${envName} must be the deployer wallet for one-command bootstrap. ` +
          "Use the default deployer value for setup:production, then transfer roles to multisigs after bootstrap."
      );
    }
  }
}

async function issueAsset(
  assetFactory: DeployedContract,
  assetId: string,
  assetClass: string,
  jurisdiction: string,
  assetName: string,
  assetSymbol: string,
  issueSize: bigint,
  treasury: string
): Promise<string> {
  const assetAddress = (await assetFactory.contract.issueAsset.staticCall(
    assetId,
    assetClass,
    jurisdiction,
    assetName,
    assetSymbol,
    issueSize,
    treasury
  )) as string;

  await waitForTransaction(
    await assetFactory.contract.issueAsset(
      assetId,
      assetClass,
      jurisdiction,
      assetName,
      assetSymbol,
      issueSize,
      treasury
    )
  );

  return assetAddress;
}

async function bootstrapLiquidityPool(
  wallet: Wallet,
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
): Promise<LiquidityPoolRecord> {
  const liquidityPool = await deployContract(wallet, "NovaLiquidityPool", [
    token0Address,
    token1Address,
    poolName,
    poolSymbol
  ]);

  const token0 = new Contract(token0Address, erc20Abi, wallet);
  const token1 = new Contract(token1Address, erc20Abi, wallet);
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
    initialAmounts: {
      [token0Symbol]: formatUnits(amount0, 18),
      [token1Symbol]: formatUnits(amount1, 18)
    }
  };
}

async function main() {
  const preflightProvider = new JsonRpcProvider(process.env.NOVA_RPC_URL ?? "http://127.0.0.1:8545");
  const wallet = new Wallet(requireEnv("NOVA_DEPLOYER_PRIVATE_KEY"), preflightProvider);
  const walletAddress = await wallet.getAddress();
  const config = await loadConfig(walletAddress);
  const network = await preflightProvider.getNetwork();
  requireSingleSignerBootstrap(config, walletAddress);

  if (network.chainId !== config.expectedChainId) {
    throw new Error(
      `Connected to chain ${network.chainId.toString()}, expected ${config.expectedChainId.toString()} for ${config.networkName}`
    );
  }

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

  await waitForTransaction(
    await identity.contract.registerParticipant(walletAddress, "treasury", "GLOBAL", id("NOVA_DEPLOYER_KYC"), ZeroHash)
  );
  await waitForTransaction(await compliance.contract.setStatus(walletAddress, false, false, 0, "GLOBAL"));

  const m1FiatAddress = await issueAsset(
    assetFactory,
    "M1FIAT-2026-001",
    "Stablecoin",
    "GLOBAL",
    "M1 Fiat Token",
    "M1FIAT",
    config.m1FiatSupply,
    walletAddress
  );

  const acxAddress = await issueAsset(
    assetFactory,
    "ACX-2026-001",
    "Exchange",
    "GLOBAL",
    "ACX Token",
    "ACX",
    config.acxSupply,
    walletAddress
  );

  const shivaAddress = await issueAsset(
    assetFactory,
    "SHIVA-2026-001",
    "Utility",
    "GLOBAL",
    "Shiva Token",
    "SHIVA",
    config.shivaSupply,
    walletAddress
  );

  const totalWnovaWrap =
    config.wnovaLiquidity + config.wnovaAcxLiquidity + config.wnovaShivaLiquidity;
  await waitForTransaction(await wrappedNovaOne.contract.deposit({ value: totalWnovaWrap }));

  const m1FiatPool = await bootstrapLiquidityPool(
    wallet,
    walletAddress,
    compliance,
    m1FiatAddress,
    wrappedNovaOne.record.address,
    "M1FIAT / WNOVA Liquidity Pool",
    "NLP-M1FIAT-WNOVA",
    config.m1FiatLiquidity,
    config.wnovaLiquidity,
    "M1FIAT",
    "WNOVA"
  );

  const acxPool = await bootstrapLiquidityPool(
    wallet,
    walletAddress,
    compliance,
    acxAddress,
    wrappedNovaOne.record.address,
    "ACX / WNOVA Liquidity Pool",
    "NLP-ACX-WNOVA",
    config.acxLiquidity,
    config.wnovaAcxLiquidity,
    "ACX",
    "WNOVA"
  );

  const shivaPool = await bootstrapLiquidityPool(
    wallet,
    walletAddress,
    compliance,
    shivaAddress,
    wrappedNovaOne.record.address,
    "SHIVA / WNOVA Liquidity Pool",
    "NLP-SHIVA-WNOVA",
    config.shivaLiquidity,
    config.wnovaShivaLiquidity,
    "SHIVA",
    "WNOVA"
  );

  const issuedAssets: IssuedAssetRecord[] = [
    {
      assetId: "M1FIAT-2026-001",
      symbol: "M1FIAT",
      name: "M1 Fiat Token",
      assetClass: "Stablecoin",
      jurisdiction: "GLOBAL",
      address: m1FiatAddress,
      supply: formatUnits(config.m1FiatSupply, 18)
    },
    {
      assetId: "ACX-2026-001",
      symbol: "ACX",
      name: "ACX Token",
      assetClass: "Exchange",
      jurisdiction: "GLOBAL",
      address: acxAddress,
      supply: formatUnits(config.acxSupply, 18)
    },
    {
      assetId: "SHIVA-2026-001",
      symbol: "SHIVA",
      name: "Shiva Token",
      assetClass: "Utility",
      jurisdiction: "GLOBAL",
      address: shivaAddress,
      supply: formatUnits(config.shivaSupply, 18)
    }
  ];

  const manifest = {
    network: {
      name: config.networkName,
      chainId: network.chainId.toString(),
      rpcUrl: config.rpcUrl,
      chain138Settlement: {
        chainId: 138,
        tradableTokenRegistry: "config/tokens/chain138-tradable-tokens.v1.json",
        zBankIntegration: "config/integrations/z-bank-online.v1.json",
        tradingPlatforms: "config/compliance/trading-platforms.v1.json"
      }
    },
    deployer: walletAddress,
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
    tradableTokens: issuedAssets.map((asset) => ({
      ...asset,
      capabilities: {
        transferable: true,
        tradable: true,
        swappable: true,
        zBankLoadable: true
      }
    })),
    liquidity: {
      wrappedNativeToken: {
        symbol: "WNOVA",
        address: wrappedNovaOne.record.address
      },
      pools: [m1FiatPool, acxPool, shivaPool],
      complianceVenueApproved: true
    },
    deployedAt: new Date().toISOString()
  };

  mkdirSync(path.dirname(config.outputPath), { recursive: true });
  writeFileSync(config.outputPath, JSON.stringify(manifest, null, 2));

  console.log("Nova production liquidity bootstrap complete");
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error("Nova production liquidity bootstrap failed", error);
  process.exit(1);
});
