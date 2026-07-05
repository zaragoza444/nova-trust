import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../../..");

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

export interface ZBankIntegration {
  schemaVersion: number;
  provider: {
    id: string;
    name: string;
    channel: string;
    status: string;
  };
  supportedChains: Array<{ chainId: number; name: string }>;
  primaryLiquidityChain?: {
    chainId: number;
    name: string;
    wrappedNativeSymbol?: string;
  };
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
}

function readJson<T>(relativePath: string): T {
  const absolutePath = path.resolve(repoRoot, relativePath);
  return JSON.parse(readFileSync(absolutePath, "utf8")) as T;
}

export function loadTradableTokenRegistry(): TradableTokenRegistry {
  const registryPath =
    process.env.NOVA_TOKEN_REGISTRY_PATH ?? "config/tokens/z-block-chain-tradable-tokens.v1.json";
  return readJson<TradableTokenRegistry>(registryPath);
}

export function loadTradingPlatformRegistry(): TradingPlatformRegistry {
  return readJson<TradingPlatformRegistry>("config/compliance/trading-platforms.v1.json");
}

export function loadZBankIntegration(): ZBankIntegration {
  return readJson<ZBankIntegration>("config/integrations/z-bank-online.v1.json");
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

  if (!token.capabilities.zBankLoadable) {
    return { valid: false, reason: `${symbol} is not loadable from Z Bank online` };
  }

  const numericAmount = Number(amount);
  const minAmount = Number(token.minLoadAmount);
  if (!Number.isFinite(numericAmount) || numericAmount < minAmount) {
    return { valid: false, reason: `Minimum load amount for ${symbol} is ${token.minLoadAmount}` };
  }

  return { valid: true };
}
