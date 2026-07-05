import type { IncomingMessage, ServerResponse } from "node:http";
import { MultiNetworkService } from "../services/multi-network-service";

const multiNetworkService = new MultiNetworkService();

export function handleMultiNetworkChart(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(multiNetworkService.getOverview(), null, 2));
}

export async function handleMultiNetworkHealth(_request: IncomingMessage, response: ServerResponse) {
  try {
    const report = await multiNetworkService.runHealthCheck();
    response.setHeader("content-type", "application/json");
    response.writeHead(report.allPublicNetworksHealthy ? 200 : 503);
    response.end(JSON.stringify(report, null, 2));
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        error: "Multi-network health check failed",
        details: error instanceof Error ? error.message : "Unknown error"
      })
    );
  }
}
