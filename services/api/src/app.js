const { createServer } = require("node:http");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");

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

const assetsOverview = {
  shellSignals: dashboardPayload.shellSignals,
  assetMetrics: [
    { label: "Tokenized products", value: "3", delta: "1 live" },
    { label: "Issuance in flight", value: "2", delta: "maker-checker active" },
    { label: "Program notional", value: "$45.00M", delta: "across all launched assets" },
    { label: "Factory readiness", value: "Ready", delta: "NovaAssetFactory wired" }
  ],
  assetInsights: [
    { label: "Primary issuance rail", value: "NovaAssetFactory" },
    { label: "Custody destination", value: "Treasury vaults bound" },
    { label: "Compliance posture", value: "Pre-mint checks enforced" }
  ],
  assets: [
    {
      assetId: "NST-2026-001",
      name: "Nova Settlement Token",
      symbol: "NST",
      assetClass: "Cash equivalent",
      jurisdiction: "AE",
      contractAddress: "0x8F4B0D4CcA83fF4dD08f0f5f2E1f3B9E15B93521",
      issueSize: "$25.00M",
      issuer: "Treasury Ops",
      treasury: "Primary Treasury Vault",
      status: "Live",
      createdAt: "May 11, 10:15 AM"
    },
    {
      assetId: "NBI-2026-002",
      name: "Nova Bond Income Series A",
      symbol: "NBI-A",
      assetClass: "Bond",
      jurisdiction: "EU",
      contractAddress: "0x6F903A9A517D6fD0f6E0aF5C6404A5e6bB953142",
      issueSize: "$12.00M",
      issuer: "Capital Markets Desk",
      treasury: "Investor Distribution Vault",
      status: "Bookbuilding",
      createdAt: "May 12, 08:00 AM"
    },
    {
      assetId: "NMM-2026-003",
      name: "Nova Money Market Token",
      symbol: "NMM",
      assetClass: "Fund",
      jurisdiction: "SG",
      contractAddress: "0x4eC74F5E67E43c5f86D1E71B0c8187b2c63B96EE",
      issueSize: "$8.00M",
      issuer: "Structured Products",
      treasury: "Fund Reserve Wallet",
      status: "Pre-issuance",
      createdAt: "May 12, 12:25 PM"
    }
  ],
  issuanceRequests: [
    {
      id: "AS-104",
      assetId: "NBI-2026-002",
      name: "Nova Bond Income Series A",
      owner: "Capital Markets Desk",
      stage: "Legal review",
      status: "Awaiting checker",
      targetRaise: "$12.0M",
      jurisdiction: "EU"
    },
    {
      id: "AS-105",
      assetId: "NMM-2026-003",
      name: "Nova Money Market Token",
      owner: "Structured Products",
      stage: "Metadata mint prep",
      status: "Scheduled",
      targetRaise: "$8.0M",
      jurisdiction: "SG"
    },
    {
      id: "AS-106",
      assetId: "NCP-2026-004",
      name: "Nova Commercial Paper 30D",
      owner: "Treasury Ops",
      stage: "Compliance screening",
      status: "In review",
      targetRaise: "$5.5M",
      jurisdiction: "AE"
    }
  ],
  issuanceControls: [
    { title: "Issuance policy", detail: "Require maker-checker approval, approved metadata, and treasury destination before mint." },
    { title: "Compliance gate", detail: "Bind jurisdiction, sanctions screening, and participant controls before activation." },
    { title: "Operational release", detail: "Promote assets from pre-issuance to live only after contract verification and vault funding." }
  ]
};

function resolveSnapshotPath() {
  if (process.env.NOVA_INDEXER_SNAPSHOT_PATH) {
    return path.resolve(process.env.NOVA_INDEXER_SNAPSHOT_PATH);
  }

  const candidates = [
    path.resolve(process.cwd(), "../indexer/runtime/indexed-snapshot.json"),
    path.resolve(process.cwd(), "services/indexer/runtime/indexed-snapshot.json"),
    path.resolve(process.cwd(), "runtime/indexed-snapshot.json")
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function formatCurrency(value) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }

  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }

  return `$${value}`;
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function loadAssetsOverview() {
  const snapshotPath = resolveSnapshotPath();
  if (!snapshotPath || !existsSync(snapshotPath)) {
    return assetsOverview;
  }

  try {
    const payload = JSON.parse(readFileSync(snapshotPath, "utf8"));
    const assets = Array.isArray(payload.assets) ? payload.assets : [];
    const issuanceRequests = Array.isArray(payload.issuanceRequests) ? payload.issuanceRequests : [];
    const liveAssets = assets.filter((item) => item.status === "Live").length;
    const issuanceInFlight = issuanceRequests.filter((item) => item.status !== "Scheduled").length;
    const totalNotional = assets.reduce((total, item) => total + item.issueSize, 0);

    return {
      shellSignals: dashboardPayload.shellSignals,
      assetMetrics: [
        { label: "Tokenized products", value: String(assets.length), delta: `${liveAssets} live` },
        { label: "Issuance in flight", value: String(issuanceInFlight), delta: "maker-checker active" },
        { label: "Program notional", value: formatCurrency(totalNotional), delta: "across all launched assets" },
        { label: "Factory readiness", value: "Ready", delta: "indexer snapshot active" }
      ],
      assetInsights: assetsOverview.assetInsights,
      assets: assets.map((asset) => ({
        ...asset,
        issueSize: formatCurrency(asset.issueSize),
        createdAt: formatDateTime(asset.createdAt)
      })),
      issuanceRequests,
      issuanceControls: assetsOverview.issuanceControls
    };
  } catch {
    return assetsOverview;
  }
}

const accessPolicies = {
  "/api/dashboard": ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
  "/api/admin/queue": ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "AUDITOR"],
  "/api/admin/overview": ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "AUDITOR"],
  "/api/assets": ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"]
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

  if (request.url === "/api/dashboard" || request.url === "/api/admin/queue" || request.url === "/api/admin/overview" || request.url === "/api/assets") {
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

    if (request.url === "/api/assets") {
      response.end(JSON.stringify(loadAssetsOverview(), null, 2));
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
