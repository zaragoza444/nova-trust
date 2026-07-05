const apiBaseUrl = process.env.Z_API_URL ?? "http://127.0.0.1:4100";
const apiHeaders = { "x-z-role": process.env.Z_DASHBOARD_ROLE ?? "AUDITOR" };

export interface ZEcosystemOverview {
  brand: { name: string; tagline: string; style: string };
  settlementChain: { id: string; name: string; chainId: number; nativeSymbol: string; wrappedSymbol: string };
  products: Array<{ id: string; name: string; path: string; apiPath: string; description: string }>;
  oracleFeedCount: number;
  marketCount: number;
}

export interface ZChartMarket {
  rank: number;
  symbol: string;
  name: string;
  priceUsd: string;
  change24hPct: string;
  category: string;
  tradable: boolean;
  swappable: boolean;
}

export interface ZSwapPool {
  pair: string;
  base: string;
  quote: string;
  feeBps: number;
  status: string;
  venue: string;
}

export interface ZTradeMarket {
  symbol: string;
  name: string;
  pair: string;
  priceUsd: string;
  assetClass: string;
  venue: string;
}

function getFallbackOverview(): ZEcosystemOverview {
  return {
    brand: {
      name: "Z Ecosystem",
      tagline: "Z Chain · Z Wallet · Z Bank · Z Swap · Z Trade · Z Chart",
      style: "binance-production"
    },
    settlementChain: { id: "z-chain", name: "Z Chain", chainId: 44002, nativeSymbol: "Z", wrappedSymbol: "WZ" },
    products: [
      { id: "z-chart", name: "Z Chart", path: "/zchart", apiPath: "/api/zchart/markets", description: "Markets" },
      { id: "z-trade", name: "Z Trade", path: "/ztrade", apiPath: "/api/ztrade/markets", description: "Spot" },
      { id: "z-swap", name: "Z Swap", path: "/zswap", apiPath: "/api/zswap/pools", description: "Swap" },
      { id: "z-wallet", name: "Z Wallet", path: "/wallet", apiPath: "/api/z-wallet/overview", description: "Wallet" },
      { id: "z-bank", name: "Z Bank", path: "/zbank", apiPath: "/api/zbank/integration", description: "Bank" },
      { id: "z-chain", name: "Z Chain", path: "/z-chain", apiPath: "/api/z-chain/chart", description: "Chain" }
    ],
    oracleFeedCount: 14,
    marketCount: 14
  };
}

export async function getZEcosystemOverviewData(): Promise<ZEcosystemOverview> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/z-ecosystem/overview`, { headers: apiHeaders, next: { revalidate: 30 } });
    if (!response.ok) throw new Error("failed");
    return (await response.json()) as ZEcosystemOverview;
  } catch {
    return getFallbackOverview();
  }
}

export async function getZChartMarketsData(): Promise<{ markets: ZChartMarket[]; marketCount: number; quoteCurrency: string }> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/zchart/markets`, { headers: apiHeaders, next: { revalidate: 15 } });
    if (!response.ok) throw new Error("failed");
    const payload = (await response.json()) as { markets: ZChartMarket[]; marketCount: number; quoteCurrency: string };
    return payload;
  } catch {
    return {
      marketCount: 6,
      quoteCurrency: "USD",
      markets: [
        { rank: 1, symbol: "BTC", name: "Bitcoin Clone", priceUsd: "108432.75", change24hPct: "1.24", category: "Synthetic", tradable: true, swappable: true },
        { rank: 2, symbol: "ETH", name: "Ethereum Clone", priceUsd: "3842.10", change24hPct: "-0.42", category: "Synthetic", tradable: true, swappable: true },
        { rank: 3, symbol: "M1FIAT", name: "M1 Fiat Token", priceUsd: "1.00", change24hPct: "0.00", category: "Stablecoin", tradable: true, swappable: true }
      ]
    };
  }
}

export async function getZSwapPoolsData(): Promise<{ pools: ZSwapPool[]; poolCount: number }> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/zswap/pools`, { headers: apiHeaders, next: { revalidate: 30 } });
    if (!response.ok) throw new Error("failed");
    const payload = (await response.json()) as { pools: ZSwapPool[]; poolCount: number };
    return payload;
  } catch {
    return {
      poolCount: 3,
      pools: [
        { pair: "M1FIAT/WZ", base: "M1FIAT", quote: "WZ", feeBps: 30, status: "active", venue: "Z Swap" },
        { pair: "ACX/WZ", base: "ACX", quote: "WZ", feeBps: 30, status: "active", venue: "Z Swap" },
        { pair: "SHIVA/WZ", base: "SHIVA", quote: "WZ", feeBps: 30, status: "active", venue: "Z Swap" }
      ]
    };
  }
}

export async function getZTradeMarketsData(): Promise<{ markets: ZTradeMarket[]; marketCount: number }> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/ztrade/markets`, { headers: apiHeaders, next: { revalidate: 15 } });
    if (!response.ok) throw new Error("failed");
    const payload = (await response.json()) as { markets: ZTradeMarket[]; marketCount: number };
    return payload;
  } catch {
    return {
      marketCount: 3,
      markets: [
        { symbol: "M1FIAT", name: "M1 Fiat Token", pair: "M1FIAT/WZ", priceUsd: "1.00", assetClass: "Stablecoin", venue: "Z Trade" },
        { symbol: "ACX", name: "ACX Token", pair: "ACX/WZ", priceUsd: "12.50", assetClass: "Exchange", venue: "Z Trade" },
        { symbol: "SHIVA", name: "Shiva Token", pair: "SHIVA/WZ", priceUsd: "8.75", assetClass: "Utility", venue: "Z Trade" }
      ]
    };
  }
}
