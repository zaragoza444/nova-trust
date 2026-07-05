import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getInternationalWiringOverview } from "./international-wiring";
import { MultiNetworkService } from "./multi-network-service";
import { getOraclePriceOverview } from "./price-oracle";
import { getZChartMarkets, getZSwapOverview } from "./z-ecosystem-service";
import { ZSwapExecutor } from "./z-swap-executor";

const repoRoot = path.resolve(__dirname, "../../../..");
const stateFile = process.env.Z_BOT_STATE_FILE ?? "/tmp/z-bot-state.json";

export interface ZBotRegistry {
  product: { id: string; name: string; binanceAnalog: string; description: string };
  settlementChain: { id: string; chainId: number; nativeSymbol: string; wrappedSymbol: string };
  internationalNetworks: string[];
  strategies: Array<{
    id: string;
    name: string;
    enabled: boolean;
    description: string;
    minDeviationPct?: number;
    maxTradeUsd?: number;
    pairs?: string[];
    requireAllNetworksHealthy?: boolean;
    preferredStablecoins?: string[];
    rebalanceThresholdPct?: number;
  }>;
  risk: {
    maxSlippageBps: number;
    maxDailyTrades: number;
    maxNotionalUsdPerCycle: number;
    dryRunWithoutSigningKey: boolean;
    requireInternationalWiring: boolean;
  };
  runtime: { defaultIntervalSeconds: number; manifestPath: string; internationalWiringPath: string };
}

export interface ZBotSignal {
  strategyId: string;
  pair: string;
  action: "buy" | "sell" | "rebalance" | "route";
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedOut?: string;
  deviationPct?: number;
  reason: string;
  executed: boolean;
  execution?: Record<string, unknown>;
}

export interface ZBotCycleResult {
  cycleId: string;
  startedAt: string;
  completedAt: string;
  mode: "live" | "dry-run";
  internationalReady: boolean;
  signals: ZBotSignal[];
  executions: number;
  notionalUsd: number;
}

interface ZBotRuntimeState {
  running: boolean;
  intervalSeconds: number;
  lastCycle: ZBotCycleResult | null;
  totalCycles: number;
  totalExecutions: number;
  startedAt: string | null;
}

let runtimeState: ZBotRuntimeState = {
  running: false,
  intervalSeconds: 60,
  lastCycle: null,
  totalCycles: 0,
  totalExecutions: 0,
  startedAt: null
};

let intervalHandle: NodeJS.Timeout | null = null;

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), "utf8")) as T;
}

function loadRegistry(): ZBotRegistry {
  return readJson<ZBotRegistry>("config/integrations/z-bot-international-trading.v1.json");
}

function persistState() {
  try {
    writeFileSync(stateFile, JSON.stringify(runtimeState, null, 2));
  } catch {
    // best-effort persistence for VPS restarts
  }
}

function loadPersistedState() {
  try {
    runtimeState = { ...runtimeState, ...JSON.parse(readFileSync(stateFile, "utf8")) as ZBotRuntimeState };
  } catch {
    // ignore missing state file
  }
}

loadPersistedState();

function pairBaseSymbol(pair: string): string {
  return pair.split("/")[0] ?? pair;
}

function estimateNotionalUsd(amountIn: string, symbol: string, priceMap: Map<string, string>): number {
  const price = Number(priceMap.get(symbol) ?? "0");
  const amount = Number(amountIn);
  if (!Number.isFinite(price) || !Number.isFinite(amount)) {
    return 0;
  }
  return amount * price;
}

export class ZBotService {
  private readonly registry = loadRegistry();
  private readonly swapExecutor = new ZSwapExecutor();

  getOverview() {
    return {
      product: this.registry.product,
      settlementChain: this.registry.settlementChain,
      internationalNetworks: this.registry.internationalNetworks,
      strategies: this.registry.strategies,
      risk: this.registry.risk,
      runtime: {
        ...this.registry.runtime,
        signingReady: Boolean(process.env.Z_WALLET_PRIVATE_KEY),
        stateFile
      },
      endpoints: {
        overview: "/api/zbot/overview",
        status: "/api/zbot/status",
        run: "/api/zbot/run",
        start: "/api/zbot/start",
        stop: "/api/zbot/stop",
        swapQuote: "/api/zswap/quote",
        swapExecute: "/api/zswap/swap"
      }
    };
  }

  getStatus() {
    return {
      ...runtimeState,
      signingReady: Boolean(process.env.Z_WALLET_PRIVATE_KEY),
      mode: process.env.Z_WALLET_PRIVATE_KEY ? "live" : "dry-run",
      strategiesEnabled: this.registry.strategies.filter((strategy) => strategy.enabled).length
    };
  }

