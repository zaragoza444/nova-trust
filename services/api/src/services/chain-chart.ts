import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../../..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), "utf8")) as T;
}

export function loadZBlockChainChart() {
  return readJson("config/chains/z-block-chain.v1.json");
}

export function loadZBlockChainTradableTokens() {
  return readJson("config/tokens/z-block-chain-tradable-tokens.v1.json");
}

export function getZBlockChainOverview() {
  const chart = loadZBlockChainChart() as {
    chain: Record<string, unknown>;
    pairedNetworks: Array<Record<string, unknown>>;
    bridgeLanes: Array<Record<string, unknown>>;
    topology: Record<string, unknown>;
    tradableTokens: string[];
    liquidityPools: string[];
    capabilities: Record<string, boolean>;
    integrations: Record<string, string>;
  };
  const tokens = loadZBlockChainTradableTokens() as { tokens: Array<Record<string, unknown>> };

  return {
    chart,
    tokens: tokens.tokens,
    summary: {
      chainId: chart.chain.chainId,
      name: chart.chain.name,
      nativeSymbol: chart.chain.nativeSymbol,
      wrappedSymbol: chart.chain.wrappedSymbol,
      liquidityPools: chart.liquidityPools,
      tradableTokens: chart.tradableTokens,
      capabilities: chart.capabilities
    }
  };
}

export function loadMultiNetworkChart() {
  return readJson("config/chains/multi-network.v1.json");
}

export function loadPublicNetworkTokens() {
  return readJson("config/tokens/public-network-tokens.v1.json");
}

export function getMultiNetworkOverview() {
  const chart = loadMultiNetworkChart() as {
    basementNetwork: Record<string, unknown>;
    publicNetworks: Array<Record<string, unknown>>;
    bridgeLanes: Array<Record<string, unknown>>;
    permissionedBridges: Array<Record<string, unknown>>;
    capabilities: Record<string, boolean>;
    integrations: Record<string, string>;
  };
  const tokenRegistry = loadPublicNetworkTokens() as {
    networks: Array<Record<string, unknown>>;
    tokens: Array<Record<string, unknown>>;
  };

  return {
    chart,
    tokens: tokenRegistry.tokens,
    networks: tokenRegistry.networks,
    summary: {
      basementNetwork: chart.basementNetwork,
      publicNetworkCount: chart.publicNetworks.length,
      bridgeLaneCount: chart.bridgeLanes.length,
      permissionedBridgeCount: chart.permissionedBridges.length,
      capabilities: chart.capabilities
    }
  };
}
