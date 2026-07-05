"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { featureGroups } from "../lib/mock-data";

const routeMap: Record<string, string> = {
  "Z Chart": "/zchart",
  "Z Trade": "/ztrade",
  "Z Swap": "/zswap",
  "Z Wallet": "/wallet",
  "Z Bank": "/zbank",
  "Z Chain": "/z-chain",
  "Multi-network": "/networks"
};

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="sideNav">
      <div className="brandBlock">
        <div className="brandMark">Z</div>
        <div>
          <div className="brandTitle">Z Ecosystem</div>
          <div className="brandSubtitle">Chain · Wallet · Bank · Swap · Trade · Chart</div>
        </div>
      </div>

      {featureGroups.map((group) => (
        <section key={group.title} className="navGroup">
          <h3>{group.title}</h3>
          <ul>
            {group.items.map((item) => (
              <li key={item}>
                <Link
                  href={routeMap[item] ?? "/zchart"}
                  className={pathname === (routeMap[item] ?? "/zchart") ? "navLink active" : "navLink"}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="navFooter">
        <div className="navFooterLabel">Production status</div>
        <strong>Live</strong>
        <span>Z Chain 44002 · Binance-style production stack · independent from Nova.</span>
      </div>
    </aside>
  );
}
