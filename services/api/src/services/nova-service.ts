import { novaDashboardSnapshot, novaUiSeed } from "../mock";
import { bridgeChain, chainProfiles, primaryChain } from "./chain-registry";
import { loadIndexedAssetsSnapshot } from "./indexed-assets";

export class NovaService {
  getHealth() {
    return {
      status: "ok",
      chain: primaryChain.name,
      chainId: primaryChain.chainId,
      chains: chainProfiles,
      timestamp: new Date().toISOString()
    };
  }

  getDashboard() {
    return {
      shellSignals: novaUiSeed.shellSignals,
      chainProfiles,
      metrics: [
        {
          label: "Indexed blocks",
          value: this.formatNumber(novaDashboardSnapshot.metrics.indexedBlocks),
          delta: novaUiSeed.metricDeltas.indexedBlocks
        },
        {
          label: "Transactions / day",
          value: this.formatCompactNumber(novaDashboardSnapshot.metrics.transactions24h),
          delta: novaUiSeed.metricDeltas.transactions24h
        },
        {
          label: "Active addresses",
          value: this.formatNumber(novaDashboardSnapshot.metrics.activeAddresses24h),
          delta: novaUiSeed.metricDeltas.activeAddresses24h
        },
        {
          label: "Settlement volume",
          value: this.formatCurrency(novaDashboardSnapshot.metrics.settlementVolume24h),
          delta: novaUiSeed.metricDeltas.settlementVolume24h
        }
      ],
      homeHighlights: [
        {
          label: "Validator quorum",
          value: `${novaDashboardSnapshot.validators.filter((item) => item.status === "active").length} / ${
            novaDashboardSnapshot.validators.length
          } healthy`
        },
        {
          label: "Treasury exposure",
          value: `${this.formatCurrency(novaDashboardSnapshot.metrics.settlementVolume24h * 2.32)} monitored`
        },
        {
          label: "Compliance queues",
          value: `${novaDashboardSnapshot.adminQueue.filter((item) => item.status !== "Approved").length} awaiting action`
        },
        {
          label: `${bridgeChain.name} readiness`,
          value: `Bridge lane ${primaryChain.chainId} -> ${bridgeChain.chainId} in review`
        }
      ],
      pulseSeries: novaUiSeed.pulseSeries,
      quickActions: novaUiSeed.quickActions,
      alerts: novaUiSeed.alerts,
      blocks: novaDashboardSnapshot.blocks.map((block, index) => ({
        number: block.number,
        validator: block.validator,
        txs: block.transactionCount,
        gasUsed: this.formatCompactNumber(block.gasUsed),
        time: this.formatAge(block.timestamp, index)
      })),
      blockInsights: [
        {
          label: "Average finality",
          value: "5.2s"
        },
        {
          label: "Gas utilization",
          value: `${Math.round(
            (novaDashboardSnapshot.blocks.reduce((total, block) => total + block.gasUsed, 0) /
              (novaDashboardSnapshot.blocks.length * 3000000)) *
              100
          )}%`
        },
        {
          label: "Hot validator",
          value: novaDashboardSnapshot.blocks[0]?.validator ?? "Validator Alpha"
        }
      ],
      transactions: novaDashboardSnapshot.transactions,
      transactionInsights: [
        {
          label: "Failed settlements",
          value: `${novaDashboardSnapshot.metrics.failedSettlements24h} today`
        },
        {
          label: "Largest transfer",
          value: "$2.4M"
        },
        {
          label: "Admin actions",
          value: `${novaDashboardSnapshot.adminQueue.length} queued`
        }
      ],
      validators: novaDashboardSnapshot.validators.map((validator) => ({
        name: validator.moniker,
        status: this.titleCase(validator.status),
        peerCount: validator.peerCount,
        signedBlocks: this.formatNumber(validator.signedBlocks24h)
      })),
      validatorInsights: [
        {
          label: "Average peers",
          value: `${(
            novaDashboardSnapshot.validators.reduce((total, item) => total + item.peerCount, 0) /
            novaDashboardSnapshot.validators.length
          ).toFixed(1)}`
        },
        {
          label: "Warning nodes",
          value: `${novaDashboardSnapshot.validators.filter((item) => item.status !== "active").length}`
        },
        {
          label: "Signing SLA",
          value: "99.3%"
        }
      ],
      adminQueue: novaDashboardSnapshot.adminQueue,
      adminMetrics: [
        {
          label: "Awaiting checker",
          value: `${novaDashboardSnapshot.adminQueue.filter((item) => item.status === "Awaiting checker").length}`,
          delta: "1 high risk item"
        },
        {
          label: "Approved today",
          value: "18",
          delta: "+4 vs yesterday"
        },
        {
          label: "Frozen participants",
          value: "2",
          delta: "unchanged"
        },
        {
          label: "Audit exports",
          value: "24",
          delta: "all delivered"
        }
      ],
      adminDomains: novaUiSeed.adminDomains,
      featureChecklist: novaUiSeed.featureChecklist
    };
  }

