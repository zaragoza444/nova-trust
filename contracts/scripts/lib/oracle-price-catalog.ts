import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface OraclePriceEntry {
  symbol: string;
  priceUsd: string;
  category: string;
  cloneOf?: string;
  referenceSource: string;
}

export interface OraclePriceRegistry {
  schemaVersion: number;
  chain: {
    name: string;
    chainId: number;
  };
  quoteCurrency: string;
  priceDecimals: number;
  prices: OraclePriceEntry[];
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");

export function loadOraclePriceRegistry(relativePath = "config/oracles/z-block-chain-prices.v1.json"): OraclePriceRegistry {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), "utf8")) as OraclePriceRegistry;
}

export function priceUsdToUsd8(priceUsd: string, priceDecimals: number): bigint {
  const [wholePart, fractionalPart = ""] = priceUsd.split(".");
  const normalizedFraction = fractionalPart.padEnd(priceDecimals, "0").slice(0, priceDecimals);
  return BigInt(`${wholePart}${normalizedFraction}`);
}

export function usd8ToPriceUsd(priceUsd8: bigint, priceDecimals: number): string {
  const raw = priceUsd8.toString().padStart(priceDecimals + 1, "0");
  const wholePart = raw.slice(0, raw.length - priceDecimals);
  const fractionalPart = raw.slice(raw.length - priceDecimals).replace(/0+$/, "");
  return fractionalPart.length > 0 ? `${wholePart}.${fractionalPart}` : wholePart;
}
