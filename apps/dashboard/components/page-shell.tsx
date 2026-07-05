import type { ReactNode } from "react";
import { chainTabs, shellSignals } from "../lib/mock-data";
import { primaryChain, type ChainProfile, formatChainIdentifier } from "../lib/chains";
import { SideNav } from "./side-nav";

interface ShellSignal {
  label: string;
  value: string;
  tone: string;
}

interface PageShellProps {
  title: string;
  description: string;
  children: ReactNode;
  signals?: ShellSignal[];
  chains?: ChainProfile[];
}

export function PageShell({ title, description, children, signals = shellSignals, chains = chainTabs }: PageShellProps) {
  return (
    <div className="appShell">
      <SideNav />
      <main className="mainPanel">
        <header className="topBar">
          <div className="heroIntro">
            <div className="heroStatusRow">
              <div className="statusPill">{primaryChain.name}</div>
              <div className="secondaryPill">Chain {primaryChain.chainId}</div>
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
          {signals.map((signal) => (
            <article key={signal.label} className="signalCard">
              <span className="signalLabel">{signal.label}</span>
              <strong className={`signalValue ${signal.tone}`}>{signal.value}</strong>
            </article>
          ))}
        </section>

        <nav className="chainTabs">
          {chains.map((chain, index) => (
            <button key={chain.slug} className={index === 0 ? "chainTab active" : "chainTab"}>
              <strong>{chain.name}</strong>
              <span>{formatChainIdentifier(chain)}</span>
              <small>
                {chain.nativeSymbol}/{chain.wrappedSymbol} · {chain.role}
              </small>
            </button>
          ))}
        </nav>

        {children}
      </main>
    </div>
  );
}
