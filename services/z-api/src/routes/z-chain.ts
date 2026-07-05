import type { IncomingMessage, ServerResponse } from "node:http";
import { getZBlockChainOverview } from "../services/chain-chart";

export function handleZBlockChainChart(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(getZBlockChainOverview(), null, 2));
}
