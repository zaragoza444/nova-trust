import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

interface IndexedAssetRecord {
  assetId: string;
  name: string;
  symbol: string;
  assetClass: string;
  jurisdiction: string;
  contractAddress: string;
  issueSize: number;
  issuer: string;
  treasury: string;
  status: string;
  createdAt: string;
}

interface IndexedIssuanceRecord {
  id: string;
  assetId: string;
  name: string;
  owner: string;
  stage: string;
  status: string;
  targetRaise: string;
  jurisdiction: string;
}

interface IndexedSnapshotPayload {
  assets?: IndexedAssetRecord[];
  issuanceRequests?: IndexedIssuanceRecord[];
}

function resolveSnapshotPath() {
  const configuredPath = process.env.NOVA_INDEXER_SNAPSHOT_PATH;
  if (configuredPath) {
    return path.resolve(configuredPath);
  }

  const candidates = [
    path.resolve(process.cwd(), "../indexer/runtime/indexed-snapshot.json"),
    path.resolve(process.cwd(), "services/indexer/runtime/indexed-snapshot.json"),
    path.resolve(process.cwd(), "runtime/indexed-snapshot.json")
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

export function loadIndexedAssetsSnapshot() {
  const snapshotPath = resolveSnapshotPath();
  if (!snapshotPath || !existsSync(snapshotPath)) {
    return null;
  }

  try {
    const payload = JSON.parse(readFileSync(snapshotPath, "utf8")) as IndexedSnapshotPayload;
    return {
      assets: Array.isArray(payload.assets) ? payload.assets : [],
      issuanceRequests: Array.isArray(payload.issuanceRequests) ? payload.issuanceRequests : []
    };
  } catch {
    return null;
  }
}
