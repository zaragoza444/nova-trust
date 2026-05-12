import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { IndexedSnapshot } from "./block-processor";

function resolveSnapshotOutputPath() {
  const configuredPath = process.env.NOVA_INDEXER_SNAPSHOT_PATH;

  if (configuredPath) {
    return path.resolve(configuredPath);
  }

  const candidates = [
    path.resolve(process.cwd(), "runtime/indexed-snapshot.json"),
    path.resolve(process.cwd(), "services/indexer/runtime/indexed-snapshot.json")
  ];

  return candidates[0];
}

export function writeIndexedSnapshot(snapshot: IndexedSnapshot) {
  const outputPath = resolveSnapshotOutputPath();
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));
  return outputPath;
}
