import {
  adminDomains,
  adminMetrics,
  adminQueue,
  alerts,
  blockInsights,
  blocks,
  homeHighlights,
  metrics,
  pulseSeries,
  quickActions,
  shellSignals,
  transactionInsights,
  transactions,
  validatorInsights,
  validators
} from "./mock-data";
import { chainProfiles, type ChainProfile } from "./chains";

export interface Signal {
  label: string;
  value: string;
  tone: string;
}

export interface Metric {
  label: string;
  value: string;
  delta: string;
}

export interface Highlight {
  label: string;
  value: string;
}

export interface Insight {
  label: string;
  value: string;
}

export interface AlertItem {
  title: string;
  detail: string;
  severity: string;
  time: string;
}

export interface QueueItem {
  id: string;
  action: string;
  owner: string;
  status: string;
  risk: string;
}

export interface BlockItem {
  number: number;
  validator: string;
  txs: number;
  gasUsed: string;
  time: string;
}

export interface TransactionItem {
  hash: string;
  type: string;
  status: string;
  from: string;
  to: string;
  value: string;
}

export interface ValidatorItem {
  name: string;
  status: string;
  peerCount: number;
  signedBlocks: string;
}

export interface AssetItem {
  assetId: string;
  name: string;
  symbol: string;
  assetClass: string;
  jurisdiction: string;
  contractAddress: string;
  issueSize: string;
  issuer: string;
  treasury: string;
  status: string;
  createdAt: string;
}

export interface IssuanceRequestItem {
  id: string;
  assetId: string;
  name: string;
  owner: string;
  stage: string;
  status: string;
  targetRaise: string;
  jurisdiction: string;
}

export interface AdminDomain {
  title: string;
  summary: string;
  items: string[];
}

export interface FeatureChecklistItem {
  title: string;
  detail: string;
}

export interface DashboardPageData {
  shellSignals: Signal[];
  chainProfiles: ChainProfile[];
  metrics: Metric[];
  homeHighlights: Highlight[];
  pulseSeries: number[];
  quickActions: string[];
  alerts: AlertItem[];
  blocks: BlockItem[];
  blockInsights: Insight[];
  transactions: TransactionItem[];
  transactionInsights: Insight[];
  validators: ValidatorItem[];
  validatorInsights: Insight[];
  adminQueue: QueueItem[];
  adminMetrics: Metric[];
  adminDomains: AdminDomain[];
  featureChecklist: FeatureChecklistItem[];
}

export interface AdminOverviewData {
  shellSignals: Signal[];
  adminMetrics: Metric[];
  adminQueue: QueueItem[];
  adminDomains: AdminDomain[];
  alerts: AlertItem[];
}

export interface AssetsOverviewData {
  shellSignals: Signal[];
  assetMetrics: Metric[];
  assetInsights: Insight[];
  assets: AssetItem[];
  issuanceRequests: IssuanceRequestItem[];
  issuanceControls: FeatureChecklistItem[];
}

const fallbackFeatureChecklist: FeatureChecklistItem[] = [
  { title: "Explorer and network", detail: "Track blocks, transactions, validators, and gas posture." },
  { title: "Treasury and settlement", detail: "Watch liquidity, approve mint/redeem flows, and monitor failures." },
  { title: "Identity and compliance", detail: "Review participant onboarding, freezes, sanctions checks, and approvals." },
  { title: "Release and governance", detail: "Coordinate validator changes, release windows, and audit-ready runbooks." }
];

