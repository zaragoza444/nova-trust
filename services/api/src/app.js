const { createServer } = require("node:http");

const snapshot = {
  metrics: {
    indexedBlocks: 12402,
    transactions24h: 84100,
    activeAddresses24h: 3201,
    settlementVolume24h: 18450000,
    failedSettlements24h: 7
  },
  adminQueue: [
    {
      id: "treasury-001",
      type: "mint",
      requester: "ops@novatrust.finance",
      amount: 500000,
      status: "awaiting_approval"
    }
  ]
};

const accessPolicies = {
  "/api/dashboard": ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
  "/api/admin/queue": ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "AUDITOR"]
};

const port = Number(process.env.PORT || 4000);
const corsOrigin = process.env.NOVA_CORS_ORIGIN || "http://localhost:3000";

createServer((request, response) => {
  response.setHeader("access-control-allow-origin", corsOrigin);
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type,authorization,x-nova-role");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.url === "/health") {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ status: "ok", chain: "Nova Mainnet", timestamp: new Date().toISOString() }, null, 2));
    return;
  }

  if (request.url === "/api/dashboard" || request.url === "/api/admin/queue") {
    const role = request.headers["x-nova-role"];
    if (!role || !accessPolicies[request.url].includes(role)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }

    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(request.url === "/api/dashboard" ? snapshot : { items: snapshot.adminQueue }, null, 2));
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "Route not found" }));
}).listen(port, () => {
  console.log(`Nova API listening on port ${port}`);
});
