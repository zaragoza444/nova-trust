import { KpiCard } from "../../components/kpi-card";
import { PageShell } from "../../components/page-shell";
import { TokenCapabilityBadges } from "../../components/token-capability-badges";
import { getTradingOverviewData } from "../../lib/trading-data";

export default async function TradingPage() {
  const data = await getTradingOverviewData();

  return (
    <PageShell
      title="Chain 138 token trading"
      description="M1FIAT, ACX, and SHIVA are swappable, tradable, and transferable across approved banks and trading platforms on Chain 138 settlement."
      signals={data.shellSignals}
      chains={data.chainProfiles}
    >
      <section className="grid">
        {data.tradingMetrics.map((metric) => (
          <KpiCard key={metric.label} label={metric.label} value={metric.value} delta={metric.delta} />
        ))}
      </section>

      <section className="heroGrid">
        <article className="card heroCard heroCardPrimary">
          <span className="eyebrow">Tradable token rail</span>
          <h2>Swap, trade, and transfer M1, ACX, and SHIVA on Chain 138.</h2>
          <p>
            Each token is ERC-20 compatible and paired with WNOVA in a compliance-approved liquidity pool. After Z Bank
            online fund loading, tokens can move across partner banks, OMNL Exchange, and approved DEX venues.
          </p>
          <div className="highlightGrid">
            {data.tradingInsights.map((item) => (
              <div key={item.label} className="highlightItem">
                <span className="signalLabel">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card heroCard">
          <span className="eyebrow">Approved usage</span>
          <div className="featureChecklist">
            <div>
              <strong>Transferable</strong>
              <p>Send tokens wallet-to-wallet for compliant Chain 138 participants.</p>
            </div>
            <div>
              <strong>Tradable</strong>
              <p>Use on OMNL Exchange and partner bank trading rails.</p>
            </div>
            <div>
              <strong>Swappable</strong>
              <p>Swap against WNOVA in Nova liquidity pools with 0.3% fee.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="twoColumn">
        <article className="card">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Token catalog</span>
              <h3>Chain {data.chain.chainId} tradable assets</h3>
            </div>
            <span className="metricDelta">{data.tokens.length} tokens registered</span>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Pairs</th>
                  <th>Capabilities</th>
                </tr>
              </thead>
              <tbody>
                {data.tokens.map((token) => (
                  <tr key={token.assetId}>
                    <td>{token.symbol}</td>
                    <td>{token.name}</td>
                    <td>{token.assetClass}</td>
                    <td>{token.liquidityPairs.join(", ")}</td>
                    <td>
                      <TokenCapabilityBadges capabilities={token.capabilities} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="stackColumn">
          <article className="card">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">Approved platforms</span>
                <h3>Banks and trading venues</h3>
              </div>
            </div>
            <div className="queueList">
              {data.approvedPlatforms.map((platform) => (
                <article key={platform.id} className="queueItem">
                  <div>
                    <strong>{platform.name}</strong>
                    <p>
                      {platform.type} · {platform.supportedTokens.join(", ")} · {platform.capabilities.join(", ")}
                    </p>
                  </div>
                  <span className="statusBadge approved">Approved</span>
                </article>
              ))}
            </div>
          </article>

          <article className="card">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">Approved token set</span>
                <h3>Cross-platform symbols</h3>
              </div>
            </div>
            <div className="capabilityBadges">
              {data.approvedTokens.map((symbol) => (
                <span key={symbol} className="statusBadge approved">
                  {symbol}
                </span>
              ))}
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
