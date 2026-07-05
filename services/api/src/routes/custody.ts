import type { IncomingMessage, ServerResponse } from "node:http";
import { CustodyService } from "../services/custody-service";

const service = new CustodyService();

export function handleCustodyOverview(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(service.getOverview(), null, 2));
}

export async function handleCustodyHealth(_request: IncomingMessage, response: ServerResponse) {
  try {
    const report = await service.runHealthCheck();
    response.setHeader("content-type", "application/json");
    response.writeHead(report.readyForZBank ? 200 : 503);
    response.end(JSON.stringify(report, null, 2));
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        error: "Custody health check failed",
        details: error instanceof Error ? error.message : "Unknown error"
      })
    );
  }
}
