import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../../..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), "utf8")) as T;
}

export interface OraclePriceEntry {
  symbol: string;
  priceUsd: string;
  category: string;
  cloneOf?: string;
  referenceSource: string;
}

export interface OraclePriceRegistry {
  schemaVersion: number;
  chain: {
    name: string;
    chainId: number;
  };
  quoteCurrency: string;
  priceDecimals: number;
  prices: OraclePriceEntry[];
  source?: {
    registryPath: string;
    notes?: string;
  };
}

export interface OracleFeedRecord {
  symbol: string;
  token?: string;
  priceUsd: string;
  priceUsd8?: string;
  updatedAt?: string;
  active?: boolean;
}

export interface OracleManifestSnapshot {
  registryPath: string;
  quoteCurrency: string;
  priceDecimals: number;
  feeds: OracleFeedRecord[];
  priceOracleAddress?: string;
}

export function loadOraclePriceRegistry(
  relativePath = "config/oracles/z-block-chain-prices.v1.json"
): OraclePriceRegistry {
  return readJson(relativePath);
}

export function loadOracleManifestSnapshot(): OracleManifestSnapshot | null {
  try {
    const manifest = readJson<{
      contracts?: { priceOracle?: { address: string } };
      oracle?: OracleManifestSnapshot;
    }>("contracts/deployments/z-blockchain-production-liquidity.json");

    if (!manifest.oracle) {
      return null;
    }

    return {
      ...manifest.oracle,
      priceOracleAddress: manifest.contracts?.priceOracle?.address
    };
  } catch {
    return null;
  }
}

export function getOraclePriceOverview() {
  const registry = loadOraclePriceRegistry();
  const manifestSnapshot = loadOracleManifestSnapshot();
  const manifestFeeds = new Map((manifestSnapshot?.feeds ?? []).map((feed) => [feed.symbol, feed]));

  return {
    chain: registry.chain,
    quoteCurrency: registry.quoteCurrency,
    priceDecimals: registry.priceDecimals,
    registryPath: registry.source?.registryPath ?? "config/oracles/z-block-chain-prices.v1.json",
    priceOracleAddress: manifestSnapshot?.priceOracleAddress ?? null,
    prices: registry.prices.map((entry) => {
      const onChain = manifestFeeds.get(entry.symbol);
      return {
        symbol: entry.symbol,
        priceUsd: entry.priceUsd,
        category: entry.category,
        cloneOf: entry.cloneOf ?? null,
        referenceSource: entry.referenceSource,
        token: onChain?.token ?? null,
        onChain: onChain
          ? {
              priceUsd8: onChain.priceUsd8 ?? null,
              updatedAt: onChain.updatedAt ?? null,
              active: onChain.active ?? true
            }
          : null
      };
    })
  };
}

export function putOraclePrices(updates: Array<{ symbol: string; priceUsd: string }>) {
  const registry = loadOraclePriceRegistry();
  const knownSymbols = new Set(registry.prices.map((entry) => entry.symbol));
  const invalidSymbols = updates.filter((update) => !knownSymbols.has(update.symbol)).map((update) => update.symbol);

  if (invalidSymbols.length > 0) {
    throw new Error(`Unknown oracle symbols: ${invalidSymbols.join(", ")}`);
  }

  const updateMap = new Map(updates.map((update) => [update.symbol, update.priceUsd]));
  const nextPrices = registry.prices.map((entry) => ({
    ...entry,
    priceUsd: updateMap.get(entry.symbol) ?? entry.priceUsd
  }));

  return {
    status: "accepted",
    message: "Oracle price update accepted for deployment via setup-z-block-chain-oracle.ts",
    chain: registry.chain,
    quoteCurrency: registry.quoteCurrency,
    priceDecimals: registry.priceDecimals,
    prices: nextPrices.map((entry) => ({
      symbol: entry.symbol,
      priceUsd: entry.priceUsd,
      category: entry.category,
      cloneOf: entry.cloneOf ?? null,
      referenceSource: entry.referenceSource
    }))
  };
}
