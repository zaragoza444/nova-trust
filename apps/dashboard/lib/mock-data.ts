export const chainTabs = [
  "N1 Settlement",
  "N2 Operations",
  "N3 Asset",
  "N4 Identity",
  "N5 Consumer",
  "N6 Bridge"
];

export const shellSignals = [
  { label: "Index sync", value: "5s behind", tone: "positive" },
  { label: "Settlement rail", value: "T+0 active", tone: "neutral" },
  { label: "Operators", value: "12 live", tone: "neutral" },
  { label: "Release", value: "v0.1.0", tone: "positive" }
];

export const metrics = [
  { label: "Indexed blocks", value: "12,402", delta: "+2.1% 24h" },
  { label: "Transactions / day", value: "84.1k", delta: "-0.8% 24h" },
  { label: "Active addresses", value: "3,201", delta: "+0.4% 24h" },
  { label: "Settlement volume", value: "$18.45M", delta: "+5.8% 24h" }
];

export const homeHighlights = [
  { label: "Validator quorum", value: "4 / 4 healthy" },
  { label: "Treasury exposure", value: "$42.8M monitored" },
  { label: "Compliance queues", value: "3 awaiting action" },
  { label: "Cross-chain readiness", value: "Bridge paused for review" }
];

export const pulseSeries = [42, 54, 49, 63, 57, 68, 66, 71, 75, 70, 78, 82];

export const blocks = [
  { number: 12402, validator: "Validator Alpha", txs: 42, time: "5 sec ago", gasUsed: "2.8M" },
  { number: 12401, validator: "Validator Beta", txs: 37, time: "10 sec ago", gasUsed: "2.6M" },
  { number: 12400, validator: "Validator Gamma", txs: 39, time: "15 sec ago", gasUsed: "2.7M" }
];

export const blockInsights = [
  { label: "Average finality", value: "5.2s" },
  { label: "Gas utilization", value: "74%" },
  { label: "Hot validator", value: "Validator Alpha" }
];

export const transactions = [
  { hash: "0xtx001", type: "Settlement", status: "Success", from: "Treasury Hot Wallet", to: "Partner Bank A", value: "$145,000" },
  { hash: "0xtx002", type: "Compliance Freeze", status: "Pending", from: "Compliance Desk", to: "Participant 22", value: "-" },
  { hash: "0xtx003", type: "Asset Issue", status: "Success", from: "Issuer Desk", to: "Nova Asset Vault", value: "$50,000" }
];

export const transactionInsights = [
  { label: "Failed settlements", value: "7 today" },
  { label: "Largest transfer", value: "$2.4M" },
  { label: "Admin actions", value: "14 signed" }
];

export const validators = [
  { name: "Validator Alpha", status: "Active", peerCount: 6, signedBlocks: "7,200" },
  { name: "Validator Beta", status: "Warning", peerCount: 5, signedBlocks: "7,104" },
  { name: "Validator Gamma", status: "Active", peerCount: 6, signedBlocks: "7,188" }
];

export const validatorInsights = [
  { label: "Average peers", value: "5.7" },
  { label: "Warning nodes", value: "1" },
  { label: "Signing SLA", value: "99.3%" }
];

export const adminQueue = [
  { id: "TR-001", action: "Mint settlement liquidity", owner: "Treasury Ops", status: "Awaiting checker", risk: "High" },
  { id: "KY-014", action: "Approve institutional participant", owner: "Compliance", status: "Approved", risk: "Medium" },
  { id: "VA-008", action: "Rotate validator key", owner: "Network Ops", status: "Scheduled", risk: "High" }
];

export const alerts = [
  {
    title: "Bridge readiness review open",
    detail: "Cross-chain lane remains paused until the compliance attestation packet is renewed.",
    severity: "warning",
    time: "8 minutes ago"
  },
  {
    title: "Validator Beta peer count slipped",
    detail: "Peer connectivity dropped below the preferred threshold, but quorum remains healthy.",
    severity: "info",
    time: "12 minutes ago"
  },
  {
    title: "Large treasury settlement cleared",
    detail: "The morning liquidity rebalance settled successfully with no compliance exceptions.",
    severity: "positive",
    time: "27 minutes ago"
  }
];

export const quickActions = [
  "Review compliance queue",
  "Inspect failed settlements",
  "Check validator readiness",
  "Open treasury controls"
];

export const adminMetrics = [
  { label: "Awaiting checker", value: "3", delta: "1 high risk item" },
  { label: "Approved today", value: "18", delta: "+4 vs yesterday" },
  { label: "Frozen participants", value: "2", delta: "unchanged" },
  { label: "Audit exports", value: "24", delta: "all delivered" }
];

export const adminDomains = [
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
];

export const featureGroups = [
  {
    title: "Core data",
    items: ["Blocks", "Transactions", "Addresses", "Contracts", "Validators"]
  },
  {
    title: "Finance",
    items: ["Settlement", "Asset issuance", "Treasury", "Governance", "Reporting"]
  },
  {
    title: "Admin",
    items: ["Identity", "Compliance", "Approvals", "Audit log", "Operator actions"]
  }
];
