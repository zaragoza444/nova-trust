import { PageShell } from "../../components/page-shell";
import { getDashboardData } from "../../lib/dashboard-data";

export default async function ValidatorsPage() {
  const data = await getDashboardData();

  return (
    <PageShell
      title="Validators and nodes"
      description="Monitor consortium validator health, peer counts, and recent signing performance."
      signals={data.shellSignals}
    >
      <section className="insightStrip">
        {data.validatorInsights.map((item) => (
          <article key={item.label} className="insightCard">
            <span className="signalLabel">{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <article className="card">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Network</span>
            <h3>Validator and node posture</h3>
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Validator</th>
                <th>Status</th>
                <th>Peers</th>
                <th>Signed blocks (24h)</th>
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
    </PageShell>
  );
}
