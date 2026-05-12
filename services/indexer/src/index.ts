import { loadConfig } from "./config";
import { buildIndexedSnapshot } from "./pipeline/block-processor";
import { writeIndexedSnapshot } from "./pipeline/snapshot-store";

async function main() {
  const config = loadConfig();
  const snapshot = await buildIndexedSnapshot(config);
  const snapshotPath = writeIndexedSnapshot(snapshot);

  console.log("Nova indexer booting");
  console.log({
    rpcUrl: config.rpcUrl,
    databaseUrl: config.databaseUrl,
    snapshotPath,
    indexedBlocks: snapshot.metrics.indexedBlocks,
    transactions24h: snapshot.metrics.transactions24h,
    settlementVolume24h: snapshot.metrics.settlementVolume24h,
    indexedAssets: snapshot.assets.length,
    issuanceRequests: snapshot.issuanceRequests.length
  });
}

main().catch((error) => {
  console.error("Nova indexer failed", error);
  process.exit(1);
});
