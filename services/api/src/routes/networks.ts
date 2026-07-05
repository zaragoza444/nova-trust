import type { IncomingMessage, ServerResponse } from "node:http";
import { getMultiNetworkOverview } from "../services/chain-chart";

export function handleMultiNetworkChart(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(getMultiNetworkOverview(), null, 2));
}
