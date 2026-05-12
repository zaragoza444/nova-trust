const { mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const snapshot = {
  blocks: [
    {
      number: 12402,
      hash: "0xblock12402",
      timestamp: "2026-05-12T00:00:00Z",
      transactionCount: 42,
      validator: "Validator Alpha",
      gasUsed: 2800000
    },
    {
      number: 12401,
      hash: "0xblock12401",
      timestamp: "2026-05-11T23:59:55Z",
      transactionCount: 37,
      validator: "Validator Beta",
      gasUsed: 2611000
    }
  ],
  transactions: [
    {
      hash: "0xtx001",
      blockNumber: 12402,
      from: "0x1000000000000000000000000000000000000001",
      to: "0x1000000000000000000000000000000000000002",
      value: "145000",
      status: "success",
      category: "settlement"
    }
  ],
  validators: [
    {
      address: "0xvalidator1",
      moniker: "Validator Alpha",
      status: "active",
      peerCount: 6,
      signedBlocks24h: 7200
    }
  ],
  assets: [
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
      createdAt: "2026-05-11T10:15:00Z"
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
      createdAt: "2026-05-12T08:00:00Z"
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
      createdAt: "2026-05-12T12:25:00Z"
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
  metrics: {
    indexedBlocks: 12402,
    transactions24h: 84100,
    activeAddresses24h: 3201,
    settlementVolume24h: 18450000,
    failedSettlements24h: 7
  }
};

function resolveSnapshotOutputPath() {
  if (process.env.NOVA_INDEXER_SNAPSHOT_PATH) {
    return path.resolve(process.env.NOVA_INDEXER_SNAPSHOT_PATH);
  }

  const candidates = [
    path.resolve(process.cwd(), "runtime/indexed-snapshot.json"),
    path.resolve(process.cwd(), "services/indexer/runtime/indexed-snapshot.json")
  ];

  return candidates[0];
}

const snapshotPath = resolveSnapshotOutputPath();
mkdirSync(path.dirname(snapshotPath), { recursive: true });
writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

console.log("Nova indexer booting");
console.log({
  rpcUrl: process.env.NOVA_RPC_URL || "http://localhost:8545",
  databaseUrl: process.env.NOVA_DATABASE_URL || "postgres://nova:nova@localhost:5432/nova",
  snapshotPath,
  metrics: snapshot.metrics,
  indexedAssets: snapshot.assets.length,
  issuanceRequests: snapshot.issuanceRequests.length
});
