const apiBaseUrl = process.env.Z_API_URL ?? "http://127.0.0.1:4100";
const apiHeaders = { "x-z-role": process.env.Z_DASHBOARD_ROLE ?? "AUDITOR" };

export interface ZBotOverview {
  product: { id: string; name: string; binanceAnalog: string; description: string };
  settlementChain: { id: string; chainId: number; nativeSymbol: string; wrappedSymbol: string };
  internationalNetworks: string[];
  strategies: Array<{ id: string; name: string; enabled: boolean; description: string }>;
  risk: {
    maxSlippageBps: number;
    maxDailyTrades: number;
    maxNotionalUsdPerCycle: number;
    dryRunWithoutSigningKey: boolean;
  };
  runtime: { defaultIntervalSeconds: number; signingReady: boolean };
}

export interface ZBotSignal {
  strategyId: string;
  pair: string;
  action: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  deviationPct?: number;
  reason: string;
  executed: boolean;
}

export interface ZBotStatus {
  running: boolean;
  intervalSeconds: number;
  mode: "live" | "dry-run";
  strategiesEnabled: number;
  totalCycles: number;
  totalExecutions: number;
  lastCycle: {
    cycleId: string;
    mode: string;
    internationalReady: boolean;
    executions: number;
    notionalUsd: number;
    signals: ZBotSignal[];
  } | null;
}

export interface ZBotSignals {
  checkedAt: string;
  signalCount: number;
  signals: ZBotSignal[];
}

function fallbackOverview(): ZBotOverview {
  return {
    product: {
      id: "z-bot",
      name: "Z Bot",
      binanceAnalog: "Binance Trading Bots",
      description: "Automated international trading on Z Chain."
    },
    settlementChain: { id: "z-chain", chainId: 44002, nativeSymbol: "Z", wrappedSymbol: "WZ" },
    internationalNetworks: ["TRON", "Ethereum", "BNB Smart Chain"],
    strategies: [
      {
        id: "oracle-pool-arb",
        name: "Oracle Pool Arbitrage",
        enabled: true,
        description: "Swap on WZ pools when oracle price deviates from pool implied price."
      },
      {
        id: "international-routing",
        name: "International Routing",
        enabled: true,
        description: "Route clone-token liquidity when public networks are healthy."
      },
      {
        id: "liquidity-rebalance",
        name: "Liquidity Rebalance",
        enabled: true,
        description: "Rebalance WZ pool inventory toward oracle targets."
      }
    ],
    risk: {
      maxSlippageBps: 50,
      maxDailyTrades: 100,
      maxNotionalUsdPerCycle: 10000,
      dryRunWithoutSigningKey: true
    },
    runtime: { defaultIntervalSeconds: 60, signingReady: false }
  };
}

function fallbackStatus(): ZBotStatus {
  return {
    running: false,
    intervalSeconds: 60,
    mode: "dry-run",
    strategiesEnabled: 3,
    totalCycles: 0,
    totalExecutions: 0,
    lastCycle: null
  };
}

function fallbackSignals(): ZBotSignals {
  return {
    checkedAt: new Date().toISOString(),
    signalCount: 2,
    signals: [
      {
        strategyId: "international-routing",
        pair: "USDT/WZ",
        action: "route",
        tokenIn: "USDT",
        tokenOut: "WZ",
        amountIn: "100",
        reason: "International routing preview — start Z API for live signals",
        executed: false
      },
      {
        strategyId: "oracle-pool-arb",
        pair: "BTC/WZ",
        action: "buy",
        tokenIn: "BTC",
        tokenOut: "WZ",
        amountIn: "0.01",
        deviationPct: 1.2,
        reason: "Oracle vs pool preview signal",
        executed: false
      }
    ]
  };
}

export async function getZBotOverviewData(): Promise<ZBotOverview> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/zbot/overview`, { headers: apiHeaders, next: { revalidate: 30 } });
    if (!response.ok) throw new Error("failed");
    return (await response.json()) as ZBotOverview;
  } catch {
    return fallbackOverview();
  }
}

export async function getZBotStatusData(): Promise<ZBotStatus> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/zbot/status`, { headers: apiHeaders, next: { revalidate: 15 } });
    if (!response.ok) throw new Error("failed");
    return (await response.json()) as ZBotStatus;
  } catch {
    return fallbackStatus();
  }
}

export async function getZBotSignalsData(): Promise<ZBotSignals> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/zbot/signals`, { headers: apiHeaders, next: { revalidate: 15 } });
    if (!response.ok) throw new Error("failed");
    return (await response.json()) as ZBotSignals;
  } catch {
    return fallbackSignals();
  }
}
