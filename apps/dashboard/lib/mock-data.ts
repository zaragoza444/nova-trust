export const chainTabs = [
  "N1 Settlement",
  "N2 Operations",
  "N3 Asset",
  "N4 Identity",
  "N5 Consumer",
  "N6 Bridge"
];

export const metrics = [
  { label: "Indexed blocks", value: "12,402", delta: "+2.1% 24h" },
  { label: "Transactions / day", value: "84.1k", delta: "-0.8% 24h" },
  { label: "Active addresses", value: "3,201", delta: "+0.4% 24h" },
  { label: "Settlement volume", value: "$18.45M", delta: "+5.8% 24h" }
];

export const blocks = [
  { number: 12402, validator: "Validator Alpha", txs: 42, time: "5 sec ago", gasUsed: "2.8M" },
  { number: 12401, validator: "Validator Beta", txs: 37, time: "10 sec ago", gasUsed: "2.6M" },
  { number: 12400, validator: "Validator Gamma", txs: 39, time: "15 sec ago", gasUsed: "2.7M" }
];

export const transactions = [
  { hash: "0xtx001", type: "Settlement", status: "Success", from: "Treasury Hot Wallet", to: "Partner Bank A", value: "$145,000" },
  { hash: "0xtx002", type: "Compliance Freeze", status: "Pending", from: "Compliance Desk", to: "Participant 22", value: "-" },
  { hash: "0xtx003", type: "Asset Issue", status: "Success", from: "Issuer Desk", to: "Nova Asset Vault", value: "$50,000" }
];

export const validators = [
  { name: "Validator Alpha", status: "Active", peerCount: 6, signedBlocks: "7,200" },
  { name: "Validator Beta", status: "Warning", peerCount: 5, signedBlocks: "7,104" },
  { name: "Validator Gamma", status: "Active", peerCount: 6, signedBlocks: "7,188" }
];

export const adminQueue = [
  { id: "TR-001", action: "Mint settlement liquidity", owner: "Treasury Ops", status: "Awaiting checker", risk: "High" },
  { id: "KY-014", action: "Approve institutional participant", owner: "Compliance", status: "Approved", risk: "Medium" },
  { id: "VA-008", action: "Rotate validator key", owner: "Network Ops", status: "Scheduled", risk: "High" }
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
