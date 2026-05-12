import { PageShell } from "../../components/page-shell";
import { validatorInsights, validators } from "../../lib/mock-data";

export default function ValidatorsPage() {
  return (
    <PageShell
      title="Validators and nodes"
      description="Monitor consortium validator health, peer counts, and recent signing performance."
    >
      <section className="insightStrip">
        {validatorInsights.map((item) => (
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
              {validators.map((validator) => (
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
