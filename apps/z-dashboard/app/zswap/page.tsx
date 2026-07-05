import Link from "next/link";
import { KpiCard } from "../../components/kpi-card";
import { PageShell } from "../../components/page-shell";
import { getZSwapPoolsData } from "../../lib/z-ecosystem-data";

export default async function ZSwapPage() {
  const data = await getZSwapPoolsData();

  return (
    <PageShell
      title="Z Swap"
      description="Binance Swap-style liquidity pools on Z Chain. Swap M1FIAT, ACX, SHIVA, and clone assets against WZ with 0.3% pool fees."
      signals={[
        { label: "Pools", value: `${data.poolCount}`, tone: "positive" },
        { label: "Quote asset", value: "WZ", tone: "neutral" },
        { label: "Fee", value: "0.30%", tone: "neutral" },
        { label: "Network", value: "Z Chain 44002", tone: "positive" }
      ]}
    >
      <section className="grid">
        <KpiCard label="Active pools" value={`${data.poolCount}`} delta="WZ paired liquidity" />
        <KpiCard label="Venue" value="Z Swap" delta="Binance Swap analog" />
        <KpiCard label="Settlement" value="Z Chain" delta="Permissioned EVM" />
        <KpiCard label="Compliance" value="Approved" delta="Identity + compliance registry" />
      </section>

      <section className="heroGrid">
        <article className="card heroCard heroCardPrimary">
          <span className="eyebrow">Instant swap</span>
          <h2>Swap on Z Chain WZ liquidity pools.</h2>
          <p>
            Route through compliance-approved Z Swap pools on chain 44002. Every pool pairs tradable assets against WZ,
            the wrapped native token of Z Chain — the Binance Chain equivalent for the Z ecosystem.
          </p>
        </article>
        <article className="card heroCard">
          <span className="eyebrow">Quick links</span>
          <div className="featureChecklist">
            <div>
              <strong>Z Chart</strong>
              <p>
                <Link href="/zchart">View live market prices</Link>
              </p>
            </div>
            <div>
              <strong>Z Trade</strong>
              <p>
                <Link href="/ztrade">Open spot markets</Link>
              </p>
            </div>
            <div>
              <strong>Z Wallet</strong>
              <p>
                <Link href="/wallet">Manage treasury balances</Link>
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="card">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Liquidity pools</span>
            <h3>Z Swap pool catalog</h3>
          </div>
        </div>
        <div className="domainGrid">
          {data.pools.map((pool) => (
            <article key={pool.pair} className="domainCard">
              <strong>{pool.pair}</strong>
              <p>
                {pool.base}/{pool.quote} · fee {(pool.feeBps / 100).toFixed(2)}%
              </p>
              <span className="statusBadge approved">{pool.status}</span>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
