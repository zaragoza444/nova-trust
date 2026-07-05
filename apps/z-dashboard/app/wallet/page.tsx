import Link from "next/link";
import { KpiCard } from "../../components/kpi-card";
import { PageShell } from "../../components/page-shell";
import { ZWalletPanel } from "../../components/z-wallet-panel";
import { getZWalletBalancesData, getZWalletOverviewData, shortenAddress } from "../../lib/z-wallet-data";

export default async function ZWalletPage() {
  const [overview, balances] = await Promise.all([getZWalletOverviewData(), getZWalletBalancesData()]);

  return (
    <PageShell
      title="Z Wallet"
      description="Production Binance-style wallet on Z Blockchain with Funding, Spot, and Earn accounts integrated with Z Bank online and multi-network settlement."
      signals={[
        { label: "Wallet", value: shortenAddress(overview.wallet.address), tone: "positive" },
        { label: "Network", value: `Chain ${overview.settlementChain.chainId}`, tone: "positive" },
        {
          label: "Registration",
          value: overview.wallet.registered ? "On-chain active" : "Pending setup",
          tone: overview.wallet.registered ? "positive" : "neutral"
        },
        {
          label: "Portfolio",
          value: `$${balances.portfolio.totalUsd}`,
          tone: Number(balances.portfolio.totalUsd) > 0 ? "positive" : "neutral"
        }
      ]}
    >
      <section className="grid">
        <KpiCard label="Total balance" value={`$${balances.portfolio.totalUsd}`} delta="Estimated USD (oracle)" />
        <KpiCard label="Funding" value={`$${balances.portfolio.fundingUsd}`} delta="Deposits and stablecoins" />
        <KpiCard label="Spot" value={`$${balances.portfolio.spotUsd}`} delta="Tradable Z Blockchain assets" />
        <KpiCard label="Earn" value={`$${balances.portfolio.earnUsd}`} delta="Liquidity programs" />
      </section>

      <section className="heroGrid">
        <article className="card heroCard heroCardPrimary zWalletHero">
          <span className="eyebrow">Z Wallet production</span>
          <h2>Binance-style treasury wallet on Z Blockchain.</h2>
          <p>
            Manage Funding, Spot, and Earn balances on chain {overview.settlementChain.chainId}. Deposit native Z,
            receive Z Bank online loads, swap against WZ pools, and route settlements across TRON, Ethereum, and BNB.
          </p>
          <div className="highlightGrid">
            <div className="highlightItem">
              <span className="signalLabel">Address</span>
              <strong>{overview.wallet.address}</strong>
            </div>
            <div className="highlightItem">
              <span className="signalLabel">Role</span>
              <strong>{overview.wallet.role}</strong>
            </div>
            <div className="highlightItem">
              <span className="signalLabel">Signing</span>
              <strong>{overview.runtime.signingReady ? "Production key configured" : "View-only mode"}</strong>
            </div>
          </div>
        </article>

        <article className="card heroCard">
          <span className="eyebrow">Quick actions</span>
          <div className="featureChecklist">
            <div>
              <strong>Deposit</strong>
              <p>Send Z or ZBC tokens to your production wallet address.</p>
            </div>
            <div>
              <strong>Load</strong>
              <p>
                <Link href="/zbank">Z Bank online</Link> settles into this wallet on Z Blockchain.
              </p>
            </div>
            <div>
              <strong>Trade</strong>
              <p>
                <Link href="/trading">Spot catalog</Link> and WZ liquidity pools on chain 44002.
              </p>
            </div>
            <div>
              <strong>Multi-network</strong>
              <p>
                <Link href="/networks">International wiring</Link> connects TRON, Ethereum, and BNB.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="card">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Accounts</span>
            <h3>Funding · Spot · Earn</h3>
          </div>
          <span className="metricDelta">{overview.settlementChain.name}</span>
        </div>
        <ZWalletPanel
          walletAddress={overview.wallet.address}
          accounts={balances.accounts}
          assets={balances.assets}
          capabilities={overview.capabilities}
        />
      </section>
    </PageShell>
  );
}
