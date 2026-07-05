import Link from "next/link";
import { KpiCard } from "../../components/kpi-card";
import { PageShell } from "../../components/page-shell";
import { getZBotOverviewData, getZBotSignalsData, getZBotStatusData } from "../../lib/z-bot-data";

export default async function ZBotPage() {
  const [overview, status, signals] = await Promise.all([
    getZBotOverviewData(),
    getZBotStatusData(),
    getZBotSignalsData()
  ]);

  return (
    <PageShell
      title="Z Bot"
      description="International trading automation for Z Chain. Routes liquidity across TRON, Ethereum, BNB Smart Chain, and Z Swap pools when oracle and bridge conditions are met."
      signals={[
        { label: "Mode", value: status.mode, tone: status.mode === "live" ? "positive" : "neutral" },
        { label: "Bot", value: status.running ? "Running" : "Idle", tone: status.running ? "positive" : "neutral" },
        { label: "Networks", value: overview.internationalNetworks.join(" · "), tone: "positive" },
        { label: "Strategies", value: `${status.strategiesEnabled} active`, tone: "positive" }
      ]}
    >
      <section className="grid">
        <KpiCard label="Cycles" value={`${status.totalCycles}`} delta="Completed bot cycles" />
        <KpiCard label="Executions" value={`${status.totalExecutions}`} delta="On-chain swaps executed" />
        <KpiCard label="Signals" value={`${signals.signalCount}`} delta="Current opportunities" />
        <KpiCard label="Interval" value={`${status.intervalSeconds}s`} delta="Default automation cadence" />
      </section>

      <section className="card">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Strategies</span>
            <h3>International trading engines</h3>
          </div>
          <div className="zProductLinks">
            <Link href="/zswap" className="secondaryButton">
              Z Swap
            </Link>
            <Link href="/networks" className="primaryButton">
              Multi-network
            </Link>
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {overview.strategies.map((strategy) => (
                <tr key={strategy.id}>
                  <td>{strategy.name}</td>
                  <td>{strategy.enabled ? "Enabled" : "Disabled"}</td>
                  <td>{strategy.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Signals</span>
            <h3>Live international opportunities</h3>
          </div>
        </div>
        {signals.signals.length === 0 ? (
          <p className="muted">No active signals. Bot will scan oracle pools and bridge lanes on the next cycle.</p>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th>Pair</th>
                  <th>Action</th>
                  <th>Amount</th>
                  <th>Deviation</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {signals.signals.map((signal, index) => (
                  <tr key={`${signal.strategyId}-${signal.pair}-${index}`}>
                    <td>{signal.strategyId}</td>
                    <td>{signal.pair}</td>
                    <td>{signal.action}</td>
                    <td>
                      {signal.amountIn} {signal.tokenIn}
                    </td>
                    <td>{signal.deviationPct !== undefined ? `${signal.deviationPct}%` : "—"}</td>
                    <td>{signal.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {status.lastCycle ? (
        <section className="card">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Last cycle</span>
              <h3>{status.lastCycle.cycleId}</h3>
            </div>
          </div>
          <p className="muted">
            Mode {status.lastCycle.mode} · International ready{" "}
            {status.lastCycle.internationalReady ? "yes" : "no"} · Executions {status.lastCycle.executions} · Notional $
            {status.lastCycle.notionalUsd}
          </p>
        </section>
      ) : null}
    </PageShell>
  );
}
