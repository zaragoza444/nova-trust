import { Pool } from "pg";

interface IndexedAssetRecord {
  assetId: string;
  name: string;
  symbol: string;
  assetClass: string;
  jurisdiction: string;
  contractAddress: string;
  issueSize: number;
  issuer: string;
  treasury: string;
  status: string;
  createdAt: string;
}

interface IndexedIssuanceRecord {
  id: string;
  assetId: string;
  name: string;
  owner: string;
  stage: string;
  status: string;
  targetRaise: string;
  jurisdiction: string;
}

interface IndexedSnapshotPayload {
  assets?: IndexedAssetRecord[];
  issuanceRequests?: IndexedIssuanceRecord[];
}

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.NOVA_DATABASE_URL ?? "postgres://nova:nova@localhost:5432/nova"
    });
  }

  return pool;
}

export async function loadIndexedAssetsSnapshot(): Promise<IndexedSnapshotPayload | null> {
  try {
    const assetResult = await getPool().query<{
      asset_id: string;
      name: string;
      symbol: string;
      asset_class: string;
      jurisdiction: string;
      contract_address: string;
      issue_size: string;
      issuer_address: string;
      treasury_address: string;
      status: string;
      created_at: string;
    }>(
      `select asset_id, name, symbol, asset_class, jurisdiction, contract_address, issue_size, issuer_address, treasury_address, status, created_at
       from assets
       order by created_at desc`
    );

    const issuanceResult = await getPool().query<{
      id: string;
      asset_id: string;
      name: string;
      owner: string;
      stage: string;
      status: string;
      target_raise: string;
      jurisdiction: string;
    }>(
      `select id, asset_id, name, owner, stage, status, target_raise, jurisdiction
       from asset_issuance_requests
       order by updated_at desc`
    );

    return {
      assets: assetResult.rows.map((row) => ({
        assetId: row.asset_id,
        name: row.name,
        symbol: row.symbol,
        assetClass: row.asset_class,
        jurisdiction: row.jurisdiction,
        contractAddress: row.contract_address,
        issueSize: Number(row.issue_size),
        issuer: row.issuer_address,
        treasury: row.treasury_address,
        status: row.status,
        createdAt: row.created_at
      })),
      issuanceRequests: issuanceResult.rows.map((row) => ({
        id: row.id,
        assetId: row.asset_id,
        name: row.name,
        owner: row.owner,
        stage: row.stage,
        status: row.status,
        targetRaise: row.target_raise,
        jurisdiction: row.jurisdiction
      }))
    };
  } catch {
    return null;
  }
}
