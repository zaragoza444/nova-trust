import type { IncomingMessage, ServerResponse } from "node:http";
import { getZChartMarkets, getZEcosystemOverview, getZSwapOverview, getZTradeMarkets } from "../services/z-ecosystem-service";

export function handleZEcosystemOverview(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(getZEcosystemOverview(), null, 2));
}

export function handleZSwapPools(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(getZSwapOverview(), null, 2));
}

export function handleZTradeMarkets(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(getZTradeMarkets(), null, 2));
}

export function handleZChartMarkets(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(getZChartMarkets(), null, 2));
}
