import type { BlockRecord, TransactionRecord, ValidatorRecord } from "../domain/types";
import { materializeDashboardMetrics } from "./analytics-service";

export interface IndexedSnapshot {
  blocks: BlockRecord[];
  transactions: TransactionRecord[];
  validators: ValidatorRecord[];
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

  return {
    blocks,
    transactions,
    validators,
    metrics: materializeDashboardMetrics(blocks, transactions, validators)
  };
}
