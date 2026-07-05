import { chain138Profile, chainProfiles as allChains, settlementChain } from "./chains";

export interface TokenCapabilities {
  transferable: boolean;
  tradable: boolean;
  swappable: boolean;
  zBankLoadable: boolean;
}

export interface TradableToken {
  assetId: string;
  symbol: string;
  name: string;
  assetClass: string;
  jurisdiction: string;
  minLoadAmount: string;
  capabilities: TokenCapabilities;
  liquidityPairs: string[];
  notes?: string;
}

export interface TradingPlatform {
  id: string;
  name: string;
  type: string;
  supportedTokens: string[];
  capabilities: string[];
}

export interface TradingOverviewData {
  shellSignals: Array<{ label: string; value: string; tone: string }>;
  chainProfiles: typeof allChains;
  chain: {
    name: string;
    chainId: number;
    settlementChain?: { name: string; chainId: number };
  };
  tokens: TradableToken[];
  approvedTokens: string[];
  approvedPlatforms: TradingPlatform[];
  tradingMetrics: Array<{ label: string; value: string; delta: string }>;
  tradingInsights: Array<{ label: string; value: string }>;
}

export interface ZBankIntegrationData {
  shellSignals: Array<{ label: string; value: string; tone: string }>;
  provider: {
    id: string;
    name: string;
    channel: string;
    status: string;
  };
  supportedChains: Array<{ chainId: number; name: string }>;
  supportedTokens: string[];
  loadMethods: Array<{
    id: string;
    label: string;
    description: string;
    minAmount: string;
    settlementToken: string;
    requiresKyc: boolean;
  }>;
  capabilities: TokenCapabilities & {
    crossBankUsable: boolean;
    platformTradingUsable: boolean;
  };
  tradableTokens: Array<{
    symbol: string;
    name: string;
    minLoadAmount: string;
    capabilities: TokenCapabilities;
    liquidityPairs: string[];
  }>;
  approvedPlatforms: Array<{
    id: string;
    name: string;
    type: string;
    supportedTokens: string[];
    capabilities: string[];
  }>;
}

const fallbackTokens: TradableToken[] = [
  {
    assetId: "M1FIAT-2026-001",
    symbol: "M1FIAT",
    name: "M1 Fiat Token",
    assetClass: "Stablecoin",
    jurisdiction: "GLOBAL",
    minLoadAmount: "1",
    capabilities: {
      transferable: true,
      tradable: true,
      swappable: true,
      zBankLoadable: true
    },
    liquidityPairs: ["WNOVA", "ACX", "SHIVA"]
  },
  {
    assetId: "ACX-2026-001",
    symbol: "ACX",
    name: "ACX Token",
    assetClass: "Exchange",
    jurisdiction: "GLOBAL",
    minLoadAmount: "1",
    capabilities: {
      transferable: true,
      tradable: true,
      swappable: true,
      zBankLoadable: true
    },
    liquidityPairs: ["WNOVA", "M1FIAT"]
  },
  {
    assetId: "SHIVA-2026-001",
    symbol: "SHIVA",
    name: "Shiva Token",
    assetClass: "Utility",
    jurisdiction: "GLOBAL",
    minLoadAmount: "1",
    capabilities: {
      transferable: true,
      tradable: true,
      swappable: true,
      zBankLoadable: true
    },
    liquidityPairs: ["WNOVA", "M1FIAT"]
  }
];

const fallbackPlatforms: TradingPlatform[] = [
  {
    id: "z-bank-online",
    name: "Z Bank Online",
    type: "bank",
    supportedTokens: ["M1FIAT", "ACX", "SHIVA"],
    capabilities: ["load", "transfer", "trade"]
  },
  {
    id: "nova-liquidity-pool",
    name: "Nova Liquidity Pool",
    type: "dex",
    supportedTokens: ["M1FIAT", "ACX", "SHIVA", "WNOVA"],
    capabilities: ["swap", "add-liquidity", "remove-liquidity"]
  },
  {
    id: "omnl-exchange",
    name: "OMNL Exchange",
    type: "exchange",
    supportedTokens: ["M1FIAT", "ACX", "SHIVA"],
    capabilities: ["trade", "transfer", "settle"]
  },
  {
    id: "partner-banks",
    name: "Partner Banks Network",
    type: "bank-network",
    supportedTokens: ["M1FIAT", "ACX", "SHIVA"],
    capabilities: ["transfer", "trade", "settle"]
  }
];

