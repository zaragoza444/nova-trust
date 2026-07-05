import Link from "next/link";
import { KpiCard } from "../../components/kpi-card";
import { PageShell } from "../../components/page-shell";
import { TokenCapabilityBadges } from "../../components/token-capability-badges";
import { ZBankLoadForm } from "../../components/z-bank-load-form";
import { getZBankIntegrationData } from "../../lib/trading-data";

export default async function ZBankPage() {
  const data = await getZBankIntegrationData();
  const minAmounts = Object.fromEntries(data.tradableTokens.map((token) => [token.symbol, token.minLoadAmount]));

  return (
    <PageShell
      title="Z Bank online fund loading"
      description="Load M1FIAT, ACX, and SHIVA from Z Bank online into Chain 138 wallets for swap, trade, and transfer across all approved banks and platforms."
      signals={data.shellSignals}
    >
      <section className="grid">
        <KpiCard label="Provider" value={data.provider.name} delta={`Channel ${data.provider.channel}`} />
        <KpiCard label="Supported tokens" value={`${data.supportedTokens.length}`} delta={data.supportedTokens.join(", ")} />
        <KpiCard
          label="Settlement"
          value={`Chain ${data.supportedChains[0]?.chainId ?? 138}`}
          delta={`Nova One ${data.supportedChains[1]?.chainId ?? 22016}`}
        />
        <KpiCard label="Platforms" value={`${data.approvedPlatforms.length}`} delta="banks and exchanges" />
      </section>

      <section className="heroGrid">
        <article className="card heroCard heroCardPrimary">
          <span className="eyebrow">M1 online load rail</span>
          <h2>Load funds from Z Bank online into swappable Chain 138 tokens.</h2>
          <p>
            Submit a compliant load request for M1FIAT, ACX, or SHIVA. Accepted loads mint to the destination wallet on
            Chain 138 settlement and become immediately usable for trading, swapping, and bank transfers.
          </p>
          <div className="highlightGrid">
            {data.loadMethods.map((method) => (
              <div key={method.id} className="highlightItem">
                <span className="signalLabel">{method.label}</span>
                <strong>Min {method.minAmount} {method.settlementToken}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card heroCard">
          <span className="eyebrow">Post-load capabilities</span>
          <div className="featureChecklist">
            <div>
              <strong>Cross-bank usable</strong>
              <p>{data.capabilities.crossBankUsable ? "Enabled on partner bank network." : "Disabled."}</p>
            </div>
            <div>
              <strong>Platform trading</strong>
              <p>{data.capabilities.platformTradingUsable ? "Enabled on OMNL Exchange and approved venues." : "Disabled."}</p>
            </div>
            <div>
              <strong>Swap ready</strong>
              <p>Tokens route to WNOVA liquidity pools after load confirmation.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="twoColumn">
        <article className="card">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Load request</span>
              <h3>Z Bank online → Chain 138 wallet</h3>
            </div>
            <Link href="/trading" className="secondaryButton">
              View trading catalog
            </Link>
          </div>
          <ZBankLoadForm supportedTokens={data.supportedTokens} minAmounts={minAmounts} />
        </article>

        <div className="stackColumn">
          <article className="card">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">Loadable tokens</span>
                <h3>Minimum amounts and pairs</h3>
              </div>
            </div>
            <div className="queueList">
              {data.tradableTokens.map((token) => (
                <article key={token.symbol} className="queueItem">
                  <div>
                    <strong>
                      {token.symbol} · min {token.minLoadAmount}
                    </strong>
                    <p>
                      {token.name} · pairs: {token.liquidityPairs.join(", ")}
                    </p>
                    <TokenCapabilityBadges capabilities={token.capabilities} />
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="card">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">Approved destinations</span>
                <h3>Where loaded funds can be used</h3>
              </div>
            </div>
            <div className="domainGrid">
              {data.approvedPlatforms.map((platform) => (
                <article key={platform.id} className="domainCard">
                  <strong>{platform.name}</strong>
                  <p>{platform.type}</p>
                  <ul>
                    {platform.capabilities.map((capability) => (
                      <li key={capability}>{capability}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
