import type { IncomingMessage, ServerResponse } from "node:http";
import { NovaService } from "../services/nova-service";

const service = new NovaService();

export async function handleAssetsOverview(_request: IncomingMessage, response: ServerResponse) {
  try {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(await service.getAssetsOverview(), null, 2));
  } catch {
    response.writeHead(500, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Failed to load asset overview" }));
  }
}