const fallbackAssetsOverview: AssetsOverviewData = {
  shellSignals,
  assetMetrics: [
    { label: "Tokenized products", value: "3", delta: "1 live" },
    { label: "Issuance in flight", value: "2", delta: "maker-checker active" },
    { label: "Program notional", value: "$45.00M", delta: "across all launched assets" },
    { label: "Factory readiness", value: "Ready", delta: "NovaAssetFactory wired" }
  ],
  assetInsights: [
    { label: "Primary issuance rail", value: "NovaAssetFactory" },
    { label: "Custody destination", value: "Treasury vaults bound" },
    { label: "Compliance posture", value: "Pre-mint checks enforced" }
  ],
  assets: [
    {
      assetId: "NST-2026-001",
      name: "Nova Settlement Token",
      symbol: "NST",
      assetClass: "Cash equivalent",
      jurisdiction: "AE",
      contractAddress: "0x8F4B0D4CcA83fF4dD08f0f5f2E1f3B9E15B93521",
      issueSize: "$25.00M",
      issuer: "Treasury Ops",
      treasury: "Primary Treasury Vault",
      status: "Live",
      createdAt: "May 11, 10:15 AM"
    },
    {
      assetId: "NBI-2026-002",
      name: "Nova Bond Income Series A",
      symbol: "NBI-A",
      assetClass: "Bond",
      jurisdiction: "EU",
      contractAddress: "0x6F903A9A517D6fD0f6E0aF5C6404A5e6bB953142",
      issueSize: "$12.00M",
      issuer: "Capital Markets Desk",
      treasury: "Investor Distribution Vault",
      status: "Bookbuilding",
      createdAt: "May 12, 08:00 AM"
    },
    {
      assetId: "NMM-2026-003",
      name: "Nova Money Market Token",
      symbol: "NMM",
      assetClass: "Fund",
      jurisdiction: "SG",
      contractAddress: "0x4eC74F5E67E43c5f86D1E71B0c8187b2c63B96EE",
      issueSize: "$8.00M",
      issuer: "Structured Products",
      treasury: "Fund Reserve Wallet",
      status: "Pre-issuance",
      createdAt: "May 12, 12:25 PM"
    }
  ],
  issuanceRequests: [
    {
      id: "AS-104",
      assetId: "NBI-2026-002",
      name: "Nova Bond Income Series A",
      owner: "Capital Markets Desk",
      stage: "Legal review",
      status: "Awaiting checker",
      targetRaise: "$12.0M",
      jurisdiction: "EU"
    },
    {
      id: "AS-105",
      assetId: "NMM-2026-003",
      name: "Nova Money Market Token",
      owner: "Structured Products",
      stage: "Metadata mint prep",
      status: "Scheduled",
      targetRaise: "$8.0M",
      jurisdiction: "SG"
    },
    {
      id: "AS-106",
      assetId: "NCP-2026-004",
      name: "Nova Commercial Paper 30D",
      owner: "Treasury Ops",
      stage: "Compliance screening",
      status: "In review",
      targetRaise: "$5.5M",
      jurisdiction: "AE"
    }
  ],
  issuanceControls: [
    { title: "Issuance policy", detail: "Require maker-checker approval, approved metadata, and treasury destination before mint." },
    { title: "Compliance gate", detail: "Bind jurisdiction, sanctions screening, and participant controls before activation." },
    { title: "Operational release", detail: "Promote assets from pre-issuance to live only after contract verification and vault funding." }
  ]
};

const apiBaseUrl = process.env.NOVA_API_URL ?? "http://127.0.0.1:4000";
const apiHeaders = {
  "x-nova-role": process.env.NOVA_DASHBOARD_ROLE ?? "AUDITOR"
};

export async function getDashboardData(): Promise<DashboardPageData> {
  return fetchJson<DashboardPageData>("/api/dashboard", isDashboardPageData, getFallbackDashboardData);
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  return fetchJson<AdminOverviewData>("/api/admin/overview", isAdminOverviewData, getFallbackAdminOverviewData);
}

export async function getAssetsOverviewData(): Promise<AssetsOverviewData> {
  return fetchJson<AssetsOverviewData>("/api/assets", isAssetsOverviewData, getFallbackAssetsOverviewData);
}

async function fetchJson<T>(path: string, validate: (value: unknown) => value is T, fallback: () => T): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: apiHeaders,
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    return validate(payload) ? payload : fallback();
  } catch {
    return fallback();
  }
}

function getFallbackDashboardData(): DashboardPageData {
  return {
    shellSignals,
    chainProfiles,
    metrics,
    homeHighlights,
    pulseSeries,
    quickActions,
    alerts,
    blocks,
    blockInsights,
    transactions,
    transactionInsights,
    validators,
    validatorInsights,
    adminQueue,
    adminMetrics,
    adminDomains,
    featureChecklist: fallbackFeatureChecklist
  };
}

function getFallbackAdminOverviewData(): AdminOverviewData {
  return {
    shellSignals,
    adminMetrics,
    adminQueue,
    adminDomains,
    alerts
  };
}

function getFallbackAssetsOverviewData(): AssetsOverviewData {
  return fallbackAssetsOverview;
}

function isDashboardPageData(value: unknown): value is DashboardPageData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DashboardPageData>;
  return (
    Array.isArray(candidate.shellSignals) &&
    Array.isArray(candidate.chainProfiles) &&
    Array.isArray(candidate.metrics) &&
    Array.isArray(candidate.blocks) &&
    Array.isArray(candidate.transactions) &&
    Array.isArray(candidate.validators) &&
    Array.isArray(candidate.alerts) &&
    Array.isArray(candidate.adminQueue)
  );
}

function isAdminOverviewData(value: unknown): value is AdminOverviewData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AdminOverviewData>;
  return (
    Array.isArray(candidate.shellSignals) &&
    Array.isArray(candidate.adminMetrics) &&
    Array.isArray(candidate.adminQueue) &&
    Array.isArray(candidate.adminDomains) &&
    Array.isArray(candidate.alerts)
  );
}

function isAssetsOverviewData(value: unknown): value is AssetsOverviewData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AssetsOverviewData>;
  return (
    Array.isArray(candidate.shellSignals) &&
    Array.isArray(candidate.assetMetrics) &&
    Array.isArray(candidate.assetInsights) &&
    Array.isArray(candidate.assets) &&
    Array.isArray(candidate.issuanceRequests) &&
    Array.isArray(candidate.issuanceControls)
  );
}
