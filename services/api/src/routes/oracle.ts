import type { IncomingMessage, ServerResponse } from "node:http";
import { getOraclePriceOverview, putOraclePrices } from "../services/price-oracle";

async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

export function handleOraclePricesGet(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(getOraclePriceOverview(), null, 2));
}

export async function handleOraclePricesPut(request: IncomingMessage, response: ServerResponse) {
  try {
    const body = await readJsonBody<{ prices: Array<{ symbol: string; priceUsd: string }> }>(request);
    if (!body.prices || !Array.isArray(body.prices) || body.prices.length === 0) {
      response.writeHead(400, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Request body must include a non-empty prices array" }));
      return;
    }

    const result = putOraclePrices(body.prices);
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(result, null, 2));
  } catch (error) {
    response.writeHead(400, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Invalid request" }));
  }
}
