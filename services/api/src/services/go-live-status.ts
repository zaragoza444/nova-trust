import { getMultiNetworkConfigStatus, loadMultiNetworkConfig } from "../config/multi-network-config";
import { novaOneProfile } from "./chain-registry";
import { MultiNetworkService } from "./multi-network-service";

export async function getGoLiveStatus() {
  const config = loadMultiNetworkConfig();
  const multiNetwork = new MultiNetworkService();
  const networkHealth = await multiNetwork.runHealthCheck();
  const live = networkHealth.allPublicNetworksHealthy && networkHealth.bridgesOperational;

  return {
    status: live ? "live" : "degraded",
    checkedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
    ecosystem: "nova-trust",
    settlementChain: {
      name: novaOneProfile.name,
      chainId: novaOneProfile.chainId,
      status: novaOneProfile.status
    },
    multiNetwork: {
      config: getMultiNetworkConfigStatus(config),
      health: networkHealth
    },
    endpoints: {
      apiHealth: "/health",
      multiNetwork: "/api/networks/multi",
      multiNetworkHealth: "/api/networks/health",
      internationalWiring: "/api/networks/international",
      dashboard: process.env.NOVA_DASHBOARD_URL ?? "http://127.0.0.1:3000",
      trading: `${process.env.NOVA_DASHBOARD_URL ?? "http://127.0.0.1:3000"}/trading`,
      networks: `${process.env.NOVA_DASHBOARD_URL ?? "http://127.0.0.1:3000"}/networks`
    }
  };
}
