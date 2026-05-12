import { PageShell } from "../../components/page-shell";
import { transactions } from "../../lib/mock-data";

export default function TransactionsPage() {
  return (
    <PageShell
      title="Transactions explorer"
      description="Review settlement, asset, governance, and administrative activity across Nova."
    >
      <article className="card">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Hash</th>
                <th>Type</th>
                <th>Status</th>
                <th>From</th>
                <th>To</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.hash}>
                  <td>{transaction.hash}</td>
                  <td>{transaction.type}</td>
                  <td>
                    <span className={`statusBadge ${transaction.status.toLowerCase()}`}>{transaction.status}</span>
                  </td>
                  <td>{transaction.from}</td>
                  <td>{transaction.to}</td>
                  <td>{transaction.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </PageShell>
  );
}
