import type { ReactNode } from "react";
import { chainTabs, shellSignals } from "../lib/mock-data";
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
          <div className="heroIntro">
            <div className="heroStatusRow">
              <div className="statusPill">Nova Mainnet</div>
              <div className="secondaryPill">Permissioned EVM</div>
            </div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="topBarActions">
            <button className="secondaryButton">UAT</button>
            <button className="primaryButton">Connect wallet</button>
          </div>
        </header>

        <section className="signalBar">
          {shellSignals.map((signal) => (
            <article key={signal.label} className="signalCard">
              <span className="signalLabel">{signal.label}</span>
              <strong className={`signalValue ${signal.tone}`}>{signal.value}</strong>
            </article>
          ))}
        </section>

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
