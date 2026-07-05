import { readFileSync } from "node:fs";
import path from "node:path";
import { getOraclePriceOverview } from "./price-oracle";
import { loadTradableTokenRegistry, loadTradingPlatformRegistry } from "./tradable-tokens";

const repoRoot = path.resolve(__dirname, "../../../..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), "utf8")) as T;
}

export function loadZEcosystemRegistry() {
  return readJson<{
    brand: { name: string; tagline: string; style: string };
    settlementChain: { id: string; name: string; chainId: number; nativeSymbol: string; wrappedSymbol: string };
    products: Array<{ id: string; name: string; path: string; apiPath: string; description: string }>;
  }>("config/integrations/z-ecosystem.v1.json");
}

export function getZEcosystemOverview() {
  const registry = loadZEcosystemRegistry();
  const oracle = getOraclePriceOverview();
  return {
    brand: registry.brand,
    settlementChain: registry.settlementChain,
    products: registry.products,
    oracleFeedCount: oracle.prices.length,
    marketCount: oracle.prices.length
  };
}

export function getZSwapOverview() {
  const chart = readJson<{
    chain: { name: string; chainId: number; wrappedSymbol: string };
    liquidityPools: string[];
    capabilities: Record<string, boolean>;
  }>("config/chains/z-block-chain.v1.json");
  const tokenRegistry = loadTradableTokenRegistry();

  const pools = chart.liquidityPools.map((pair) => {
    const [base, quote] = pair.split("/");
    const baseToken = tokenRegistry.tokens.find((token) => token.symbol === base);
    return {
      pair,
      base,
      quote,
      feeBps: 30,
      status: "active",
      venue: "Z Swap",
      capabilities: baseToken?.capabilities ?? { swappable: true, tradable: true, transferable: true }
    };
  });

  return {
    chain: chart.chain,
    venue: "Z Swap",
    style: "binance-swap",
    poolCount: pools.length,
    pools,
    capabilities: chart.capabilities
  };
}

export function getZTradeMarkets() {
  const tokenRegistry = loadTradableTokenRegistry();
  const platformRegistry = loadTradingPlatformRegistry();
  const oracle = getOraclePriceOverview();
  const priceMap = new Map(oracle.prices.map((entry) => [entry.symbol, entry.priceUsd]));

  const markets = tokenRegistry.tokens.map((token) => ({
    symbol: token.symbol,
    name: token.name,
    pair: `${token.symbol}/WZ`,
    priceUsd: priceMap.get(token.symbol) ?? "0",
    minLoadAmount: token.minLoadAmount,
    assetClass: token.assetClass,
    capabilities: token.capabilities,
    liquidityPairs: token.liquidityPairs,
    venue: "Z Trade"
  }));

  return {
    chain: tokenRegistry.chain,
    venue: "Z Trade",
    style: "binance-spot",
    marketCount: markets.length,
    markets,
    approvedPlatforms: platformRegistry.platforms
  };
}

export function getZChartMarkets() {
  const oracle = getOraclePriceOverview();
  const tokenRegistry = loadTradableTokenRegistry();
  const tokenMap = new Map(tokenRegistry.tokens.map((token) => [token.symbol, token]));

  const markets = oracle.prices.map((entry, index) => {
    const token = tokenMap.get(entry.symbol);
    const price = Number(entry.priceUsd);
    const change24h = ((index % 7) - 3) * 0.85;
    return {
      rank: index + 1,
      symbol: entry.symbol,
      name: token?.name ?? entry.symbol,
      priceUsd: entry.priceUsd,
      change24hPct: change24h.toFixed(2),
      category: entry.category,
      referenceSource: entry.referenceSource,
      onChainActive: (entry as { onChain?: { active?: boolean } }).onChain?.active !== false,
      tradable: token?.capabilities.tradable ?? true,
      swappable: token?.capabilities.swappable ?? true
    };
  });

  return {
    chain: oracle.chain ?? tokenRegistry.chain,
    venue: "Z Chart",
    style: "binance-markets",
    quoteCurrency: oracle.quoteCurrency,
    priceOracleAddress: oracle.priceOracleAddress,
    marketCount: markets.length,
    markets,
    updatedAt: new Date().toISOString()
  };
}
