import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { loadApiConfig } from "./config";
import { handleAdminOverview, handleAdminQueue } from "./routes/admin";
import { handleAssetsOverview } from "./routes/assets";
import { handleDashboard } from "./routes/dashboard";
import { handleHealth } from "./routes/health";
import { handleTradingTokensOverview } from "./routes/trading";
import { handleZBankIntegrationOverview, handleZBankLoadFunds } from "./routes/zbank";
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

  if (request.url === "/api/assets") {
    if (!requestRole || !canAccess("/api/assets", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    void handleAssetsOverview(request, response);
    return;
  }

  if (request.url === "/api/trading/tokens") {
    if (!requestRole || !canAccess("/api/trading/tokens", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleTradingTokensOverview(request, response);
    return;
  }

  if (request.url === "/api/zbank/integration") {
    if (!requestRole || !canAccess("/api/zbank/integration", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleZBankIntegrationOverview(request, response);
    return;
  }

  if (request.url === "/api/zbank/load-funds" && request.method === "POST") {
    if (!requestRole || !canAccess("/api/zbank/load-funds", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    void handleZBankLoadFunds(request, response);
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(config.port, () => {
  console.log(`Nova API listening on port ${config.port}`);
});
