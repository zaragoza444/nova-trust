import type { BlockRecord, DashboardMetrics, TransactionRecord, ValidatorRecord } from "../domain/types";

export function materializeDashboardMetrics(
  blocks: BlockRecord[],
  transactions: TransactionRecord[],
  validators: ValidatorRecord[]
): DashboardMetrics {
  const successfulSettlementTransactions = transactions.filter(
    (transaction) => transaction.category === "settlement" && transaction.status === "success"
  );

  const failedSettlements24h = transactions.filter(
    (transaction) => transaction.category === "settlement" && transaction.status === "failed"
  ).length;

  return {
    indexedBlocks: blocks.length === 0 ? 0 : Math.max(...blocks.map((block) => block.number)),
    transactions24h: transactions.length,
    activeAddresses24h: new Set(transactions.flatMap((transaction) => [transaction.from, transaction.to])).size,
    settlementVolume24h: successfulSettlementTransactions.reduce(
      (total, transaction) => total + Number(transaction.value),
      0
    ),
    failedSettlements24h: failedSettlements24h + validators.filter((validator) => validator.status !== "active").length
  };
}
