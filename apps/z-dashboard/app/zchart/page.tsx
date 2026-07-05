import Link from "next/link";
import { KpiCard } from "../../components/kpi-card";
import { PageShell } from "../../components/page-shell";
import { getZChartMarketsData, getZEcosystemOverviewData } from "../../lib/z-ecosystem-data";

export default async function ZChartPage() {
  const [ecosystem, chart] = await Promise.all([getZEcosystemOverviewData(), getZChartMarketsData()]);

  return (
    <PageShell
      title="Z Chart"
      description="Binance-style markets dashboard for all Z Chain tradable assets with live oracle pricing on chain 44002."
      signals={[
        { label: "Markets", value: `${chart.marketCount}`, tone: "positive" },
        { label: "Quote", value: chart.quoteCurrency, tone: "neutral" },
        { label: "Chain", value: "Z Chain 44002", tone: "positive" },
        { label: "Style", value: "Production", tone: "positive" }
      ]}
    >
      <section className="grid">
        <KpiCard label="Listed markets" value={`${chart.marketCount}`} delta="Oracle + on-chain feeds" />
        <KpiCard label="Settlement" value="Z Chain" delta="Chain 44002" />
        <KpiCard label="Products" value={`${ecosystem.products.length}`} delta="Full Z ecosystem" />
        <KpiCard label="Wallet treasury" value="Live" delta="Production signing ready" />
      </section>

      <section className="card">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Markets</span>
            <h3>Z Chart — live oracle prices</h3>
          </div>
          <div className="zProductLinks">
            <Link href="/ztrade" className="secondaryButton">Z Trade</Link>
            <Link href="/zswap" className="primaryButton">Z Swap</Link>
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Asset</th>
                <th>Price (USD)</th>
                <th>24h</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {chart.markets.map((market) => (
                <tr key={market.symbol}>
                  <td>{market.rank}</td>
                  <td>
                    <strong>{market.symbol}</strong>
                    <div className="metricDelta">{market.name}</div>
                  </td>
                  <td>${market.priceUsd}</td>
                  <td className={Number(market.change24hPct) >= 0 ? "changeUp" : "changeDown"}>
                    {Number(market.change24hPct) >= 0 ? "+" : ""}
                    {market.change24hPct}%
                  </td>
                  <td>{market.category}</td>
                  <td>
                    <Link href="/ztrade" className="tableAction">
                      Trade
                    </Link>
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