  getAdminOverview() {
    const dashboard = this.getDashboard();

    return {
      shellSignals: dashboard.shellSignals,
      adminMetrics: dashboard.adminMetrics,
      adminQueue: dashboard.adminQueue,
      adminDomains: dashboard.adminDomains,
      alerts: dashboard.alerts
    };
  }

  async getAssetsOverview() {
    const indexedSnapshot = await loadIndexedAssetsSnapshot();
    const assets = indexedSnapshot?.assets ?? novaDashboardSnapshot.assets;
    const issuanceRequests = indexedSnapshot?.issuanceRequests ?? novaDashboardSnapshot.issuanceRequests;
    const liveAssets = assets.filter((item) => item.status === "Live").length;
    const issuanceInFlight = issuanceRequests.filter((item) => item.status !== "Scheduled").length;
    const totalNotional = assets.reduce((total, item) => total + item.issueSize, 0);

    return {
      shellSignals: novaUiSeed.shellSignals,
      assetMetrics: [
        {
          label: "Tokenized products",
          value: `${assets.length}`,
          delta: `${liveAssets} live`
        },
        {
          label: "Issuance in flight",
          value: `${issuanceInFlight}`,
          delta: "maker-checker active"
        },
        {
          label: "Program notional",
          value: this.formatCurrency(totalNotional),
          delta: "across all launched assets"
        },
        {
          label: "Factory readiness",
          value: "Ready",
          delta: "NovaAssetFactory wired"
        }
      ],
      assetInsights: [
        {
          label: "Primary issuance rail",
          value: "NovaAssetFactory"
        },
        {
          label: "Custody destination",
          value: "Treasury vaults bound"
        },
        {
          label: "Compliance posture",
          value: "Pre-mint checks enforced"
        }
      ],
      assets: assets.map((asset) => ({
        ...asset,
        issueSize: this.formatCurrency(asset.issueSize),
        createdAt: this.formatDateTime(asset.createdAt)
      })),
      issuanceRequests,
      issuanceControls: [
        {
          title: "Issuance policy",
          detail: "Require maker-checker approval, approved metadata, and treasury destination before mint."
        },
        {
          title: "Compliance gate",
          detail: "Bind jurisdiction, sanctions screening, and participant controls before activation."
        },
        {
          title: "Operational release",
          detail: "Promote assets from pre-issuance to live only after contract verification and vault funding."
        }
      ]
    };
  }

  getAdminQueue() {
    return this.getDashboard().adminQueue;
  }

  private formatNumber(value: number) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  private formatCompactNumber(value: number) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(value);
  }

  private formatCurrency(value: number) {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }

    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }

    return `$${value}`;
  }

  private formatAge(timestamp: string, fallbackIndex: number) {
    const deltaSeconds = Math.max(Math.floor((Date.now() - Date.parse(timestamp)) / 1000), 0);

    if (!Number.isFinite(deltaSeconds) || deltaSeconds === 0) {
      return `${(fallbackIndex + 1) * 5} sec ago`;
    }

    if (deltaSeconds < 60) {
      return `${deltaSeconds} sec ago`;
    }

    const minutes = Math.floor(deltaSeconds / 60);
    return `${minutes} min ago`;
  }

  private titleCase(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private formatDateTime(timestamp: string) {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }
}
