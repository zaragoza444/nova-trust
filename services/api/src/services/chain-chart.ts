import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../../..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), "utf8")) as T;
}

export function loadMultiNetworkChart() {
  return readJson("config/chains/multi-network.v1.json");
}

export function loadPublicNetworkTokens() {
  return readJson("config/tokens/public-network-tokens.v1.json");
}

export function getMultiNetworkOverview() {
  const chart = loadMultiNetworkChart() as {
    basementNetwork: Record<string, unknown>;
    publicNetworks: Array<Record<string, unknown>>;
    bridgeLanes: Array<Record<string, unknown>>;
    permissionedBridges: Array<Record<string, unknown>>;
    capabilities: Record<string, boolean>;
  };
  const tokens = loadPublicNetworkTokens() as { tokens: Array<Record<string, unknown>> };

  return {
    chart,
    tokens: tokens.tokens,
    summary: {
      basementNetwork: chart.basementNetwork.name,
      publicNetworkCount: chart.publicNetworks.length,
      bridgeLaneCount: chart.bridgeLanes.length,
      permissionedBridgeCount: chart.permissionedBridges.length,
      capabilities: chart.capabilities
    }
  };
}
