import {
  basementNetwork,
  formatChainIdentifier,
  multiNetworkProfiles,
  type ChainProfile
} from "./chains";

export interface BridgeLaneView {
  from: number;
  to: number;
  fromName?: string;
  toName?: string;
  purpose?: string;
  status?: string;
}

export interface PublicNetworkView {
  name?: string;
  chainId?: number;
  networkType?: string;
  networkId?: string;
  nativeSymbol?: string;
  wrappedSymbol?: string;
  status?: string;
}

export interface MultiNetworkOverview {
  shellSignals: Array<{ label: string; value: string; tone: string }>;
  chainProfiles: ChainProfile[];
  basementNetwork: ChainProfile;
  summary: {
    basementNetwork: Record<string, unknown>;
    publicNetworkCount: number;
    bridgeLaneCount: number;
    permissionedBridgeCount: number;
    capabilities: Record<string, boolean>;
  };
  publicNetworks: PublicNetworkView[];
  bridgeLanes: BridgeLaneView[];
  permissionedBridges: BridgeLaneView[];
  tokens: Array<{
    symbol: string;
    name: string;
    assetClass: string;
    networks: string[];
    capabilities: Record<string, boolean>;
  }>;
}

const apiBaseUrl = process.env.NOVA_API_URL ?? "http://127.0.0.1:4000";
const apiHeaders = { "x-nova-role": process.env.NOVA_DASHBOARD_ROLE ?? "AUDITOR" };

function getFallback(): MultiNetworkOverview {
  return {
    shellSignals: [
      { label: "Basement network", value: "TRON mainnet", tone: "positive" },
      { label: "Public EVM", value: "Ethereum + BNB", tone: "positive" },
      { label: "Bridge lanes", value: "3 active", tone: "neutral" },
      { label: "Custody", value: "Multi-network ready", tone: "positive" }
    ],
    chainProfiles: multiNetworkProfiles,
    basementNetwork,
    summary: {
      basementNetwork: {
        name: basementNetwork.name,
        chainId: basementNetwork.chainId,
        networkType: basementNetwork.networkType,
        networkId: basementNetwork.networkId,
        nativeSymbol: basementNetwork.nativeSymbol
      },
      publicNetworkCount: 3,
      bridgeLaneCount: 3,
      permissionedBridgeCount: 2,
      capabilities: {
        multiNetworkCustody: true,
        crossChainSettlement: true,
        publicNetworkTrading: true
      }
    },
    publicNetworks: multiNetworkProfiles.map((network) => ({
      name: network.name,
      chainId: network.chainId,
      slug: network.slug,
      networkType: network.networkType,
      networkId: network.networkId,
      nativeSymbol: network.nativeSymbol,
      wrappedSymbol: network.wrappedSymbol,
      status: network.status
    })),
    bridgeLanes: [
      {
        from: 728126428,
        to: 1,
        fromName: "TRON",
        toName: "Ethereum",
        status: "active",
        purpose: "Basement foundation to Ethereum public settlement"
      },
      {
        from: 728126428,
        to: 56,
        fromName: "TRON",
        toName: "BNB Smart Chain",
        status: "active",
        purpose: "Basement foundation to BNB Smart Chain liquidity"
      },
      {
        from: 1,
        to: 56,
        fromName: "Ethereum",
        toName: "BNB Smart Chain",
        status: "active",
        purpose: "Ethereum to BNB Smart Chain routing"
      }
    ],
    permissionedBridges: [
      {
        from: 728126428,
        to: 44002,
        fromName: "TRON",
        toName: "Z Blockchain",
        status: "active",
        purpose: "TRON basement to Z Online Bank liquidity"
      },
      {
        from: 728126428,
        to: 22016,
        fromName: "TRON",
        toName: "Nova One",
        status: "active",
        purpose: "TRON basement to Nova One settlement"
      }
    ],
    tokens: [
      {
        symbol: "TRX",
        name: "TRON",
        assetClass: "Native",
        networks: ["TRON"],
        capabilities: { transferable: true, tradable: true, swappable: true, zBankLoadable: false }
      },
      {
        symbol: "ETH",
        name: "Ether",
        assetClass: "Native",
        networks: ["Ethereum"],
        capabilities: { transferable: true, tradable: true, swappable: true, zBankLoadable: false }
      },
      {
        symbol: "BNB",
        name: "BNB",
        assetClass: "Native",
        networks: ["BNB Smart Chain"],
        capabilities: { transferable: true, tradable: true, swappable: true, zBankLoadable: false }
      },
      {
        symbol: "USDT",
        name: "Tether USD",
        assetClass: "Stablecoin",
        networks: ["TRON", "Ethereum", "BNB Smart Chain"],
        capabilities: { transferable: true, tradable: true, swappable: true, zBankLoadable: false }
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        assetClass: "Stablecoin",
        networks: ["TRON", "Ethereum", "BNB Smart Chain"],
        capabilities: { transferable: true, tradable: true, swappable: true, zBankLoadable: false }
      }
    ]
  };
}

export async function getMultiNetworkOverviewData(): Promise<MultiNetworkOverview> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/networks/multi`, {
      headers: apiHeaders,
      next: { revalidate: 30 }
    });
    if (!response.ok) throw new Error("multi-network request failed");
    const payload = (await response.json()) as {
      chart: {
        publicNetworks: MultiNetworkOverview["publicNetworks"];
        bridgeLanes: MultiNetworkOverview["bridgeLanes"];
        permissionedBridges: MultiNetworkOverview["permissionedBridges"];
      };
      summary: MultiNetworkOverview["summary"];
      tokens: MultiNetworkOverview["tokens"];
    };
    const fallback = getFallback();
    return {
      ...fallback,
      summary: payload.summary,
      publicNetworks: payload.chart.publicNetworks,
      bridgeLanes: payload.chart.bridgeLanes,
      permissionedBridges: payload.chart.permissionedBridges,
      tokens: payload.tokens
    };
  } catch {
    return getFallback();
  }
}

export { basementNetwork, formatChainIdentifier, multiNetworkProfiles };
