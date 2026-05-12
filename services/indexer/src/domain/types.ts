export interface BlockRecord {
  number: number;
  hash: string;
  timestamp: string;
  transactionCount: number;
  validator: string;
  gasUsed: number;
}

export interface TransactionRecord {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  status: "success" | "failed" | "pending";
  category: "settlement" | "asset" | "governance" | "admin" | "contract";
}

export interface ValidatorRecord {
  address: string;
  moniker: string;
  status: "active" | "warning" | "offline";
  peerCount: number;
  signedBlocks24h: number;
}

export interface AssetRecord {
  assetId: string;
  name: string;
  symbol: string;
  assetClass: string;
  jurisdiction: string;
  contractAddress: string;
  issueSize: number;
  issuer: string;
  treasury: string;
  status: "Live" | "Bookbuilding" | "Pre-issuance" | "Paused";
  createdAt: string;
}

export interface AssetIssuanceRecord {
  id: string;
  assetId: string;
  name: string;
  owner: string;
  stage: string;
  status: "Awaiting checker" | "Scheduled" | "In review" | "Approved";
  targetRaise: string;
  jurisdiction: string;
}

export interface DashboardMetrics {
  indexedBlocks: number;
  transactions24h: number;
  activeAddresses24h: number;
  settlementVolume24h: number;
  failedSettlements24h: number;
}
