import { chainProfiles, zBankChain } from "./chains";

export interface ZBlockChainOverview {
  shellSignals: Array<{ label: string; value: string; tone: string }>;
  chainProfiles: typeof chainProfiles;
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

const apiBaseUrl = process.env.NOVA_API_URL ?? "http://127.0.0.1:4000";
const apiHeaders = { "x-nova-role": process.env.NOVA_DASHBOARD_ROLE ?? "AUDITOR" };

function getFallback(): ZBlockChainOverview {
  return {
    shellSignals: [
      { label: "Z Blockchain", value: "Chain 44002 production", tone: "positive" },
      { label: "Z Online Bank", value: "M1 load rail active", tone: "positive" },
      { label: "Liquidity", value: "M1FIAT/ACX/SHIVA vs WZ", tone: "positive" },
      { label: "Capabilities", value: "Swap · Trade · Transfer", tone: "neutral" }
    ],
    chainProfiles,
    summary: {
      chainId: 44002,
      name: "Z Blockchain",
      nativeSymbol: "Z",
      wrappedSymbol: "WZ",
      liquidityPools: ["M1FIAT/WZ", "ACX/WZ", "SHIVA/WZ", "USDT/WZ", "ETH/WZ", "BTC/WZ", "BNB/WZ", "USDC/WZ", "XRCUSDC/WZ", "CUSDT/WZ", "ICX/WZ", "AUSDT/WZ", "CHAT/WZ"],
      tradableTokens: ["M1FIAT", "ACX", "SHIVA", "WZ", "USDT", "ETH", "BTC", "BNB", "USDC", "XRCUSDC", "CUSDT", "ICX", "AUSDT", "CHAT"],
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
      { from: 22016, to: 44002, status: "active", purpose: "Nova One settlement to Z Online Bank liquidity" },
      { from: 33001, to: 44002, status: "active", purpose: "NRW World world liquidity to Z Blockchain" },
      { from: 138, to: 44002, status: "active", purpose: "Chain 138 bank rail to Z Online Bank" }
    ],
    pairedNetworks: [
      { name: "TRON", chainId: 728126428, relationship: "basement-foundation" },
      { name: "Ethereum", chainId: 1, relationship: "public-evm-settlement" },
      { name: "BNB Smart Chain", chainId: 56, relationship: "public-evm-liquidity" },
      { name: "Nova One", chainId: 22016, relationship: "primary-settlement" },
      { name: "NRW World", chainId: 33001, relationship: "world-bridge" },
      { name: "Chain 138", chainId: 138, relationship: "omnl-settlement" }
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
    if (!response.ok) throw new Error("chart request failed");
    const payload = (await response.json()) as {
      chart: {
        bridgeLanes: ZBlockChainOverview["bridgeLanes"];
        pairedNetworks: ZBlockChainOverview["pairedNetworks"];
        topology: ZBlockChainOverview["topology"];
      };
      summary: ZBlockChainOverview["summary"];
      tokens: ZBlockChainOverview["tokens"];
    };
    const fallback = getFallback();
    return {
      ...fallback,
      summary: payload.summary,
      bridgeLanes: payload.chart.bridgeLanes,
      pairedNetworks: payload.chart.pairedNetworks,
      topology: payload.chart.topology,
      tokens: payload.tokens as ZBlockChainOverview["tokens"]
    };
  } catch {
    return getFallback();
  }
}

export { zBankChain };
