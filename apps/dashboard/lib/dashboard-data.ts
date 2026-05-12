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
  risk?: string;
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

const fallbackFeatureChecklist: FeatureChecklistItem[] = [
  { title: "Explorer and network", detail: "Track blocks, transactions, validators, and gas posture." },
  { title: "Treasury and settlement", detail: "Watch liquidity, approve mint/redeem flows, and monitor failures." },
  { title: "Identity and compliance", detail: "Review participant onboarding, freezes, sanctions checks, and approvals." },
  { title: "Release and governance", detail: "Coordinate validator changes, release windows, and audit-ready runbooks." }
];

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

function isDashboardPageData(value: unknown): value is DashboardPageData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DashboardPageData>;
  return (
    Array.isArray(candidate.shellSignals) &&
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
