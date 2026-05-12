import { PageShell } from "../../components/page-shell";
import { adminQueue } from "../../lib/mock-data";

export default function AdminPage() {
  return (
    <PageShell
      title="Operations and compliance"
      description="Maker-checker approvals, participant controls, treasury oversight, and audit-ready operator workflows."
    >
      <section className="twoColumn">
        <article className="card">
          <span className="eyebrow">Admin action queue</span>
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
                {adminQueue.map((item) => (
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

        <article className="card">
          <span className="eyebrow">Control domains</span>
          <ul>
            <li>Identity onboarding and participant lifecycle</li>
            <li>Sanctions, freezes, and transfer restriction actions</li>
            <li>Treasury mint, redeem, and rebalance operations</li>
            <li>Validator governance, upgrades, and key rotations</li>
            <li>Immutable audit review and reporting exports</li>
          </ul>
        </article>
      </section>
    </PageShell>
  );
}
