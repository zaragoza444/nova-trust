const snapshot = {
  indexedBlocks: 12402,
  transactions24h: 84100,
  activeAddresses24h: 3201,
  settlementVolume24h: 18450000,
  failedSettlements24h: 7
};

console.log("Nova indexer booting");
console.log({
  rpcUrl: process.env.NOVA_RPC_URL || "http://localhost:8545",
  databaseUrl: process.env.NOVA_DATABASE_URL || "postgres://nova:nova@localhost:5432/nova",
  metrics: snapshot
});
