import Link from "next/link";
import { KpiCard } from "../../components/kpi-card";
import { PageShell } from "../../components/page-shell";
import { TokenCapabilityBadges } from "../../components/token-capability-badges";
import { getZTradeMarketsData } from "../../lib/z-ecosystem-data";

export default async function ZTradePage() {
  const data = await getZTradeMarketsData();

  return (
    <PageShell
      title="Z Trade"
      description="Binance Spot-style trading on Z Chain. Trade M1FIAT, ACX, SHIVA, and clone tokens on WZ pairs across approved banks and exchanges."
      signals={[
        { label: "Spot markets", value: `${data.marketCount}`, tone: "positive" },
        { label: "Venue", value: "Z Trade", tone: "positive" },
        { label: "Settlement", value: "Z Chain 44002", tone: "positive" },
        { label: "Pairs", value: "vs WZ", tone: "neutral" }
      ]}
    >
      <section className="grid">
        <KpiCard label="Markets" value={`${data.marketCount}`} delta="Spot pairs on Z Chain" />
        <KpiCard label="Quote" value="WZ" delta="Wrapped Z native" />
        <KpiCard label="Z Bank loads" value="Enabled" delta="Fund via Z Bank online" />
        <KpiCard label="Z Wallet" value="Connected" delta="Production treasury" />
      </section>

      <section className="card">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Spot markets</span>
            <h3>Z Trade catalog</h3>
          </div>
          <div className="zProductLinks">
            <Link href="/zbank" className="secondaryButton">
              Load via Z Bank
            </Link>
            <Link href="/zchart" className="primaryButton">
              Z Chart
            </Link>
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Pair</th>
                <th>Asset</th>
                <th>Class</th>
                <th>Price (USD)</th>
                <th>Capabilities</th>
              </tr>
            </thead>
            <tbody>
              {data.markets.map((market) => (
                <tr key={market.symbol}>
                  <td>{market.pair}</td>
                  <td>
                    <strong>{market.symbol}</strong>
                    <div className="metricDelta">{market.name}</div>
                  </td>
                  <td>{market.assetClass}</td>
                  <td>${market.priceUsd}</td>
                  <td>
                    <TokenCapabilityBadges
                      capabilities={{ transferable: true, tradable: true, swappable: true, zBankLoadable: true }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