const apiBaseUrl = process.env.NOVA_API_URL ?? "http://127.0.0.1:4000";
const apiHeaders = {
  "x-nova-role": process.env.NOVA_DASHBOARD_ROLE ?? "AUDITOR"
};

function getFallbackTradingData(): TradingOverviewData {
  return {
    shellSignals: [
      { label: "Chain 138 rail", value: "M1 / ACX / SHIVA live", tone: "positive" },
      { label: "Swap venues", value: "3 WNOVA pools", tone: "positive" },
      { label: "Z Bank load", value: "Online M1 channel", tone: "neutral" },
      { label: "Platforms", value: `${fallbackPlatforms.length} approved`, tone: "positive" }
    ],
    chainProfiles: allChains,
    chain: {
      name: "Chain 138",
      chainId: 138,
      settlementChain: { name: settlementChain.name, chainId: settlementChain.chainId }
    },
    tokens: fallbackTokens,
    approvedTokens: ["M1FIAT", "ACX", "SHIVA", "WNOVA"],
    approvedPlatforms: fallbackPlatforms,
    tradingMetrics: [
      { label: "Tradable tokens", value: `${fallbackTokens.length}`, delta: "3 on Chain 138" },
      { label: "Liquidity pairs", value: "3", delta: "M1FIAT, ACX, SHIVA vs WNOVA" },
      { label: "Approved platforms", value: `${fallbackPlatforms.length}`, delta: "banks and exchanges" },
      { label: "Settlement chain", value: settlementChain.name, delta: `Chain ${settlementChain.chainId}` }
    ],
    tradingInsights: [
      { label: "Primary settlement", value: `${chain138Profile.name} (${chain138Profile.chainId})` },
      { label: "Wrapped native", value: chain138Profile.wrappedSymbol },
      { label: "Cross-bank usage", value: "Enabled for approved venues" }
    ]
  };
}

function getFallbackZBankData(): ZBankIntegrationData {
  return {
    shellSignals: [
      { label: "Provider", value: "Z Bank Online", tone: "positive" },
      { label: "Channel", value: "M1", tone: "neutral" },
      { label: "Loadable tokens", value: "M1FIAT, ACX, SHIVA", tone: "positive" },
      { label: "KYC", value: "Required", tone: "neutral" }
    ],
    provider: {
      id: "z-bank-online",
      name: "Z Bank Online",
      channel: "M1",
      status: "active"
    },
    supportedChains: [
      { chainId: 138, name: "Chain 138" },
      { chainId: 22016, name: "Nova One" }
    ],
    supportedTokens: ["M1FIAT", "ACX", "SHIVA"],
    loadMethods: [
      {
        id: "zbank-m1-online-transfer",
        label: "Z Bank Online M1 Transfer",
        description: "Load M1FIAT, ACX, or SHIVA from Z Bank online into a compliant Chain 138 wallet.",
        minAmount: "1",
        settlementToken: "M1FIAT",
        requiresKyc: true
      }
    ],
    capabilities: {
      transferable: true,
      tradable: true,
      swappable: true,
      zBankLoadable: true,
      crossBankUsable: true,
      platformTradingUsable: true
    },
    tradableTokens: fallbackTokens.map((token) => ({
      symbol: token.symbol,
      name: token.name,
      minLoadAmount: token.minLoadAmount,
      capabilities: token.capabilities,
      liquidityPairs: token.liquidityPairs
    })),
    approvedPlatforms: fallbackPlatforms
  };
}

export async function getTradingOverviewData(): Promise<TradingOverviewData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/trading/tokens`, {
      headers: apiHeaders,
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      chain: TradingOverviewData["chain"];
      tokens: TradableToken[];
      approvedPlatforms: TradingPlatform[];
      approvedTokens: string[];
    };

    const fallback = getFallbackTradingData();

    return {
      ...fallback,
      chain: payload.chain,
      tokens: payload.tokens,
      approvedPlatforms: payload.approvedPlatforms,
      approvedTokens: payload.approvedTokens
    };
  } catch {
    return getFallbackTradingData();
  }
}

export async function getZBankIntegrationData(): Promise<ZBankIntegrationData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/zbank/integration`, {
      headers: apiHeaders,
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as ZBankIntegrationData;
    return {
      ...getFallbackZBankData(),
      ...payload,
      shellSignals: getFallbackZBankData().shellSignals
    };
  } catch {
    return getFallbackZBankData();
  }
}
