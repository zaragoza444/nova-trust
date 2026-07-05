const secondsAgo = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();

export const novaDashboardSnapshot = {
  metrics: {
    indexedBlocks: 12402,
    transactions24h: 84100,
    activeAddresses24h: 3201,
    settlementVolume24h: 18450000,
    failedSettlements24h: 7
  },
  blocks: [
    {
      number: 12402,
      validator: "Validator Alpha",
      transactionCount: 42,
      gasUsed: 2800000,
      timestamp: secondsAgo(5)
    },
    {
      number: 12401,
      validator: "Validator Beta",
      transactionCount: 37,
      gasUsed: 2600000,
      timestamp: secondsAgo(10)
    },
    {
      number: 12400,
      validator: "Validator Gamma",
      transactionCount: 39,
      gasUsed: 2700000,
      timestamp: secondsAgo(15)
    }
  ],
  transactions: [
    {
      hash: "0xtx001",
      type: "Settlement",
      status: "Success",
      from: "Treasury Hot Wallet",
      to: "Partner Bank A",
      value: "$145,000"
    },
    {
      hash: "0xtx002",
      type: "Compliance Freeze",
      status: "Pending",
      from: "Compliance Desk",
      to: "Participant 22",
      value: "-"
    },
    {
      hash: "0xtx003",
      type: "Asset Issue",
      status: "Success",
      from: "Issuer Desk",
      to: "Nova Asset Vault",
      value: "$50,000"
    }
  ],
  validators: [
    {
      address: "0x1000000000000000000000000000000000000001",
      moniker: "Validator Alpha",
      status: "active",
      peerCount: 6,
      signedBlocks24h: 7200
    },
    {
      address: "0x1000000000000000000000000000000000000002",
      moniker: "Validator Beta",
      status: "warning",
      peerCount: 5,
      signedBlocks24h: 7104
    },
    {
      address: "0x1000000000000000000000000000000000000003",
      moniker: "Validator Gamma",
      status: "active",
      peerCount: 6,
      signedBlocks24h: 7188
    }
  ],
  adminQueue: [
    {
      id: "TR-001",
      action: "Mint settlement liquidity",
      owner: "Treasury Ops",
      status: "Awaiting checker",
      risk: "High"
    },
    {
      id: "KY-014",
      action: "Approve institutional participant",
      owner: "Compliance",
      status: "Approved",
      risk: "Medium"
    },
    {
      id: "VA-008",
      action: "Rotate validator key",
      owner: "Network Ops",
      status: "Scheduled",
      risk: "High"
    }
  ],
  assets: [
    {
      assetId: "M1FIAT-2026-001",
      name: "M1 Fiat Token",
      symbol: "M1FIAT",
      assetClass: "Stablecoin",
      jurisdiction: "GLOBAL",
      contractAddress: "0x0000000000000000000000000000000000000001",
      issueSize: 1000000,
      issuer: "Treasury Ops",
      treasury: "Z Bank Online M1 Rail",
      status: "Live",
      createdAt: "2026-07-05T10:00:00.000Z"
    },
    {
      assetId: "ACX-2026-001",
      name: "ACX Token",
      symbol: "ACX",
      assetClass: "Exchange",
      jurisdiction: "GLOBAL",
      contractAddress: "0x0000000000000000000000000000000000000002",
      issueSize: 500000,
      issuer: "Capital Markets Desk",
      treasury: "Chain 138 Liquidity Vault",
      status: "Live",
      createdAt: "2026-07-05T10:05:00.000Z"
    },
    {
      assetId: "SHIVA-2026-001",
      name: "Shiva Token",
      symbol: "SHIVA",
      assetClass: "Utility",
      jurisdiction: "GLOBAL",
      contractAddress: "0x0000000000000000000000000000000000000003",
      issueSize: 500000,
      issuer: "Trading Platform Ops",
      treasury: "Chain 138 Liquidity Vault",
      status: "Live",
      createdAt: "2026-07-05T10:10:00.000Z"
    },
    {
      assetId: "NST-2026-001",
      name: "Nova Settlement Token",
      symbol: "NST",
      assetClass: "Cash equivalent",
      jurisdiction: "AE",
      contractAddress: "0x8F4B0D4CcA83fF4dD08f0f5f2E1f3B9E15B93521",
      issueSize: 25000000,
      issuer: "Treasury Ops",
      treasury: "Primary Treasury Vault",
      status: "Live",
      createdAt: "2026-05-11T10:15:00.000Z"
    },
    {
      assetId: "NBI-2026-002",
      name: "Nova Bond Income Series A",
      symbol: "NBI-A",
      assetClass: "Bond",
      jurisdiction: "EU",
      contractAddress: "0x6F903A9A517D6fD0f6E0aF5C6404A5e6bB953142",
      issueSize: 12000000,
      issuer: "Capital Markets Desk",
      treasury: "Investor Distribution Vault",
      status: "Bookbuilding",
      createdAt: "2026-05-12T08:00:00.000Z"
    },
    {
      assetId: "NMM-2026-003",
      name: "Nova Money Market Token",
      symbol: "NMM",
      assetClass: "Fund",
      jurisdiction: "SG",
      contractAddress: "0x4eC74F5E67E43c5f86D1E71B0c8187b2c63B96EE",
      issueSize: 8000000,
      issuer: "Structured Products",
      treasury: "Fund Reserve Wallet",
      status: "Pre-issuance",
      createdAt: "2026-05-12T12:25:00.000Z"
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
  ]
};

export const novaUiSeed = {
  shellSignals: [
    { label: "Index sync", value: "5s behind", tone: "positive" },
    { label: "Nova One", value: "Chain 22016 active", tone: "positive" },
    { label: "NRW World", value: "Chain 33001 bridge", tone: "neutral" },
    { label: "Release", value: "v0.1.0", tone: "positive" }
  ],
  metricDeltas: {
    indexedBlocks: "+2.1% 24h",
    transactions24h: "-0.8% 24h",
    activeAddresses24h: "+0.4% 24h",
    settlementVolume24h: "+5.8% 24h"
  },
  pulseSeries: [42, 54, 49, 63, 57, 68, 66, 71, 75, 70, 78, 82],
  quickActions: [
    "Review compliance queue",
    "Inspect failed settlements",
    "Check validator readiness",
    "Open treasury controls"
  ],
  alerts: [
    {
      title: "NRW World bridge readiness review open",
      detail: "Nova One to NRW World lane remains paused until the compliance attestation packet is renewed.",
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
  adminDomains: [
    {
      title: "Treasury controls",
      summary: "Manage mint, burn, liquidity, and vault funding approvals.",
      items: ["Mint approvals", "Redeem queues", "Vault routing", "Liquidity windows"]
    },
    {
      title: "Compliance operations",
      summary: "Monitor onboarding, freezes, and policy exceptions.",
      items: ["KYC reviews", "Sanctions screening", "Freeze controls", "Audit exports"]
    },
    {
      title: "Network governance",
      summary: "Coordinate validators, releases, and operational runbooks.",
      items: ["Validator rotations", "Release gates", "NRW World bridge status", "Incident response"]
    }
  ],
  featureChecklist: [
    { title: "Explorer and network", detail: "Track Nova One 22016 and NRW World 33001 posture, blocks, validators, and gas." },
    { title: "Treasury and settlement", detail: "Watch liquidity, approve mint/redeem flows, and monitor failures." },
    { title: "Identity and compliance", detail: "Review participant onboarding, freezes, sanctions checks, and approvals." },
    { title: "Release and governance", detail: "Coordinate validator changes, release windows, and audit-ready runbooks." }
  ]
};
