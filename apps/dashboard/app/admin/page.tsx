import { PageShell } from "../../components/page-shell";
import { KpiCard } from "../../components/kpi-card";
import { getAdminOverviewData } from "../../lib/dashboard-data";

export default async function AdminPage() {
  const data = await getAdminOverviewData();

  return (
    <PageShell
      title="Operations and compliance"
      description="Maker-checker approvals, participant controls, treasury oversight, and audit-ready operator workflows."
      signals={data.shellSignals}
    >
      <section className="grid">
        {data.adminMetrics.map((metric) => (
          <KpiCard key={metric.label} label={metric.label} value={metric.value} delta={metric.delta} />
        ))}
      </section>

      <section className="twoColumn">
        <article className="card">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Admin action queue</span>
              <h3>Maker-checker workflow</h3>
            </div>
            <span className="metricDelta">Prioritize high-risk approvals first</span>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Action</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.adminQueue.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.action}</td>
                    <td>{item.owner}</td>
                    <td>
                      <span className={`statusBadge ${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span>
                    </td>
                    <td>
                      <span className={`statusBadge ${item.risk.toLowerCase()}`}>{item.risk}</span>
                    </td>
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
                <span className="eyebrow">Control domains</span>
                <h3>What the ops console manages</h3>
              </div>
            </div>

            <div className="domainGrid">
              {data.adminDomains.map((domain) => (
                <article key={domain.title} className="domainCard">
                  <strong>{domain.title}</strong>
                  <p>{domain.summary}</p>
                  <ul>
                    {domain.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </article>

          <article className="card">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">Incident watch</span>
                <h3>Open operator signals</h3>
              </div>
            </div>
            <div className="alertList compact">
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
        </div>
      </section>
    </PageShell>
  );
}
