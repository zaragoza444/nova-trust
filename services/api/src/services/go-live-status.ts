import { readFileSync } from "node:fs";
import path from "node:path";
import { Contract, JsonRpcProvider } from "ethers";
import { getMultiNetworkConfigStatus, loadMultiNetworkConfig } from "../config/multi-network-config";
import { zBlockChainProfile } from "./chain-registry";
import { MultiNetworkService } from "./multi-network-service";
import { getOraclePriceOverview } from "./price-oracle";

const repoRoot = path.resolve(__dirname, "../../../..");

function loadManifestSnapshot() {
  try {
    return JSON.parse(
      readFileSync(path.resolve(repoRoot, "contracts/deployments/z-blockchain-production-liquidity.json"), "utf8")
    ) as {
      contracts?: { priceOracle?: { address: string } };
      tradableTokens?: Array<{ symbol: string; address: string }>;
      oracle?: { feeds?: Array<{ symbol: string; active?: boolean }> };
    };
  } catch {
    return null;
  }
}

async function checkZBlockChainRpc(rpcUrl: string) {
  const started = Date.now();
  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const [network, blockNumber] = await Promise.all([provider.getNetwork(), provider.getBlockNumber()]);
    return {
      ok: network.chainId === BigInt(zBlockChainProfile.chainId),
      chainId: Number(network.chainId),
      latestBlock: blockNumber,
      latencyMs: Date.now() - started
    };
  } catch (error) {
    return {
      ok: false,
      chainId: zBlockChainProfile.chainId,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

async function checkBtcClone(rpcUrl: string, manifest: NonNullable<ReturnType<typeof loadManifestSnapshot>>) {
  const btc = manifest.tradableTokens?.find((token) => token.symbol === "BTC");
  if (!btc) {
    return { minted: false, symbol: "BTC" as const };
  }

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const token = new Contract(btc.address, ["function symbol() view returns (string)", "function totalSupply() view returns (uint256)"], provider);
    const [symbol, totalSupply] = await Promise.all([token.symbol(), token.totalSupply()]);
    return {
      minted: true,
      symbol,
      address: btc.address,
      totalSupply: totalSupply.toString()
    };
  } catch (error) {
    return {
      minted: true,
      address: btc.address,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function getGoLiveStatus() {
  const config = loadMultiNetworkConfig();
  const manifest = loadManifestSnapshot();
  const rpcUrl = process.env.ZBC_RPC_URL ?? config.zBlockChainRpcUrl;
  const multiNetwork = new MultiNetworkService();
  const [zBlockChain, networkHealth, oracle] = await Promise.all([
    checkZBlockChainRpc(rpcUrl),
    multiNetwork.runHealthCheck(),
    Promise.resolve(getOraclePriceOverview())
  ]);
  const btc = manifest ? await checkBtcClone(rpcUrl, manifest) : { minted: false, symbol: "BTC" as const };

  const oracleAddress = manifest?.contracts?.priceOracle?.address ?? oracle.priceOracleAddress;
  const oracleFeedCount = oracle.prices.filter((entry) => entry.onChain?.active !== false).length;
  const live =
    zBlockChain.ok &&
    networkHealth.allPublicNetworksHealthy &&
    Boolean(oracleAddress) &&
    oracleFeedCount >= 14 &&
    btc.minted;

  return {
    status: live ? "live" : "degraded",
    checkedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
    zBlockChain: {
      name: zBlockChainProfile.name,
      status: zBlockChainProfile.status,
      rpcUrl,
      ...zBlockChain
    },
    multiNetwork: {
      config: getMultiNetworkConfigStatus(config),
      health: networkHealth
    },
    oracle: {
      address: oracleAddress,
      feedCount: oracleFeedCount,
      btcPriceUsd: oracle.prices.find((entry) => entry.symbol === "BTC")?.priceUsd ?? null
    },
    btcClone: btc,
    endpoints: {
      apiHealth: "/health",
      goLiveStatus: "/api/go-live/status",
      oraclePrices: "/api/oracle/prices",
      zChainChart: "/api/z-chain/chart",
      multiNetwork: "/api/networks/multi",
      multiNetworkHealth: "/api/networks/health",
      internationalWiring: "/api/networks/international",
      dashboard: process.env.NOVA_DASHBOARD_URL ?? "http://127.0.0.1:3000"
    }
  };
}
