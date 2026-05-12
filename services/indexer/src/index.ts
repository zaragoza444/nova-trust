import { loadConfig } from "./config";
import { buildIndexedSnapshot } from "./pipeline/block-processor";

async function main() {
  const config = loadConfig();
  const snapshot = buildIndexedSnapshot();

  console.log("Nova indexer booting");
  console.log({
    rpcUrl: config.rpcUrl,
    databaseUrl: config.databaseUrl,
    indexedBlocks: snapshot.metrics.indexedBlocks,
    transactions24h: snapshot.metrics.transactions24h,
    settlementVolume24h: snapshot.metrics.settlementVolume24h
  });
}

main().catch((error) => {
  console.error("Nova indexer failed", error);
  process.exit(1);
});
