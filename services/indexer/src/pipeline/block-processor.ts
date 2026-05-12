import type { AssetIssuanceRecord, AssetRecord, BlockRecord, TransactionRecord, ValidatorRecord } from "../domain/types";
import { materializeDashboardMetrics } from "./analytics-service";

export interface IndexedSnapshot {
  blocks: BlockRecord[];
  transactions: TransactionRecord[];
  validators: ValidatorRecord[];
  assets: AssetRecord[];
  issuanceRequests: AssetIssuanceRecord[];
  metrics: ReturnType<typeof materializeDashboardMetrics>;
}

export function buildIndexedSnapshot(): IndexedSnapshot {
  const blocks: BlockRecord[] = [
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
  ];

  const transactions: TransactionRecord[] = [
    {
      hash: "0xtx001",
      blockNumber: 12402,
      from: "0x1000000000000000000000000000000000000001",
      to: "0x1000000000000000000000000000000000000002",
      value: "145000",
      status: "success",
      category: "settlement"
    },
    {
      hash: "0xtx002",
      blockNumber: 12402,
      from: "0x1000000000000000000000000000000000000003",
      to: "0x1000000000000000000000000000000000000004",
      value: "98000",
      status: "failed",
      category: "settlement"
    },
    {
      hash: "0xtx003",
      blockNumber: 12401,
      from: "0x1000000000000000000000000000000000000005",
      to: "0x1000000000000000000000000000000000000006",
      value: "50000",
      status: "success",
      category: "asset"
    }
  ];

  const validators: ValidatorRecord[] = [
    {
      address: "0xvalidator1",
      moniker: "Validator Alpha",
      status: "active",
      peerCount: 6,
      signedBlocks24h: 7200
    },
    {
      address: "0xvalidator2",
      moniker: "Validator Beta",
      status: "warning",
      peerCount: 5,
      signedBlocks24h: 7104
    }
  ];

  const assets: AssetRecord[] = [
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
  ];

  const issuanceRequests: AssetIssuanceRecord[] = [
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
  ];

  return {
    blocks,
    transactions,
    validators,
    assets,
    issuanceRequests,
    metrics: materializeDashboardMetrics(blocks, transactions, validators)
  };
}
