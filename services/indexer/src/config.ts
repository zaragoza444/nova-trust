export interface IndexerConfig {
  rpcUrl: string;
  databaseUrl: string;
  redisUrl: string;
  settlementTokenAddress: string;
  deploymentManifestPath: string;
  pollingIntervalMs: number;
  blockWindowSize: number;
}

export function loadConfig(): IndexerConfig {
  return {
    rpcUrl: process.env.NOVA_RPC_URL ?? "http://localhost:8545",
    databaseUrl: process.env.NOVA_DATABASE_URL ?? "postgres://nova:nova@localhost:5432/nova",
    redisUrl: process.env.NOVA_REDIS_URL ?? "redis://localhost:6379",
    settlementTokenAddress:
      process.env.NOVA_SETTLEMENT_TOKEN_ADDRESS ?? "0x0000000000000000000000000000000000001001",
    deploymentManifestPath:
      process.env.NOVA_DEPLOYMENT_MANIFEST_PATH ?? "../../contracts/deployments/local.json",
    pollingIntervalMs: Number(process.env.NOVA_POLLING_INTERVAL_MS ?? 5000),
    blockWindowSize: Number(process.env.NOVA_BLOCK_WINDOW_SIZE ?? 5)
  };
}
