import type { ReactNode } from "react";
import { chainTabs } from "../lib/mock-data";
import { SideNav } from "./side-nav";

interface PageShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <div className="appShell">
      <SideNav />
      <main className="mainPanel">
        <header className="topBar">
          <div>
            <div className="statusPill">Nova Mainnet</div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="topBarActions">
            <button className="secondaryButton">UAT</button>
            <button className="primaryButton">Connect wallet</button>
          </div>
        </header>

        <nav className="chainTabs">
          {chainTabs.map((tab, index) => (
            <button key={tab} className={index === 0 ? "chainTab active" : "chainTab"}>
              {tab}
            </button>
          ))}
        </nav>

        {children}
      </main>
    </div>
  );
}
