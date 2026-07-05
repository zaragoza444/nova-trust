import type { IncomingMessage, ServerResponse } from "node:http";
import { getGoLiveStatus } from "../services/go-live-status";

export async function handleGoLiveStatus(_request: IncomingMessage, response: ServerResponse) {
  try {
    const payload = await getGoLiveStatus();
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(payload, null, 2));
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Go-live status failed" }));
  }
}
