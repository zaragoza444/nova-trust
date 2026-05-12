import type { IncomingMessage, ServerResponse } from "node:http";
import { NovaService } from "../services/nova-service";

const service = new NovaService();

export function handleAdminQueue(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({ items: service.getAdminQueue() }, null, 2));
}
