const { createServer } = require("node:http");

const dashboardPayload = {
  shellSignals: [
    { label: "Index sync", value: "5s behind", tone: "positive" },
    { label: "Settlement rail", value: "T+0 active", tone: "neutral" },
    { label: "Operators", value: "12 live", tone: "neutral" },
    { label: "Release", value: "v0.1.0", tone: "positive" }
  ],
  metrics: [
    { label: "Indexed blocks", value: "12,402", delta: "+2.1% 24h" },
    { label: "Transactions / day", value: "84.1K", delta: "-0.8% 24h" },
    { label: "Active addresses", value: "3,201", delta: "+0.4% 24h" },
    { label: "Settlement volume", value: "$18.45M", delta: "+5.8% 24h" }
  ],
  homeHighlights: [
    { label: "Validator quorum", value: "2 / 3 healthy" },
    { label: "Treasury exposure", value: "$42.80M monitored" },
    { label: "Compliance queues", value: "2 awaiting action" },
    { label: "Cross-chain readiness", value: "Bridge paused for review" }
  ],
  pulseSeries: [42, 54, 49, 63, 57, 68, 66, 71, 75, 70, 78, 82],
  quickActions: [
    "Review compliance queue",
    "Inspect failed settlements",
    "Check validator readiness",
    "Open treasury controls"
  ],
  alerts: [
    {
      title: "Bridge readiness review open",
      detail: "Cross-chain lane remains paused until the compliance attestation packet is renewed.",
      severity: "warning",
      time: "8 minutes ago"
    },
    {
      title: "Validator Beta peer count slipped",
      detail: "Peer connectivity dropped below the preferred threshold, but quorum remains healthy.",
      severity: "warning",
      time: "12 minutes ago"
    },
    {
      title: "Large treasury settlement cleared",
      detail: "The morning liquidity rebalance settled successfully with no compliance exceptions.",
      severity: "positive",
      time: "27 minutes ago"
    }
  ],
  blocks: [
    { number: 12402, validator: "Validator Alpha", txs: 42, gasUsed: "2.8M", time: "5 sec ago" },
    { number: 12401, validator: "Validator Beta", txs: 37, gasUsed: "2.6M", time: "10 sec ago" }
  ],
  blockInsights: [
    { label: "Average finality", value: "5.2s" },
    { label: "Gas utilization", value: "74%" },
    { label: "Hot validator", value: "Validator Alpha" }
  ],
  transactions: [
    { hash: "0xtx001", type: "Settlement", status: "Success", from: "Treasury Hot Wallet", to: "Partner Bank A", value: "$145,000" },
    { hash: "0xtx002", type: "Compliance Freeze", status: "Pending", from: "Compliance Desk", to: "Participant 22", value: "-" },
    { hash: "0xtx003", type: "Asset Issue", status: "Success", from: "Issuer Desk", to: "Nova Asset Vault", value: "$50,000" }
  ],
  transactionInsights: [
    { label: "Failed settlements", value: "7 today" },
    { label: "Largest transfer", value: "$2.4M" },
    { label: "Admin actions", value: "3 queued" }
  ],
  validators: [
    { name: "Validator Alpha", status: "Active", peerCount: 6, signedBlocks: "7,200" },
    { name: "Validator Beta", status: "Warning", peerCount: 5, signedBlocks: "7,104" },
    { name: "Validator Gamma", status: "Active", peerCount: 6, signedBlocks: "7,188" }
  ],
  validatorInsights: [
    { label: "Average peers", value: "5.7" },
    { label: "Warning nodes", value: "1" },
    { label: "Signing SLA", value: "99.3%" }
  ],
  adminQueue: [
    { id: "TR-001", action: "Mint settlement liquidity", owner: "Treasury Ops", status: "Awaiting checker", risk: "High" },
    { id: "KY-014", action: "Approve institutional participant", owner: "Compliance", status: "Approved", risk: "Medium" },
    { id: "VA-008", action: "Rotate validator key", owner: "Network Ops", status: "Scheduled", risk: "High" }
  ],
  adminMetrics: [
    { label: "Awaiting checker", value: "3", delta: "1 high risk item" },
    { label: "Approved today", value: "18", delta: "+4 vs yesterday" },
    { label: "Frozen participants", value: "2", delta: "unchanged" },
    { label: "Audit exports", value: "24", delta: "all delivered" }
  ],
  adminDomains: [
    {
      title: "Identity and onboarding",
      summary: "Institutional lifecycle, KYC attestations, and participant readiness.",
      items: ["Institutional onboarding", "Jurisdiction checks", "Participant activation"]
    },
    {
      title: "Treasury and settlement",
      summary: "Mint, redeem, rebalance, and liquidity control workflows.",
      items: ["Maker-checker queue", "Liquidity windows", "Exception reporting"]
    },
    {
      title: "Network governance",
      summary: "Validator change control, upgrades, and incident coordination.",
      items: ["Validator rotation", "Release windows", "Emergency runbooks"]
    }
  ],
  featureChecklist: [
    { title: "Explorer and network", detail: "Track blocks, transactions, validators, and gas posture." },
    { title: "Treasury and settlement", detail: "Watch liquidity, approve mint and redeem flows, and monitor failures." },
    { title: "Identity and compliance", detail: "Review participant onboarding, freezes, sanctions checks, and approvals." },
    { title: "Release and governance", detail: "Coordinate validator changes, release windows, and audit-ready runbooks." }
  ]
};

const accessPolicies = {
  "/api/dashboard": ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
  "/api/admin/queue": ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "AUDITOR"],
  "/api/admin/overview": ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "AUDITOR"]
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

  if (request.url === "/api/dashboard" || request.url === "/api/admin/queue" || request.url === "/api/admin/overview") {
    const role = request.headers["x-nova-role"];
    if (!role || !accessPolicies[request.url].includes(role)) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }

    response.setHeader("content-type", "application/json");
    if (request.url === "/api/dashboard") {
      response.end(JSON.stringify(dashboardPayload, null, 2));
      return;
    }

    if (request.url === "/api/admin/overview") {
      response.end(
        JSON.stringify(
          {
            shellSignals: dashboardPayload.shellSignals,
            adminMetrics: dashboardPayload.adminMetrics,
            adminQueue: dashboardPayload.adminQueue,
            adminDomains: dashboardPayload.adminDomains,
            alerts: dashboardPayload.alerts
          },
          null,
          2
        )
      );
      return;
    }

    response.end(JSON.stringify({ items: dashboardPayload.adminQueue }, null, 2));
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "Route not found" }));
}).listen(port, () => {
  console.log(`Nova API listening on port ${port}`);
});
