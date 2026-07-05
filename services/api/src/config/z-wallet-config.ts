import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../../..");

export interface ZWalletAccount {
  id: string;
  name: string;
  description: string;
}

export interface ZWalletRegistry {
  schemaVersion: number;
  product: {
    id: string;
    name: string;
    style: string;
    status: string;
  };
  settlementChain: {
    chainId: number;
    name: string;
    nativeSymbol: string;
    wrappedSymbol: string;
    explorerLabel?: string;
  };
  productionWallet: {
    address: string;
    role: string;
    label: string;
    participantType: string;
  };
  accounts: ZWalletAccount[];
  capabilities: Record<string, boolean>;
  integrations?: {
    manifestPath?: string;
  };
}

export interface ZWalletRuntimeConfig {
  registry: ZWalletRegistry;
  walletAddress: string;
  rpcUrl: string;
  manifestPath: string;
  privateKeyConfigured: boolean;
  signingReady: boolean;
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), "utf8")) as T;
}

export function loadZWalletRegistry(): ZWalletRegistry {
  return readJson<ZWalletRegistry>("config/integrations/z-wallet.v1.json");
}

export function loadZWalletRuntimeConfig(): ZWalletRuntimeConfig {
  const registry = loadZWalletRegistry();
  const walletAddress = (process.env.Z_WALLET_ADDRESS ?? registry.productionWallet.address).toLowerCase();
  const rpcUrl = process.env.ZBC_RPC_URL ?? "http://127.0.0.1:8546";
  const manifestPath =
    process.env.ZBC_BOOTSTRAP_MANIFEST_PATH ??
    registry.integrations?.manifestPath ??
    "contracts/deployments/z-blockchain-production-liquidity.json";
  const privateKeyConfigured = Boolean(process.env.Z_WALLET_PRIVATE_KEY);

  return {
    registry,
    walletAddress,
    rpcUrl,
    manifestPath,
    privateKeyConfigured,
    signingReady: privateKeyConfigured
  };
}

export function getZWalletConfigStatus(config: ZWalletRuntimeConfig) {
  return {
    product: config.registry.product.name,
    style: config.registry.product.style,
    walletAddress: config.walletAddress,
    settlementChainId: config.registry.settlementChain.chainId,
    rpcUrl: config.rpcUrl,
    privateKeyConfigured: config.privateKeyConfigured,
    signingReady: config.signingReady,
    accounts: config.registry.accounts.map((account) => account.id)
  };
}
