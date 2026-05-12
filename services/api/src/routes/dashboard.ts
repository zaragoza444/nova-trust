import type { IncomingMessage, ServerResponse } from "node:http";
import { NovaService } from "../services/nova-service";

const service = new NovaService();

export function handleDashboard(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(service.getDashboard(), null, 2));
}
