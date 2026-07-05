import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseUnits } from "ethers";

export interface CloneTokenDefinition {
  assetId: string;
  symbol: string;
  name: string;
  assetClass: string;
  cloneOf: string;
  networks: string[];
  capabilities: {
    transferable: boolean;
    tradable: boolean;
    swappable: boolean;
    zBankLoadable: boolean;
  };
  liquidityPairs: string[];
}

export interface CloneTokenCatalog {
  schemaVersion: number;
  chain: {
    name: string;
    chainId: number;
    nativeSymbol: string;
    wrappedSymbol: string;
  };
  defaultSupply: string;
  defaultLiquidity: string;
  defaultWrappedLiquidity: string;
  tokens: CloneTokenDefinition[];
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");

export function loadCloneTokenCatalog(): CloneTokenCatalog {
  const relativePath = process.env.ZBC_CLONE_CATALOG_PATH ?? "config/tokens/clone-tokens.v1.json";
  const filePath = path.resolve(repoRoot, relativePath);
  return JSON.parse(readFileSync(filePath, "utf8")) as CloneTokenCatalog;
}

export function resolveCloneTokenAmounts(catalog: CloneTokenCatalog, symbol: string) {
  const envPrefix = `ZBC_${symbol}_`;
  const supply = process.env[`${envPrefix}SUPPLY`] ?? catalog.defaultSupply;
  const liquidity = process.env[`${envPrefix}LIQUIDITY`] ?? catalog.defaultLiquidity;
  const wrappedLiquidity = process.env[`${envPrefix}WZ_LIQUIDITY`] ?? catalog.defaultWrappedLiquidity;

  return {
    supply: parseUnits(supply, 18),
    liquidity: parseUnits(liquidity, 18),
    wrappedLiquidity: parseUnits(wrappedLiquidity, 18)
  };
}
