import { readFileSync } from "node:fs";
import path from "node:path";
import { getMultiNetworkConfigStatus, loadMultiNetworkConfig } from "../config/multi-network-config";
import { novaOneProfile } from "./chain-registry";
import { MultiNetworkService } from "./multi-network-service";

const repoRoot = path.resolve(__dirname, "../../../..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), "utf8")) as T;
}

export function loadInternationalWiringRegistry() {
  return readJson<{
    schemaVersion: number;
    scope: string;
    regions: Array<{ id: string; label: string; networks: string[] }>;
    publicNetworks: Array<Record<string, unknown>>;
    internationalBridgeLanes: Array<Record<string, unknown>>;
    cloneTokens: Record<string, unknown>;
    publicEndpoints: Record<string, string>;
    productionDefaults: Record<string, string | number>;
  }>("config/integrations/international-wiring.v1.json");
}

export async function getInternationalWiringOverview() {
  const registry = loadInternationalWiringRegistry();
  const config = loadMultiNetworkConfig();
  const multiNetwork = new MultiNetworkService();
  const health = await multiNetwork.runHealthCheck();
  const publicHost = process.env.NOVA_PUBLIC_HOST ?? registry.productionDefaults.vpsHost;
  const publicScheme = process.env.NOVA_PUBLIC_SCHEME ?? "http";
  const dashboardPort = Number(process.env.NOVA_DASHBOARD_PORT ?? registry.productionDefaults.dashboardPort);
  const apiPort = Number(process.env.PORT ?? registry.productionDefaults.apiPort);
  const useNginx = process.env.NOVA_INTERNATIONAL_NGINX === "true";
  const publicBase = useNginx
    ? `${publicScheme}://${publicHost}`
    : `${publicScheme}://${publicHost}:${dashboardPort}`;
  const publicApiBase = useNginx
    ? `${publicScheme}://${publicHost}`
    : `${publicScheme}://${publicHost}:${apiPort}`;

  return {
    scope: registry.scope,
    wiredInternationally: health.allPublicNetworksHealthy && health.bridgesOperational,
    checkedAt: new Date().toISOString(),
    regions: registry.regions,
    publicNetworks: registry.publicNetworks.map((network) => {
      const name = network.name as string;
      const rpc =
        name === "TRON"
          ? config.tron.rpcUrl
          : name === "Ethereum"
            ? config.ethereum.rpcUrl
            : name === "BNB Smart Chain"
              ? config.bnbSmartChain.rpcUrl
              : null;
      const healthEntry = health.rpcEndpoints.find((entry) => entry.name === name);
      return {
        ...network,
        configuredRpcUrl: rpc,
        healthy: healthEntry?.ok ?? false,
        latencyMs: healthEntry?.latencyMs ?? null
      };
    }),
    permissionedSettlement: {
      chainId: novaOneProfile.chainId,
      name: novaOneProfile.name,
      rpcUrl: null,
      healthy: health.bridgesOperational
    },
    internationalBridgeLanes: registry.internationalBridgeLanes,
    cloneTokens: registry.cloneTokens,
    rpcConfig: getMultiNetworkConfigStatus(config),
    health,
    publicAccess: {
      host: publicHost,
      scheme: publicScheme,
      nginxEnabled: useNginx,
      dashboardUrl: publicBase,
      apiUrl: publicApiBase,
      goLiveUrl: `${publicApiBase}${registry.publicEndpoints.goLivePath}`,
      multiNetworkHealthUrl: `${publicApiBase}${registry.publicEndpoints.multiNetworkHealthPath}`,
      corsOrigin: process.env.NOVA_CORS_ORIGIN ?? publicBase
    },
    endpoints: registry.publicEndpoints
  };
}
