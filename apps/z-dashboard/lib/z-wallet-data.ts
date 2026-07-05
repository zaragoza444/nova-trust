const apiBaseUrl = process.env.Z_API_URL ?? "http://127.0.0.1:4100";
const apiHeaders = { "x-z-role": process.env.Z_DASHBOARD_ROLE ?? "AUDITOR" };

export interface ZWalletOverview {
  product: { id: string; name: string; style: string; status: string };
  settlementChain: {
    chainId: number;
    name: string;
    nativeSymbol: string;
    wrappedSymbol: string;
    explorerLabel?: string;
  };
  wallet: {
    address: string;
    label: string;
    role: string;
    registered: boolean;
    registeredAt: string | null;
  };
  accounts: Array<{ id: string; name: string; description: string }>;
  capabilities: Record<string, boolean>;
  integrations: {
    zBankLoadEndpoint: string;
    tradingEndpoint: string;
    oracleEndpoint: string;
    depositAddress: string;
  };
  runtime: {
    product: string;
    style: string;
    walletAddress: string;
    settlementChainId: number;
    rpcUrl: string;
    privateKeyConfigured: boolean;
    signingReady: boolean;
    accounts: string[];
  };
  supportedTokens: string[];
}

export interface ZWalletBalances {
  checkedAt: string;
  walletAddress: string;
  settlementChain: ZWalletOverview["settlementChain"];
  portfolio: {
    totalUsd: string;
    fundingUsd: string;
    spotUsd: string;
    earnUsd: string;
  };
  accounts: Array<{ id: string; name: string; description: string; valueUsd: string }>;
  assets: Array<{
    symbol: string;
    name: string;
    account: string;
    balance: string;
    available: string;
    priceUsd: string;
    valueUsd: string;
    tokenAddress?: string;
  }>;
}

function getFallbackOverview(): ZWalletOverview {
  return {
    product: { id: "z-wallet", name: "Z Wallet", style: "binance-production", status: "active" },
    settlementChain: {
      chainId: 44002,
      name: "Z Blockchain",
      nativeSymbol: "Z",
      wrappedSymbol: "WZ",
      explorerLabel: "Z Blockchain Mainnet"
    },
    wallet: {
      address: "0xc2D6E6981D1A415967A683D615cf97bA9bC26F0f",
      label: "Z Wallet Production Treasury",
      role: "z-wallet-production",
      registered: false,
      registeredAt: null
    },
    accounts: [
      { id: "funding", name: "Funding", description: "Deposits, withdrawals, and Z Bank online loads" },
      { id: "spot", name: "Spot", description: "Swap and trade on Z Blockchain liquidity pools" },
      { id: "earn", name: "Earn", description: "Liquidity and treasury yield positions" }
    ],
    capabilities: {
      deposit: true,
      withdraw: true,
      transfer: true,
      swap: true,
      trade: true,
      zBankLoad: true,
      multiNetwork: true
    },
    integrations: {
      zBankLoadEndpoint: "/api/zbank/load-funds",
      tradingEndpoint: "/api/trading/tokens",
      oracleEndpoint: "/api/oracle/prices",
      depositAddress: "0xc2D6E6981D1A415967A683D615cf97bA9bC26F0f"
    },
    runtime: {
      product: "Z Wallet",
      style: "binance-production",
      walletAddress: "0xc2D6E6981D1A415967A683D615cf97bA9bC26F0f",
      settlementChainId: 44002,
      rpcUrl: "http://127.0.0.1:8546",
      privateKeyConfigured: false,
      signingReady: false,
      accounts: ["funding", "spot", "earn"]
    },
    supportedTokens: ["M1FIAT", "ACX", "SHIVA", "USDT", "USDC", "BTC", "ETH", "BNB"]
  };
}

function getFallbackBalances(overview: ZWalletOverview): ZWalletBalances {
  return {
    checkedAt: new Date().toISOString(),
    walletAddress: overview.wallet.address,
    settlementChain: overview.settlementChain,
    portfolio: { totalUsd: "0.00", fundingUsd: "0.00", spotUsd: "0.00", earnUsd: "0.00" },
    accounts: overview.accounts.map((account) => ({ ...account, valueUsd: "0.00" })),
    assets: []
  };
}

export async function getZWalletOverviewData(): Promise<ZWalletOverview> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/z-wallet/overview`, {
      headers: apiHeaders,
      next: { revalidate: 15 }
    });
    if (!response.ok) throw new Error("z-wallet overview request failed");
    return (await response.json()) as ZWalletOverview;
  } catch {
    return getFallbackOverview();
  }
}

export async function getZWalletBalancesData(): Promise<ZWalletBalances> {
  const overview = await getZWalletOverviewData();
  try {
    const response = await fetch(`${apiBaseUrl}/api/z-wallet/balances`, {
      headers: apiHeaders,
      next: { revalidate: 15 }
    });
    if (!response.ok) throw new Error("z-wallet balances request failed");
    return (await response.json()) as ZWalletBalances;
  } catch {
    return getFallbackBalances(overview);
  }
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
