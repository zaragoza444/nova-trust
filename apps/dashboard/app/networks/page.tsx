import { KpiCard } from "../../components/kpi-card";
import { PageShell } from "../../components/page-shell";
import { TokenCapabilityBadges } from "../../components/token-capability-badges";
import { formatChainIdentifier, getMultiNetworkOverviewData } from "../../lib/multi-network-data";

export default async function MultiNetworkPage() {
  const data = await getMultiNetworkOverviewData();

  return (
    <PageShell
      title="Multi-network foundation"
      description="TRON basement network anchoring public Ethereum and BNB Smart Chain rails, with bridge lanes into Nova permissioned settlement chains."
      signals={data.shellSignals}
      chains={data.chainProfiles}
    >
      <section className="grid">
        <KpiCard
          label="Basement network"
          value={data.basementNetwork.name}
          delta={`${formatChainIdentifier(data.basementNetwork)} · ${data.basementNetwork.nativeSymbol}`}
        />
        <KpiCard label="Public networks" value={`${data.summary.publicNetworkCount}`} delta="TRON · Ethereum · BNB" />
        <KpiCard label="Bridge lanes" value={`${data.summary.bridgeLaneCount}`} delta="Cross-network settlement" />
        <KpiCard
          label="Permissioned bridges"
          value={`${data.summary.permissionedBridgeCount}`}
          delta="TRON to Nova / Z Bank"
        />
      </section>

      <section className="heroGrid">
        <article className="card heroCard heroCardPrimary">
          <span className="eyebrow">Basement foundation</span>
          <h2>TRON is the basement network for Nova multi-network operations.</h2>
          <p>
            TRON mainnet anchors cross-network liquidity with Ethereum for public EVM settlement and BNB Smart Chain
            for high-throughput liquidity routing. Custody providers support all three networks for operational wallets
            and cross-chain treasury flows.
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
          <span className="eyebrow">Public bridge lanes</span>
          <div className="queueList">
            {data.bridgeLanes.map((lane) => (
              <article key={`${lane.from}-${lane.to}`} className="queueItem">
                <div>
                  <strong>
                    {lane.fromName ?? lane.from} → {lane.toName ?? lane.to}
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
              <span className="eyebrow">Public networks</span>
              <h3>TRON · Ethereum · BNB Smart Chain</h3>
            </div>
          </div>
          <div className="domainGrid">
            {data.publicNetworks.map((network) => (
              <article key={String(network.chainId)} className="domainCard">
                <strong>
                  {network.name}{" "}
                  {network.networkType === "tron"
                    ? `(TRON ${network.networkId ?? "mainnet"})`
                    : `(Chain ${network.chainId})`}
                </strong>
                <p>
                  {network.nativeSymbol}/{network.wrappedSymbol} · {network.status}
                </p>
              </article>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Permissioned bridges</span>
              <h3>Basement to Nova settlement</h3>
            </div>
          </div>
          <div className="queueList">
            {data.permissionedBridges.map((lane) => (
              <article key={`${lane.from}-${lane.to}`} className="queueItem">
                <div>
                  <strong>
                    {lane.fromName} → {lane.toName}
                  </strong>
                  <p>{lane.purpose}</p>
                </div>
                <span className="statusBadge approved">{lane.status}</span>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="card">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Cross-network tokens</span>
            <h3>Public network asset catalog</h3>
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Class</th>
                <th>Networks</th>
                <th>Capabilities</th>
              </tr>
            </thead>
            <tbody>
              {data.tokens.map((token) => (
                <tr key={token.symbol}>
                  <td>{token.symbol}</td>
                  <td>{token.name}</td>
                  <td>{token.assetClass}</td>
                  <td>{token.networks.join(", ")}</td>
                  <td>
                    <TokenCapabilityBadges
                      capabilities={
                        token.capabilities as {
                          transferable: boolean;
                          tradable: boolean;
                          swappable: boolean;
                          zBankLoadable?: boolean;
                        }
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="sectionHeader">
          <div>
            <span className="eyebrow">Production wiring</span>
            <h3>VPS RPC endpoints and bridge activation</h3>
          </div>
        </div>
        <div className="featureChecklist">
          <div>
            <strong>Env file</strong>
            <p>`cp contracts/multi-network.env.example ~/nova-trust/.env.multi-network`</p>
          </div>
          <div>
            <strong>VPS wire script</strong>
            <p>`bash scripts/wire-multi-network-vps.sh`</p>
          </div>
          <div>
            <strong>Preflight</strong>
            <p>`npm run setup:multi-network:preflight --workspace @nova/contracts`</p>
          </div>
          <div>
            <strong>Health check</strong>
            <p>`GET /api/networks/health` · `npm run test:multi-network`</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
