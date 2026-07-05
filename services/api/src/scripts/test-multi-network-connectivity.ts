import { getMultiNetworkConfigStatus, loadMultiNetworkConfig } from "../config/multi-network-config";
import { MultiNetworkService } from "../services/multi-network-service";

async function main() {
  const config = loadMultiNetworkConfig();
  const service = new MultiNetworkService();
  const report = await service.runHealthCheck();

  console.log("Nova multi-network connectivity test");
  console.log("-----------------------------------");
  console.log(JSON.stringify(getMultiNetworkConfigStatus(config), null, 2));
  console.log("");
  console.log(JSON.stringify(report, null, 2));

  if (!report.allPublicNetworksHealthy) {
    process.exitCode = 1;
  }
}

void main();
