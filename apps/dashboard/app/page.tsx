import { KpiCard } from "../components/kpi-card";
import { PageShell } from "../components/page-shell";
import { getDashboardData } from "../lib/dashboard-data";

export default async function HomePage() {
  const data = await getDashboardData();

  return (
    <PageShell
      title="Nova chain dashboard"
      description="High-level health for the Nova financial network, including settlement throughput, validator posture, and operational readiness."
      signals={data.shellSignals}
    >
      <section className="heroGrid">
        <article className="card heroCard heroCardPrimary">
          <span className="eyebrow">Operations overview</span>
          <h2>Regulated settlement, treasury control, and network health in one surface.</h2>
          <p>
            Nova blends public explorer visibility with institutional workflows, so operators can move from chain health
            to approvals, treasury activity, and exception handling without context switching.
          </p>

          <div className="highlightGrid">
            {data.homeHighlights.map((item) => (
              <div key={item.label} className="highlightItem">
                <span className="signalLabel">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card heroCard">
          <span className="eyebrow">Chain pulse</span>
          <div className="pulseHeader">
            <div>
              <strong className="pulseValue">82 tx/min</strong>
              <span className="metricDelta">Current throughput</span>
            </div>
            <span className="statusBadge success">Stable</span>
          </div>

          <div className="pulseChart" aria-label="Throughput trend">
            {data.pulseSeries.map((value, index) => (
              <span key={`${value}-${index}`} style={{ height: `${value}%` }} />
            ))}
          </div>

          <div className="actionChips">
            {data.quickActions.map((action) => (
              <span key={action} className="actionChip">
                {action}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="grid">
        {data.metrics.map((metric) => (
          <KpiCard key={metric.label} label={metric.label} value={metric.value} delta={metric.delta} />
        ))}
      </section>

      <section className="dashboardSplit">
        <article className="card">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Latest blocks</span>
              <h3>Recent finalized blocks</h3>
            </div>
            <span className="metricDelta">Finality window 5.2s avg</span>
          </div>
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
                {data.blocks.map((block) => (
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

        <div className="stackColumn">
          <article className="card">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">Operations radar</span>
                <h3>Current alerts</h3>
              </div>
            </div>

            <div className="alertList">
              {data.alerts.map((alert) => (
                <article key={alert.title} className={`alertItem ${alert.severity}`}>
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.detail}</p>
                  </div>
                  <span>{alert.time}</span>
                </article>
              ))}
            </div>
          </article>

          <article className="card">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">Approval queue</span>
                <h3>High-value operator actions</h3>
              </div>
            </div>
            <div className="queueList">
              {data.adminQueue.map((item) => (
                <article key={item.id} className="queueItem">
                  <div>
                    <strong>{item.action}</strong>
                    <p>
                      {item.id} · {item.owner}
                    </p>
                  </div>
                  <span className={`statusBadge ${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="twoColumn">
        <article className="card">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Validator posture</span>
              <h3>Consortium node health</h3>
            </div>
            <span className="metricDelta">1 warning, quorum intact</span>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Validator</th>
                  <th>Status</th>
                  <th>Peers</th>
                  <th>Signed blocks</th>
                </tr>
              </thead>
              <tbody>
                {data.validators.map((validator) => (
                  <tr key={validator.name}>
                    <td>{validator.name}</td>
                    <td>
                      <span className={`statusBadge ${validator.status.toLowerCase()}`}>{validator.status}</span>
                    </td>
                    <td>{validator.peerCount}</td>
                    <td>{validator.signedBlocks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Platform map</span>
              <h3>What operators can do next</h3>
            </div>
          </div>
          <div className="featureChecklist">
            {data.featureChecklist.map((item) => (
              <div key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </PageShell>
  );
}
