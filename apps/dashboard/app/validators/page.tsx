import { PageShell } from "../../components/page-shell";
import { validators } from "../../lib/mock-data";

export default function ValidatorsPage() {
  return (
    <PageShell
      title="Validators and nodes"
      description="Monitor consortium validator health, peer counts, and recent signing performance."
    >
      <article className="card">
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
