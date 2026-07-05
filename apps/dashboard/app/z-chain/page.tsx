import { KpiCard } from "../../components/kpi-card";
import { PageShell } from "../../components/page-shell";
import { TokenCapabilityBadges } from "../../components/token-capability-badges";
import { getZBlockChainOverviewData } from "../../lib/z-chain-data";

export default async function ZBlockChainPage() {
  const data = await getZBlockChainOverviewData();

  return (
    <PageShell
      title="Z Block Chain production chart"
      description="Full production network for Z Online Bank on chain 44002 — swappable, tradable, and transferable M1FIAT, ACX, and SHIVA with WZ liquidity pools, aligned to NRW World 33001 architecture."
      signals={data.shellSignals}
      chains={data.chainProfiles}
    >
      <section className="grid">
        <KpiCard label="Chain ID" value={`${data.summary.chainId}`} delta={data.summary.name} />
        <KpiCard label="Native / Wrapped" value={`${data.summary.nativeSymbol} / ${data.summary.wrappedSymbol}`} delta="Z Online Bank rail" />
        <KpiCard label="Liquidity pools" value={`${data.summary.liquidityPools.length}`} delta={data.summary.liquidityPools.join(", ")} />
        <KpiCard label="Validators" value={`${data.topology.validators}`} delta={`${data.topology.rpcNodes} RPC · QBFT ${data.topology.blockPeriodSeconds}s`} />
      </section>

      <section className="heroGrid">
        <article className="card heroCard heroCardPrimary">
          <span className="eyebrow">Production chart</span>
          <h2>Z Block Chain is the Z Online Bank liquidity world chain.</h2>
          <p>
            Like NRW World on chain 33001, Z Block Chain on 44002 hosts full liquidity infrastructure for Z Bank online
            loads, partner bank transfers, and platform trading with compliance-approved pools.
          </p>
          <div className="highlightGrid">
            {Object.entries(data.summary.capabilities).map(([key, enabled]) => (
              <div key={key} className="highlightItem">
                <span className="signalLabel">{key}</span>
                <strong>{enabled ? "Enabled" : "Disabled"}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card heroCard">
          <span className="eyebrow">Bridge lanes</span>
          <div className="queueList">
            {data.bridgeLanes.map((lane) => (
              <article key={`${lane.from}-${lane.to}`} className="queueItem">
                <div>
                  <strong>
                    {lane.from} → {lane.to}
                  </strong>
                  <p>{lane.purpose}</p>
                </div>
                <span className="statusBadge approved">{lane.status}</span>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="twoColumn">
        <article className="card">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Tradable tokens</span>
              <h3>Z Block Chain liquidity catalog</h3>
            </div>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Min load</th>
                  <th>Pairs</th>
                  <th>Capabilities</th>
                </tr>
              </thead>
              <tbody>
                {data.tokens.map((token) => (
                  <tr key={token.symbol}>
                    <td>{token.symbol}</td>
                    <td>{token.name}</td>
                    <td>{token.minLoadAmount}</td>
                    <td>{token.liquidityPairs.join(", ")}</td>
                    <td>
                      <TokenCapabilityBadges capabilities={token.capabilities as { transferable: boolean; tradable: boolean; swappable: boolean; zBankLoadable?: boolean }} />
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
                <span className="eyebrow">Paired networks</span>
                <h3>Multi-chain production map</h3>
              </div>
            </div>
            <div className="domainGrid">
              {data.pairedNetworks.map((network) => (
                <article key={network.chainId} className="domainCard">
                  <strong>
                    {network.name} ({network.chainId})
                  </strong>
                  <p>{network.relationship}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="card">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">Production bootstrap</span>
                <h3>Deploy Z Block Chain liquidity</h3>
              </div>
            </div>
            <div className="featureChecklist">
              <div>
                <strong>Preflight</strong>
                <p>`npm run setup:z-block-chain:preflight --workspace @nova/contracts`</p>
              </div>
              <div>
                <strong>Production</strong>
                <p>`npm run setup:z-block-chain --workspace @nova/contracts`</p>
              </div>
              <div>
                <strong>Local validation</strong>
                <p>`npm run setup:z-block-chain:local --workspace @nova/contracts`</p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
