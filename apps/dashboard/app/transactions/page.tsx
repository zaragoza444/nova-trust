import { PageShell } from "../../components/page-shell";
import { transactionInsights, transactions } from "../../lib/mock-data";

export default function TransactionsPage() {
  return (
    <PageShell
      title="Transactions explorer"
      description="Review settlement, asset, governance, and administrative activity across Nova."
    >
      <section className="insightStrip">
        {transactionInsights.map((item) => (
          <article key={item.label} className="insightCard">
            <span className="signalLabel">{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <article className="card">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Explorer</span>
            <h3>Recent transaction activity</h3>
          </div>
        </div>
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
