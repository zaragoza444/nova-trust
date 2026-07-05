import { zBlockChainProfile, zChainProfiles } from "./z-chains";

export interface ZBlockChainOverview {
  shellSignals: Array<{ label: string; value: string; tone: string }>;
  chainProfiles: typeof zChainProfiles;
  summary: {
    chainId: number;
    name: string;
    nativeSymbol: string;
    wrappedSymbol: string;
    liquidityPools: string[];
    tradableTokens: string[];
    capabilities: Record<string, boolean>;
  };
  bridgeLanes: Array<{ from: number; to: number; status: string; purpose: string }>;
  pairedNetworks: Array<{ name: string; chainId: number; relationship: string }>;
  topology: { validators: number; rpcNodes: number; bootnodes: number; blockPeriodSeconds: number };
  tokens: Array<{
    symbol: string;
    name: string;
    minLoadAmount: string;
    capabilities: Record<string, boolean>;
    liquidityPairs: string[];
  }>;
}

const apiBaseUrl = process.env.Z_API_URL ?? "http://127.0.0.1:4100";
const apiHeaders = { "x-z-role": process.env.Z_DASHBOARD_ROLE ?? "AUDITOR" };

function getFallback(): ZBlockChainOverview {
  return {
    shellSignals: [
      { label: "Z Blockchain", value: "Chain 44002 production", tone: "positive" },
      { label: "Z Online Bank", value: "M1 load rail active", tone: "positive" },
      { label: "Liquidity", value: "M1FIAT/ACX/SHIVA vs WZ", tone: "positive" },
      { label: "Capabilities", value: "Swap · Trade · Transfer", tone: "neutral" }
    ],
    chainProfiles: zChainProfiles,
    summary: {
      chainId: 44002,
      name: "Z Blockchain",
      nativeSymbol: "Z",
      wrappedSymbol: "WZ",
      liquidityPools: ["M1FIAT/WZ", "ACX/WZ", "SHIVA/WZ", "USDT/WZ", "ETH/WZ", "BTC/WZ", "BNB/WZ", "USDC/WZ"],
      tradableTokens: ["M1FIAT", "ACX", "SHIVA", "WZ", "USDT", "ETH", "BTC", "BNB", "USDC"],
      capabilities: {
        transferable: true,
        tradable: true,
        swappable: true,
        zBankLoadable: true,
        crossBankUsable: true,
        platformTradingUsable: true
      }
    },
    bridgeLanes: [
      { from: 728126428, to: 44002, status: "active", purpose: "TRON basement foundation to Z Online Bank liquidity" },
      { from: 1, to: 44002, status: "active", purpose: "Ethereum public settlement to Z Blockchain" },
      { from: 56, to: 44002, status: "active", purpose: "BNB Smart Chain liquidity routing to Z Blockchain" }
    ],
    pairedNetworks: [
      { name: "TRON", chainId: 728126428, relationship: "basement-foundation" },
      { name: "Ethereum", chainId: 1, relationship: "public-evm-settlement" },
      { name: "BNB Smart Chain", chainId: 56, relationship: "public-evm-liquidity" }
    ],
    topology: { validators: 4, rpcNodes: 2, bootnodes: 1, blockPeriodSeconds: 5 },
    tokens: [
      { symbol: "M1FIAT", name: "M1 Fiat Token", minLoadAmount: "1", capabilities: { transferable: true, tradable: true, swappable: true, zBankLoadable: true }, liquidityPairs: ["WZ", "ACX", "SHIVA"] },
      { symbol: "ACX", name: "ACX Token", minLoadAmount: "1", capabilities: { transferable: true, tradable: true, swappable: true, zBankLoadable: true }, liquidityPairs: ["WZ", "M1FIAT"] },
      { symbol: "SHIVA", name: "Shiva Token", minLoadAmount: "1", capabilities: { transferable: true, tradable: true, swappable: true, zBankLoadable: true }, liquidityPairs: ["WZ", "M1FIAT"] }
    ]
  };
}

export async function getZBlockChainOverviewData(): Promise<ZBlockChainOverview> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/z-chain/chart`, {
      headers: apiHeaders,
      next: { revalidate: 30 }
    });
    if (!response.ok) throw new Error("z-chain chart request failed");
    const payload = (await response.json()) as {
      chart: Omit<ZBlockChainOverview, "shellSignals" | "chainProfiles">;
    };
    const fallback = getFallback();
    return {
      ...fallback,
      summary: payload.chart.summary,
      bridgeLanes: payload.chart.bridgeLanes,
      pairedNetworks: payload.chart.pairedNetworks,
      topology: payload.chart.topology,
      tokens: payload.chart.tokens
    };
  } catch {
    return getFallback();
  }
}

export { zBlockChainProfile, zChainProfiles };
