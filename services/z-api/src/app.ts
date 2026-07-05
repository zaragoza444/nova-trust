import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { loadZApiConfig, resolveCorsOrigin } from "./config";
import { handleHealth } from "./routes/health";
import { handleZBlockChainChart } from "./routes/z-chain";
import { handleMultiNetworkChart, handleMultiNetworkHealth } from "./routes/networks";
import { handleTradingTokensOverview } from "./routes/trading";
import { handleZBankIntegrationOverview, handleZBankLoadFunds } from "./routes/zbank";
import { handleGoLiveStatus } from "./routes/go-live";
import { handleInternationalWiring } from "./routes/international";
import { handleZWalletBalances, handleZWalletOverview, handleZWalletTransfer } from "./routes/z-wallet";
import { handleCustodyHealth, handleCustodyOverview, handleCoboCallback, handleCoboWebhook } from "./routes/custody";
import { handleOraclePricesGet, handleOraclePricesPut } from "./routes/oracle";
import { handleZEcosystemOverview, handleZChartMarkets, handleZSwapPools, handleZTradeMarkets } from "./routes/z-ecosystem";
import {
  handleZBotOverview,
  handleZBotRun,
  handleZBotSignals,
  handleZBotStart,
  handleZBotStatus,
  handleZBotStop,
  handleZSwapExecute,
  handleZSwapQuote
} from "./routes/z-bot";
import { canAccess, type ZRole } from "./services/z-rbac";

const config = loadZApiConfig();

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  const requestOrigin = request.headers.origin;
  response.setHeader(
    "access-control-allow-origin",
    resolveCorsOrigin(typeof requestOrigin === "string" ? requestOrigin : undefined, config.corsOrigins)
  );
  response.setHeader("access-control-allow-methods", "GET,POST,PUT,OPTIONS");
  response.setHeader(
    "access-control-allow-headers",
    "content-type,authorization,x-z-role,x-nova-role,biz_timestamp,biz_resp_signature"
  );

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.url === "/health") {
    handleHealth(request, response);
    return;
  }

  const requestRole = (request.headers["x-z-role"] ?? request.headers["x-nova-role"]) as ZRole | undefined;

  if (request.url === "/api/go-live/status") {
    void handleGoLiveStatus(request, response);
    return;
  }

  if (request.url === "/api/z-ecosystem/overview") {
    if (!requestRole || !canAccess("/api/z-ecosystem/overview", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleZEcosystemOverview(request, response);
    return;
  }

  if (request.url === "/api/zswap/pools") {
    if (!requestRole || !canAccess("/api/zswap/pools", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleZSwapPools(request, response);
    return;
  }

  if (request.url === "/api/ztrade/markets") {
    if (!requestRole || !canAccess("/api/ztrade/markets", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleZTradeMarkets(request, response);
    return;
  }

  if (request.url === "/api/zchart/markets") {
    if (!requestRole || !canAccess("/api/zchart/markets", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleZChartMarkets(request, response);
    return;
  }

  if (request.url === "/api/zbot/overview") {
    if (!requestRole || !canAccess("/api/zbot/overview", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleZBotOverview(request, response);
    return;
  }

  if (request.url === "/api/zbot/status") {
    if (!requestRole || !canAccess("/api/zbot/status", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleZBotStatus(request, response);
    return;
  }

  if (request.url === "/api/zbot/signals") {
    if (!requestRole || !canAccess("/api/zbot/signals", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    void handleZBotSignals(request, response);
    return;
  }

  if (request.url === "/api/zbot/run" && request.method === "POST") {
    if (!requestRole || !canAccess("/api/zbot/run", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    void handleZBotRun(request, response);
    return;
  }

  if (request.url === "/api/zbot/start" && request.method === "POST") {
    if (!requestRole || !canAccess("/api/zbot/start", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    void handleZBotStart(request, response);
    return;
  }

  if (request.url === "/api/zbot/stop" && request.method === "POST") {
    if (!requestRole || !canAccess("/api/zbot/stop", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleZBotStop(request, response);
    return;
  }

  if (request.url === "/api/zswap/quote" && request.method === "POST") {
    if (!requestRole || !canAccess("/api/zswap/quote", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    void handleZSwapQuote(request, response);
    return;
  }

  if (request.url === "/api/zswap/swap" && request.method === "POST") {
    if (!requestRole || !canAccess("/api/zswap/swap", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    void handleZSwapExecute(request, response);
    return;
  }

  if (request.url === "/api/z-wallet/overview") {
    if (!requestRole || !canAccess("/api/z-wallet/overview", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleZWalletOverview(request, response);
    return;
  }

  if (request.url === "/api/z-wallet/balances") {
    if (!requestRole || !canAccess("/api/z-wallet/balances", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    void handleZWalletBalances(request, response);
    return;
  }

  if (request.url === "/api/z-wallet/transfer" && request.method === "POST") {
    if (!requestRole || !canAccess("/api/z-wallet/transfer", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    void handleZWalletTransfer(request, response);
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

  if (request.url === "/api/z-chain/chart") {
    if (!requestRole || !canAccess("/api/z-chain/chart", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleZBlockChainChart(request, response);
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

  if (request.url === "/api/oracle/prices" && request.method === "GET") {
    if (!requestRole || !canAccess("/api/oracle/prices", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    handleOraclePricesGet(request, response);
    return;
  }

  if (request.url === "/api/oracle/prices" && request.method === "PUT") {
    if (!requestRole || !canAccess("/api/oracle/prices", requestRole)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }
    void handleOraclePricesPut(request, response);
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(config.port, config.host, () => {
  console.log(`Z API listening on ${config.host}:${config.port}`);
});