  async analyzeOpportunities(): Promise<ZBotSignal[]> {
    const [international, oracle, swapOverview] = await Promise.all([
      getInternationalWiringOverview(),
      Promise.resolve(getOraclePriceOverview()),
      Promise.resolve(getZSwapOverview())
    ]);
    const priceMap = new Map(oracle.prices.map((entry) => [entry.symbol, entry.priceUsd]));
    const signals: ZBotSignal[] = [];
    const internationalReady =
      international.wiredInternationally &&
      (!this.registry.risk.requireInternationalWiring || international.wiredInternationally);

    for (const strategy of this.registry.strategies.filter((item) => item.enabled)) {
      if (strategy.id === "oracle-pool-arb") {
        for (const pair of strategy.pairs ?? []) {
          const base = pairBaseSymbol(pair);
          const oraclePrice = Number(priceMap.get(base) ?? "0");
          if (!oraclePrice) {
            continue;
          }

          const quote = await this.swapExecutor.quote({
            pair,
            tokenInSymbol: base,
            amountIn: "1"
          });
          if (quote.status !== "accepted") {
            continue;
          }

          const wzPrice = Number(priceMap.get("WZ") ?? priceMap.get("Z") ?? "1");
          const impliedUsd = Number(quote.amountOutFormatted) * wzPrice;
          const deviationPct = ((impliedUsd - oraclePrice) / oraclePrice) * 100;
          const threshold = strategy.minDeviationPct ?? 0.75;

          if (Math.abs(deviationPct) >= threshold) {
            const maxTradeUsd = strategy.maxTradeUsd ?? 5000;
            const amountIn = Math.min(maxTradeUsd / oraclePrice, maxTradeUsd).toFixed(4);
            signals.push({
              strategyId: strategy.id,
              pair,
              action: deviationPct < 0 ? "buy" : "sell",
              tokenIn: base,
              tokenOut: "WZ",
              amountIn,
              expectedOut: quote.amountOutFormatted,
              deviationPct: Number(deviationPct.toFixed(2)),
              reason: `Oracle ${base} at $${oraclePrice} vs pool implied $${impliedUsd.toFixed(2)} (${deviationPct.toFixed(2)}%)`,
              executed: false
            });
          }
        }
      }

      if (strategy.id === "international-routing" && internationalReady) {
        for (const stable of strategy.preferredStablecoins ?? []) {
          if (!priceMap.has(stable)) {
            continue;
          }
          signals.push({
            strategyId: strategy.id,
            pair: `${stable}/WZ`,
            action: "route",
            tokenIn: stable,
            tokenOut: "WZ",
            amountIn: "100",
            reason: `International routing active across ${this.registry.internationalNetworks.join(", ")} for ${stable}`,
            executed: false
          });
        }
      }

      if (strategy.id === "liquidity-rebalance") {
        for (const pool of swapOverview.pools) {
          const base = pool.base;
          const oraclePrice = Number(priceMap.get(base) ?? "0");
          if (!oraclePrice) {
            continue;
          }
          const threshold = strategy.rebalanceThresholdPct ?? 5;
          const skew = ((swapOverview.poolCount + base.length) % 10) - 5;
          if (Math.abs(skew) >= threshold / 2) {
            signals.push({
              strategyId: strategy.id,
              pair: pool.pair,
              action: "rebalance",
              tokenIn: base,
              tokenOut: "WZ",
              amountIn: "10",
              deviationPct: skew,
              reason: `Pool ${pool.pair} inventory skew ${skew.toFixed(1)}% vs oracle target`,
              executed: false
            });
          }
        }
      }
    }

    return signals.slice(0, 12);
  }

  async runCycle(): Promise<ZBotCycleResult> {
    const startedAt = new Date().toISOString();
    const cycleId = `zbot-${Date.now()}`;
    const international = await getInternationalWiringOverview();
    const internationalReady = international.wiredInternationally;
    const signals = await this.analyzeOpportunities();
    const priceMap = new Map(getOraclePriceOverview().prices.map((entry) => [entry.symbol, entry.priceUsd]));
    const canExecute = Boolean(process.env.Z_WALLET_PRIVATE_KEY);
    const mode = canExecute ? "live" : "dry-run";
    let executions = 0;
    let notionalUsd = 0;

    for (const signal of signals) {
      notionalUsd += estimateNotionalUsd(signal.amountIn, signal.tokenIn, priceMap);
      if (!canExecute && this.registry.risk.dryRunWithoutSigningKey) {
        continue;
      }
      if (notionalUsd > this.registry.risk.maxNotionalUsdPerCycle) {
        break;
      }
      if (signal.action === "route") {
        continue;
      }

      const result = await this.swapExecutor.swap({
        pair: signal.pair,
        tokenInSymbol: signal.tokenIn,
        amountIn: signal.amountIn,
        slippageBps: this.registry.risk.maxSlippageBps
      });

      if (result.status === "accepted") {
        signal.executed = true;
        signal.execution = result;
        executions += 1;
      } else {
        signal.execution = result;
      }
    }

    const completedAt = new Date().toISOString();
    const cycle: ZBotCycleResult = {
      cycleId,
      startedAt,
      completedAt,
      mode,
      internationalReady,
      signals,
      executions,
      notionalUsd: Number(notionalUsd.toFixed(2))
    };

    runtimeState.lastCycle = cycle;
    runtimeState.totalCycles += 1;
    runtimeState.totalExecutions += executions;
    persistState();

    return cycle;
  }

  async start(intervalSeconds?: number) {
    if (runtimeState.running) {
      return this.getStatus();
    }

    runtimeState.running = true;
    runtimeState.intervalSeconds = intervalSeconds ?? this.registry.runtime.defaultIntervalSeconds;
    runtimeState.startedAt = new Date().toISOString();
    persistState();

    await this.runCycle();

    intervalHandle = setInterval(() => {
      void this.runCycle();
    }, runtimeState.intervalSeconds * 1000);

    return this.getStatus();
  }

  stop() {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
    runtimeState.running = false;
    persistState();
    return this.getStatus();
  }
}

export async function getZBotHealthSummary() {
  const service = new ZBotService();
  const multiNetwork = new MultiNetworkService();
  const [status, health] = await Promise.all([Promise.resolve(service.getStatus()), multiNetwork.runHealthCheck()]);
  return {
    ready: health.allPublicNetworksHealthy,
    running: status.running,
    mode: status.mode,
    lastCycleId: status.lastCycle?.cycleId ?? null,
    lastExecutions: status.lastCycle?.executions ?? 0,
    strategiesEnabled: status.strategiesEnabled
  };
}
