import Link from "next/link";
import { featureGroups } from "../lib/mock-data";

const routeMap: Record<string, string> = {
  Blocks: "/blocks",
  Transactions: "/transactions",
  Validators: "/validators",
  Settlement: "/",
  "Asset issuance": "/",
  Treasury: "/admin",
  Governance: "/admin",
  Reporting: "/admin",
  Identity: "/admin",
  Compliance: "/admin",
  Approvals: "/admin",
  "Audit log": "/admin",
  "Operator actions": "/admin"
};

export function SideNav() {
  return (
    <aside className="sideNav">
      <div className="brandBlock">
        <div className="brandMark">NT</div>
        <div>
          <div className="brandTitle">Nova Trust</div>
          <div className="brandSubtitle">Digital Finance</div>
        </div>
      </div>

      {featureGroups.map((group) => (
        <section key={group.title} className="navGroup">
          <h3>{group.title}</h3>
          <ul>
            {group.items.map((item) => (
              <li key={item}>
                <Link href={routeMap[item] ?? "/"}>{item}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </aside>
  );
}
