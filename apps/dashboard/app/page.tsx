import { KpiCard } from "../components/kpi-card";
import { PageShell } from "../components/page-shell";
import { adminQueue, blocks, metrics, validators } from "../lib/mock-data";

export default function HomePage() {
  return (
    <PageShell
      title="Nova chain dashboard"
      description="High-level health for the Nova financial network, including settlement throughput, validator posture, and operational readiness."
    >
      <section className="grid">
        {metrics.map((metric) => (
          <KpiCard key={metric.label} label={metric.label} value={metric.value} delta={metric.delta} />
        ))}
      </section>

      <section className="twoColumn">
        <article className="card">
          <span className="eyebrow">Latest blocks</span>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Validator</th>
                  <th>Transactions</th>
                  <th>Gas used</th>
                  <th>Age</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => (
                  <tr key={block.number}>
                    <td>{block.number}</td>
                    <td>{block.validator}</td>
                    <td>{block.txs}</td>
                    <td>{block.gasUsed}</td>
                    <td>{block.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <span className="eyebrow">Validator posture</span>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Validator</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {validators.map((validator) => (
                  <tr key={validator.name}>
                    <td>{validator.name}</td>
                    <td>
                      <span className={`statusBadge ${validator.status.toLowerCase()}`}>{validator.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="twoColumn">
        <article className="card">
          <span className="eyebrow">Reference-style feature map</span>
          <p>
            Nova combines public explorer views with regulated financial operations, treasury controls, participant
            approvals, and audit-ready workflows in one console.
          </p>
        </article>

        <article className="card">
          <span className="eyebrow">Approval queue</span>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Action</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {adminQueue.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.action}</td>
                    <td>
                      <span className={`statusBadge ${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </PageShell>
  );
}
