"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { featureGroups } from "../lib/mock-data";

const routeMap: Record<string, string> = {
  Blocks: "/blocks",
  Transactions: "/transactions",
  Validators: "/validators",
  Settlement: "/",
  "Asset issuance": "/assets",
  "Token trading": "/trading",
  "Multi-network": "/networks",
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
  const pathname = usePathname();

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
                <Link
                  href={routeMap[item] ?? "/"}
                  className={pathname === (routeMap[item] ?? "/") ? "navLink active" : "navLink"}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="navFooter">
        <div className="navFooterLabel">Operations posture</div>
        <strong>Stable</strong>
        <span>All validators live, 3 approvals waiting, release workflow enabled.</span>
      </div>
    </aside>
  );
}
