import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { loadApiConfig } from "./config";
import { handleAdminOverview, handleAdminQueue } from "./routes/admin";
import { handleDashboard } from "./routes/dashboard";
import { handleHealth } from "./routes/health";
import { canAccess, type NovaRole } from "./services/rbac";

const config = loadApiConfig();

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  response.setHeader("access-control-allow-origin", config.corsOrigin);
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type,authorization,x-nova-role");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.url === "/health") {
    handleHealth(request, response);
    return;
  }

  const requestRole = request.headers["x-nova-role"] as NovaRole | undefined;

  if (request.url === "/api/dashboard") {
    if (!requestRole || !canAccess("/api/dashboard", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleDashboard(request, response);
    return;
  }

  if (request.url === "/api/admin/queue") {
    if (!requestRole || !canAccess("/api/admin/queue", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleAdminQueue(request, response);
    return;
  }

  if (request.url === "/api/admin/overview") {
    if (!requestRole || !canAccess("/api/admin/overview", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleAdminOverview(request, response);
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(config.port, () => {
  console.log(`Nova API listening on port ${config.port}`);
});
