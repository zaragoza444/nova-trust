import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../../..");

export interface TokenCapabilities {
  transferable: boolean;
  tradable: boolean;
  swappable: boolean;
  bankLoadable?: boolean;
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

export interface TradableTokenRegistry {
  schemaVersion: number;
  chain: {
    name: string;
    chainId: number;
    settlementChain?: {
      name: string;
      chainId: number;
    };
  };
  tokens: TradableToken[];
}

export interface TradingPlatform {
  id: string;
  name: string;
  type: string;
  supportedTokens: string[];
  capabilities: string[];
}

export interface TradingPlatformRegistry {
  schemaVersion: number;
  chain: {
    name: string;
    chainId: number;
  };
  approvedTokens: string[];
  platforms: TradingPlatform[];
}

function readJson<T>(relativePath: string): T {
  const absolutePath = path.resolve(repoRoot, relativePath);
  return JSON.parse(readFileSync(absolutePath, "utf8")) as T;
}

export function loadTradableTokenRegistry(): TradableTokenRegistry {
  return readJson<TradableTokenRegistry>("config/tokens/chain138-tradable-tokens.v1.json");
}

export function loadTradingPlatformRegistry(): TradingPlatformRegistry {
  return readJson<TradingPlatformRegistry>("config/compliance/trading-platforms.v1.json");
}

export function getTradableToken(symbol: string): TradableToken | undefined {
  const registry = loadTradableTokenRegistry();
  return registry.tokens.find((token) => token.symbol.toUpperCase() === symbol.toUpperCase());
}

export function validateLoadAmount(symbol: string, amount: string): { valid: boolean; reason?: string } {
  const token = getTradableToken(symbol);
  if (!token) {
    return { valid: false, reason: `Unsupported token: ${symbol}` };
  }

  if (!token.capabilities.bankLoadable) {
    return { valid: false, reason: `${symbol} is not loadable from partner bank rails` };
  }

  const numericAmount = Number(amount);
  const minAmount = Number(token.minLoadAmount);
  if (!Number.isFinite(numericAmount) || numericAmount < minAmount) {
    return { valid: false, reason: `Minimum load amount for ${symbol} is ${token.minLoadAmount}` };
  }

  return { valid: true };
}
