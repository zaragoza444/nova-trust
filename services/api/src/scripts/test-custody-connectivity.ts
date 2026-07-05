import { loadCustodyConfig } from "../config/custody-config";
import { CustodyService } from "../services/custody-service";

async function main() {
  const config = loadCustodyConfig();
  const service = new CustodyService();
  const report = await service.runHealthCheck();

  console.log("Nova custody connectivity test");
  console.log("------------------------------");
  console.log(`Dfns configured: ${config.dfns.enabled}`);
  console.log(`Cobo configured: ${config.cobo.enabled} (${config.cobo.environment})`);
  console.log("");
  console.log(JSON.stringify(report, null, 2));

  if (!report.dfns.ok || !report.cobo.ok) {
    process.exitCode = 1;
  }
}

void main();
