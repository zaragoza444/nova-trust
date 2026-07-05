import type { IncomingMessage, ServerResponse } from "node:http";
import { getInternationalWiringOverview } from "../services/international-wiring";

export async function handleInternationalWiring(_request: IncomingMessage, response: ServerResponse) {
  try {
    const overview = await getInternationalWiringOverview();
    response.setHeader("content-type", "application/json");
    response.writeHead(overview.wiredInternationally ? 200 : 503);
    response.end(JSON.stringify(overview, null, 2));
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        error: "International wiring check failed",
        details: error instanceof Error ? error.message : "Unknown error"
      })
    );
  }
}
