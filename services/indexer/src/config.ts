export interface IndexerConfig {
  rpcUrl: string;
  databaseUrl: string;
  redisUrl: string;
  settlementTokenAddress: string;
  pollingIntervalMs: number;
}

export function loadConfig(): IndexerConfig {
  return {
    rpcUrl: process.env.NOVA_RPC_URL ?? "http://localhost:8545",
    databaseUrl: process.env.NOVA_DATABASE_URL ?? "postgres://nova:nova@localhost:5432/nova",
    redisUrl: process.env.NOVA_REDIS_URL ?? "redis://localhost:6379",
    settlementTokenAddress:
      process.env.NOVA_SETTLEMENT_TOKEN_ADDRESS ?? "0x0000000000000000000000000000000000001001",
    pollingIntervalMs: Number(process.env.NOVA_POLLING_INTERVAL_MS ?? 5000)
  };
}
