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
