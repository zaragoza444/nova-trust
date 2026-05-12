import { KpiCard } from "../../components/kpi-card";
import { PageShell } from "../../components/page-shell";
import { getAssetsOverviewData } from "../../lib/dashboard-data";

export default async function AssetsPage() {
  const data = await getAssetsOverviewData();

  return (
    <PageShell
      title="Asset issuance"
      description="Launch tokenized financial products with controlled minting, treasury destination binding, and maker-checker approvals."
      signals={data.shellSignals}
    >
      <section className="grid">
        {data.assetMetrics.map((metric) => (
          <KpiCard key={metric.label} label={metric.label} value={metric.value} delta={metric.delta} />
        ))}
      </section>

      <section className="heroGrid">
        <article className="card heroCard heroCardPrimary">
          <span className="eyebrow">Token factory workspace</span>
          <h2>Turn Nova into a real issuance rail for cash, bonds, funds, and treasury products.</h2>
          <p>
            This workspace is aligned to the on-chain `NovaAssetFactory` contract so operators can move from product setup
            to contract issuance, treasury allocation, and compliance release in one flow.
          </p>

          <div className="highlightGrid">
            {data.assetInsights.map((item) => (
              <div key={item.label} className="highlightItem">
                <span className="signalLabel">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card heroCard">
          <span className="eyebrow">Release controls</span>
          <div className="featureChecklist">
            {data.issuanceControls.map((item) => (
              <div key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="twoColumn">
        <article className="card">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">Live and pending assets</span>
              <h3>Tokenized product catalog</h3>
            </div>
            <span className="metricDelta">Factory-backed issuance</span>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Name</th>
                  <th>Symbol</th>
                  <th>Class</th>
                  <th>Notional</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.assets.map((asset) => (
                  <tr key={asset.assetId}>
                    <td>{asset.assetId}</td>
                    <td>{asset.name}</td>
                    <td>{asset.symbol}</td>
                    <td>{asset.assetClass}</td>
                    <td>{asset.issueSize}</td>
                    <td>
                      <span className={`statusBadge ${asset.status.toLowerCase().replaceAll(" ", "-")}`}>{asset.status}</span>
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
                <span className="eyebrow">Issuance queue</span>
                <h3>Products moving toward mint</h3>
              </div>
            </div>
            <div className="queueList">
              {data.issuanceRequests.map((request) => (
                <article key={request.id} className="queueItem">
                  <div>
                    <strong>{request.name}</strong>
                    <p>
                      {request.assetId} · {request.stage} · {request.targetRaise}
                    </p>
                  </div>
                  <span className={`statusBadge ${request.status.toLowerCase().replaceAll(" ", "-")}`}>{request.status}</span>
                </article>
              ))}
            </div>
          </article>

          <article className="card">
            <div className="sectionHeader">
              <div>
                <span className="eyebrow">Contract release facts</span>
                <h3>Operational handoff details</h3>
              </div>
            </div>
            <div className="featureChecklist">
              {data.assets.map((asset) => (
                <div key={`${asset.assetId}-details`}>
                  <strong>{asset.symbol}</strong>
                  <p>
                    {asset.contractAddress} · {asset.jurisdiction} · treasury: {asset.treasury}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
