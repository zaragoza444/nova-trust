import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Contract, ContractFactory, formatUnits, JsonRpcProvider, NonceManager, Wallet } from "ethers";
import { loadCloneTokenCatalog, resolveCloneTokenAmounts } from "./lib/clone-token-catalog.ts";

interface DeploymentManifest {
  network: Record<string, unknown>;
  deployer: string;
  contracts: {
    complianceRegistry: { address: string };
    wrappedZBlockChainToken: { address: string };
    assetFactory: { address: string };
  };
  tradableTokens: Array<{
    symbol: string;
    address: string;
    capabilities: Record<string, boolean>;
  }>;
  liquidity: {
    wrappedNativeToken: { symbol: string; address: string };
    pools: Array<Record<string, unknown>>;
    complianceVenueApproved?: boolean;
  };
  cloneTokens?: Array<Record<string, unknown>>;
  cloneTokens100B?: Array<Record<string, unknown>>;
  deployedAt?: string;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const contractsRoot = path.resolve(scriptDir, "..");
const erc20Abi = [
  "function approve(address spender,uint256 value) external returns (bool)",
  "function allowance(address owner,address spender) external view returns (uint256)"
];
const wrappedNativeAbi = ["function deposit() external payable"];

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for clone token mint`);
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
    path.resolve(contractsRoot, "deployments", "z-block-chain-liquidity.json");
  return JSON.parse(readFileSync(manifestPath, "utf8")) as DeploymentManifest;
}

async function waitForTransaction(tx: { wait: () => Promise<unknown> }) {
  await tx.wait();
}

async function approveIfNeeded(token: Contract, owner: string, spender: string, amount: bigint) {
  if ((await token.allowance(owner, spender)) >= amount) return;
  await waitForTransaction(await token.approve(spender, amount));
}

async function issueAsset(
  assetFactory: Contract,
  assetId: string,
  assetClass: string,
  assetName: string,
  assetSymbol: string,
  issueSize: bigint,
  treasury: string
) {
  await waitForTransaction(
    await assetFactory.issueAsset(assetId, assetClass, "GLOBAL", assetName, assetSymbol, issueSize, treasury)
  );
  const assets = (await assetFactory.getAssets()) as Array<{ assetToken: string; assetId: string }>;
  const match = assets.find((item) => item.assetId === assetId);
  if (!match) throw new Error(`Failed to resolve issued asset ${assetId}`);
  return match.assetToken as string;
}

async function bootstrapLiquidityPool(
  signer: NonceManager,
  walletAddress: string,
  compliance: Contract,
  token0Address: string,
  token1Address: string,
  poolName: string,
  poolSymbol: string,
  amount0: bigint,
  amount1: bigint,
  token0Symbol: string,
  token1Symbol: string
) {
  const artifact = loadArtifact("NovaLiquidityPool");
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
  const liquidityPool = await factory.deploy(token0Address, token1Address, poolName, poolSymbol);
  const deploymentTx = liquidityPool.deploymentTransaction();
  if (!deploymentTx) throw new Error(`No deployment transaction found for ${poolSymbol}`);
  await deploymentTx.wait();
  await liquidityPool.waitForDeployment();
  const poolAddress = await liquidityPool.getAddress();

  const token0 = new Contract(token0Address, erc20Abi, signer);
  const token1 = new Contract(token1Address, erc20Abi, signer);
  await approveIfNeeded(token0, walletAddress, poolAddress, amount0);
  await approveIfNeeded(token1, walletAddress, poolAddress, amount1);
  await waitForTransaction(await liquidityPool.addLiquidity(amount0, amount1, walletAddress));
  await waitForTransaction(await compliance.setLiquidityVenue(poolAddress, true));

  return {
    symbol: poolSymbol,
    name: poolName,
    token0: token0Address,
    token1: token1Address,
    pool: { address: poolAddress, deploymentTxHash: deploymentTx.hash },
    initialAmounts: { [token0Symbol]: formatUnits(amount0, 18), [token1Symbol]: formatUnits(amount1, 18) }
  };
}

async function main() {
  const catalog = loadCloneTokenCatalog();
  const manifest = loadManifest();
  const manifestPath =
    process.env.ZBC_BOOTSTRAP_MANIFEST_PATH ??
    path.resolve(contractsRoot, "deployments", "z-block-chain-liquidity.json");

  const provider = new JsonRpcProvider(requireEnv("ZBC_RPC_URL"));
  const wallet = new Wallet(requireEnv("ZBC_DEPLOYER_PRIVATE_KEY"), provider);
  const signer = new NonceManager(wallet);
  const walletAddress = await wallet.getAddress();
  const expectedChainId = BigInt(process.env.ZBC_EXPECTED_CHAIN_ID ?? "44002");
  const network = await provider.getNetwork();

  if (network.chainId !== expectedChainId) {
    throw new Error(`Connected to chain ${network.chainId}, expected ${expectedChainId}`);
  }

  const assetFactoryArtifact = loadArtifact("NovaAssetFactory");
  const complianceArtifact = loadArtifact("ComplianceRegistry");
  const assetFactory = new Contract(
    manifest.contracts.assetFactory.address,
    assetFactoryArtifact.abi,
    signer
  );
  const compliance = new Contract(
    manifest.contracts.complianceRegistry.address,
    complianceArtifact.abi,
    signer
  );
  const wrappedZ = new Contract(
    manifest.contracts.wrappedZBlockChainToken.address,
    wrappedNativeAbi,
    signer
  );

  const existingSymbols = new Set(manifest.tradableTokens.map((token) => token.symbol));
  const existingAssetIds = new Set<string>();
  for (const entry of [...(manifest.cloneTokens ?? []), ...(manifest.cloneTokens100B ?? [])]) {
    if (typeof entry.assetId === "string") {
      existingAssetIds.add(entry.assetId);
    }
  }

  const cloneResults: Array<Record<string, unknown>> = [];
  const newPools: Array<Record<string, unknown>> = [];
  const pendingTokens: Array<{
    token: (typeof catalog.tokens)[number];
    amounts: ReturnType<typeof resolveCloneTokenAmounts>;
  }> = [];
  let totalWzWrap = 0n;

  for (const token of catalog.tokens) {
    if (existingAssetIds.has(token.assetId)) {
      console.log(`Skipping ${token.symbol} (${token.assetId}) — already minted`);
      continue;
    }

    if (existingSymbols.has(token.symbol) && !process.env.ZBC_CLONE_FORCE_REMINT && !token.assetId.includes("-100B-")) {
      console.log(`Skipping ${token.symbol} — already present in manifest`);
      continue;
    }

    const amounts = resolveCloneTokenAmounts(catalog, token.symbol);
    totalWzWrap += amounts.wrappedLiquidity;
    pendingTokens.push({ token, amounts });
  }

  if (totalWzWrap > 0n) {
    console.log(`Depositing ${totalWzWrap} wei into WZ before seeding clone pools...`);
    await waitForTransaction(await wrappedZ.deposit({ value: totalWzWrap }));
  }

  for (const { token, amounts } of pendingTokens) {
    console.log(`Minting clone token ${token.symbol} (${token.assetId})...`);
    const tokenAddress = await issueAsset(
      assetFactory,
      token.assetId,
      token.assetClass,
      token.name,
      token.symbol,
      amounts.supply,
      walletAddress
    );

    const pool = await bootstrapLiquidityPool(
      signer,
      walletAddress,
      compliance,
      tokenAddress,
      manifest.contracts.wrappedZBlockChainToken.address,
      `${token.symbol} / WZ Liquidity Pool`,
      `NLP-${token.symbol}-WZ`,
      amounts.liquidity,
      amounts.wrappedLiquidity,
      token.symbol,
      "WZ"
    );

    const tokenEntry = {
      symbol: token.symbol,
      address: tokenAddress,
      capabilities: token.capabilities
    };
    const existingIndex = manifest.tradableTokens.findIndex((entry) => entry.symbol === token.symbol);
    if (existingIndex >= 0) {
      manifest.tradableTokens[existingIndex] = tokenEntry;
    } else {
      manifest.tradableTokens.push(tokenEntry);
    }
    newPools.push(pool);
    cloneResults.push({
      assetId: token.assetId,
      symbol: token.symbol,
      name: token.name,
      cloneOf: token.cloneOf,
      address: tokenAddress,
      pool: pool.pool,
      capabilities: token.capabilities
    });
  }

  if (cloneResults.length === 0) {
    console.log("No clone tokens to mint.");
    return;
  }

  manifest.liquidity.pools.push(...newPools);
  const tierKey = catalog.defaultSupply === "100000000000" ? "cloneTokens100B" : "cloneTokens";
  const existingTier = (manifest[tierKey] ?? []) as Array<Record<string, unknown>>;
  manifest[tierKey] = [...existingTier, ...cloneResults];
  manifest.deployedAt = new Date().toISOString();

  mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log("Clone token mint complete");
  console.log(JSON.stringify({ minted: cloneResults.length, tokens: cloneResults }, null, 2));
}

main().catch((error) => {
  console.error("Clone token mint failed", error);
  process.exit(1);
});
