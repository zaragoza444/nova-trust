import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { loadApiConfig, resolveCorsOrigin } from "./config";
import { handleAdminOverview, handleAdminQueue } from "./routes/admin";
import { handleAssetsOverview } from "./routes/assets";
import { handleDashboard } from "./routes/dashboard";
import { handleHealth } from "./routes/health";
import { handleMultiNetworkChart, handleMultiNetworkHealth } from "./routes/networks";
import { handleTradingTokensOverview } from "./routes/trading";
import { handleInternationalWiring } from "./routes/international";
import { handleGoLiveStatus } from "./routes/go-live";
import { handleCustodyHealth, handleCustodyOverview, handleCoboCallback, handleCoboWebhook } from "./routes/custody";
import { canAccess, type NovaRole } from "./services/rbac";

const config = loadApiConfig();

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  const requestOrigin = request.headers.origin;
  response.setHeader(
    "access-control-allow-origin",
    resolveCorsOrigin(typeof requestOrigin === "string" ? requestOrigin : undefined, config.corsOrigins)
  );
  response.setHeader("access-control-allow-methods", "GET,POST,PUT,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type,authorization,x-nova-role,biz_timestamp,biz_resp_signature");

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

  if (request.url === "/api/networks/multi") {
    if (!requestRole || !canAccess("/api/networks/multi", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleMultiNetworkChart(request, response);
    return;
  }

  if (request.url === "/api/networks/health") {
    if (!requestRole || !canAccess("/api/networks/health", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    void handleMultiNetworkHealth(request, response);
    return;
  }

  if (request.url === "/api/networks/international") {
    if (!requestRole || !canAccess("/api/networks/international", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    void handleInternationalWiring(request, response);
    return;
  }

  if (request.url === "/api/go-live/status") {
    void handleGoLiveStatus(request, response);
    return;
  }

  if (request.url === "/api/custody/integration") {
    if (!requestRole || !canAccess("/api/custody/integration", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleCustodyOverview(request, response);
    return;
  }

  if (request.url === "/api/custody/health") {
    if (!requestRole || !canAccess("/api/custody/health", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    void handleCustodyHealth(request, response);
    return;
  }

  if (request.url === "/api/custody/cobo/webhook" && request.method === "POST") {
    void handleCoboWebhook(request, response);
    return;
  }

  if (request.url === "/api/custody/cobo/callback" && request.method === "POST") {
    void handleCoboCallback(request, response);
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(config.port, config.host, () => {
  console.log(`Nova API listening on ${config.host}:${config.port}`);
});
