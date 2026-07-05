import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Contract, ContractFactory, JsonRpcProvider, NonceManager, Wallet } from "ethers";
import { loadOraclePriceRegistry, priceUsdToUsd8 } from "./lib/oracle-price-catalog.ts";

interface DeploymentManifest {
  network: Record<string, unknown>;
  deployer: string;
  contracts: {
    complianceRegistry: { address: string };
    wrappedZBlockChainToken: { address: string };
    priceOracle?: { address: string; deploymentTxHash?: string };
  };
  tradableTokens: Array<{
    symbol: string;
    address: string;
  }>;
  liquidity: {
    wrappedNativeToken: { symbol: string; address: string };
  };
  oracle?: {
    registryPath: string;
    quoteCurrency: string;
    priceDecimals: number;
    feeds: Array<{
      symbol: string;
      token: string;
      priceUsd: string;
      priceUsd8: string;
      updatedAt?: string;
    }>;
  };
  deployedAt?: string;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const contractsRoot = path.resolve(scriptDir, "..");
const oracleAbi = [
  "function setPrices(address[] tokens,uint256[] pricesUsd8) external",
  "function getPrice(address token) external view returns (uint256 priceUsd8,uint64 updatedAt,bool active)",
  "function grantRole(bytes32 role,address account) external"
];

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for oracle price setup`);
  }
  return value;
}

function loadArtifact(contractName: string) {
  const artifactPath = path.resolve(contractsRoot, "artifacts", "src", `${contractName}.sol`, `${contractName}.json`);
  const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as { abi: unknown[]; bytecode: string };
  if (!artifact.bytecode || artifact.bytecode === "0x") {
    throw new Error(`Artifact for ${contractName} is missing bytecode. Run npm run build --workspace @nova/contracts first.`);
  }
  return artifact;
}

function loadManifest(): DeploymentManifest {
  const manifestPath =
    process.env.ZBC_BOOTSTRAP_MANIFEST_PATH ??
    path.resolve(contractsRoot, "deployments", "z-blockchain-production-liquidity.json");
  return JSON.parse(readFileSync(manifestPath, "utf8")) as DeploymentManifest;
}

function saveManifest(manifestPath: string, manifest: DeploymentManifest) {
  mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function resolveTokenAddress(manifest: DeploymentManifest, symbol: string): string {
  if (symbol === manifest.liquidity.wrappedNativeToken.symbol) {
    return manifest.liquidity.wrappedNativeToken.address;
  }

  const token = manifest.tradableTokens.find((entry) => entry.symbol === symbol);
  if (!token) {
    throw new Error(`Token ${symbol} is missing from manifest tradableTokens`);
  }
  return token.address;
}

async function waitForTransaction(tx: { wait: () => Promise<unknown> }) {
  await tx.wait();
}

async function ensurePriceOracle(signer: NonceManager, deployer: string, manifest: DeploymentManifest) {
  if (manifest.contracts.priceOracle?.address) {
    return new Contract(manifest.contracts.priceOracle.address, oracleAbi, signer);
  }

  const artifact = loadArtifact("NovaPriceOracle");
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
  const priceOracle = await factory.deploy(deployer);
  const deploymentTx = priceOracle.deploymentTransaction();
  if (!deploymentTx) {
    throw new Error("No deployment transaction found for NovaPriceOracle");
  }
  const receipt = await deploymentTx.wait();
  await priceOracle.waitForDeployment();

  manifest.contracts.priceOracle = {
    address: await priceOracle.getAddress(),
    deploymentTxHash: receipt?.hash
  };

  const oracleOperatorRole = await priceOracle.ORACLE_OPERATOR_ROLE();
  await waitForTransaction(await priceOracle.grantRole(oracleOperatorRole, deployer));
  return priceOracle;
}

async function main() {
  const rpcUrl = requireEnv("ZBC_RPC_URL");
  const deployerKey = requireEnv("ZBC_DEPLOYER_PRIVATE_KEY");
  const expectedChainId = process.env.ZBC_EXPECTED_CHAIN_ID ?? "44002";
  const manifestPath =
    process.env.ZBC_BOOTSTRAP_MANIFEST_PATH ??
    path.resolve(contractsRoot, "deployments", "z-blockchain-production-liquidity.json");
  const registryPath = process.env.ZBC_ORACLE_REGISTRY_PATH ?? "config/oracles/z-block-chain-prices.v1.json";

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId.toString() !== expectedChainId) {
    throw new Error(`Unexpected chain id ${network.chainId}; expected ${expectedChainId}`);
  }

  const wallet = new Wallet(deployerKey, provider);
  const signer = new NonceManager(wallet);
  const manifest = loadManifest();
  const registry = loadOraclePriceRegistry(registryPath);

  const priceOracle = await ensurePriceOracle(signer, wallet.address, manifest);
  const oracleAddress = await priceOracle.getAddress();

  const tokens: string[] = [];
  const pricesUsd8: bigint[] = [];
  const feedRecords: NonNullable<DeploymentManifest["oracle"]>["feeds"] = [];

  for (const entry of registry.prices) {
    const tokenAddress = resolveTokenAddress(manifest, entry.symbol);
    const priceUsd8 = priceUsdToUsd8(entry.priceUsd, registry.priceDecimals);
    tokens.push(tokenAddress);
    pricesUsd8.push(priceUsd8);
    feedRecords.push({
      symbol: entry.symbol,
      token: tokenAddress,
      priceUsd: entry.priceUsd,
      priceUsd8: priceUsd8.toString()
    });
  }

  await waitForTransaction(await priceOracle.setPrices(tokens, pricesUsd8));

  for (const feed of feedRecords) {
    const onChainFeed = (await priceOracle.getPrice(feed.token)) as [bigint, bigint, boolean];
    feed.updatedAt = new Date(Number(onChainFeed[1]) * 1000).toISOString();
  }

  manifest.oracle = {
    registryPath,
    quoteCurrency: registry.quoteCurrency,
    priceDecimals: registry.priceDecimals,
    feeds: feedRecords
  };
  manifest.deployedAt = new Date().toISOString();
  saveManifest(manifestPath, manifest);

  console.log(`NovaPriceOracle deployed/updated at ${oracleAddress}`);
  console.log(`Published ${feedRecords.length} oracle prices on chain ${expectedChainId}`);
  for (const feed of feedRecords) {
    console.log(`  ${feed.symbol}: $${feed.priceUsd} (${feed.token})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
