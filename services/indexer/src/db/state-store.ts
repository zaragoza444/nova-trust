import type { PoolClient } from "pg";
import type { IndexedSnapshot } from "../pipeline/block-processor";
import type { IndexerConfig } from "../config";
import { getIndexerDbPool } from "./client";

interface AddressState {
  firstSeenBlock: number;
  lastSeenBlock: number;
  isContract: boolean;
}

function deriveAddressState(snapshot: IndexedSnapshot) {
  const addresses = new Map<string, AddressState>();
  const contractAddresses = new Set(snapshot.assets.map((asset) => asset.contractAddress.toLowerCase()));

  for (const transaction of snapshot.transactions) {
    for (const [address, isContract] of [
      [transaction.from, false],
      [transaction.to, contractAddresses.has(transaction.to.toLowerCase()) || transaction.category === "contract"]
    ] as const) {
      const normalized = address.toLowerCase();
      const current = addresses.get(normalized);

      if (!current) {
        addresses.set(normalized, {
          firstSeenBlock: transaction.blockNumber,
          lastSeenBlock: transaction.blockNumber,
          isContract
        });
        continue;
      }

      current.firstSeenBlock = Math.min(current.firstSeenBlock, transaction.blockNumber);
      current.lastSeenBlock = Math.max(current.lastSeenBlock, transaction.blockNumber);
      current.isContract = current.isContract || isContract;
    }
  }

  return addresses;
}

async function upsertBlocks(client: PoolClient, snapshot: IndexedSnapshot) {
  for (const block of snapshot.blocks) {
    await client.query(
      `insert into blocks(number, hash, parent_hash, timestamp, validator_address, transaction_count, gas_used)
       values($1, $2, $3, $4, $5, $6, $7)
       on conflict (number) do update set
         hash = excluded.hash,
         parent_hash = excluded.parent_hash,
         timestamp = excluded.timestamp,
         validator_address = excluded.validator_address,
         transaction_count = excluded.transaction_count,
         gas_used = excluded.gas_used`,
      [block.number, block.hash, block.parentHash, block.timestamp, block.validator, block.transactionCount, block.gasUsed]
    );
  }
}

async function upsertTransactions(client: PoolClient, snapshot: IndexedSnapshot) {
  for (const transaction of snapshot.transactions) {
    await client.query(
      `insert into transactions(hash, block_number, from_address, to_address, status, category, value_wei, contract_address, method_signature)
       values($1, $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (hash) do update set
         block_number = excluded.block_number,
         from_address = excluded.from_address,
         to_address = excluded.to_address,
         status = excluded.status,
         category = excluded.category,
         value_wei = excluded.value_wei,
         contract_address = excluded.contract_address,
         method_signature = excluded.method_signature`,
      [
        transaction.hash,
        transaction.blockNumber,
        transaction.from,
        transaction.to,
        transaction.status,
        transaction.category,
        transaction.value,
        transaction.category === "contract" || transaction.category === "asset" ? transaction.to : null,
        null
      ]
    );
  }
}

async function upsertAddresses(client: PoolClient, snapshot: IndexedSnapshot) {
  const addresses = deriveAddressState(snapshot);

  for (const [address, state] of addresses.entries()) {
    await client.query(
      `insert into addresses(address, first_seen_block, last_seen_block, is_contract)
       values($1, $2, $3, $4)
       on conflict (address) do update set
         first_seen_block = least(addresses.first_seen_block, excluded.first_seen_block),
         last_seen_block = greatest(addresses.last_seen_block, excluded.last_seen_block),
         is_contract = addresses.is_contract or excluded.is_contract`,
      [address, state.firstSeenBlock, state.lastSeenBlock, state.isContract]
    );
  }
}

async function upsertValidators(client: PoolClient, snapshot: IndexedSnapshot) {
  for (const validator of snapshot.validators) {
    await client.query(
      `insert into validators(address, moniker, status, peer_count, signed_blocks_24h)
       values($1, $2, $3, $4, $5)
       on conflict (address) do update set
         moniker = excluded.moniker,
         status = excluded.status,
         peer_count = excluded.peer_count,
         signed_blocks_24h = excluded.signed_blocks_24h,
         updated_at = now()`,
      [validator.address, validator.moniker, validator.status, validator.peerCount, validator.signedBlocks24h]
    );
  }
}

async function upsertAssets(client: PoolClient, snapshot: IndexedSnapshot) {
  for (const asset of snapshot.assets) {
    await client.query(
      `insert into assets(asset_id, contract_address, symbol, name, asset_class, jurisdiction, issue_size, issuer_address, treasury_address, status, created_at)
       values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (asset_id) do update set
         contract_address = excluded.contract_address,
         symbol = excluded.symbol,
         name = excluded.name,
         asset_class = excluded.asset_class,
         jurisdiction = excluded.jurisdiction,
         issue_size = excluded.issue_size,
         issuer_address = excluded.issuer_address,
         treasury_address = excluded.treasury_address,
         status = excluded.status,
         created_at = excluded.created_at,
         updated_at = now()`,
      [
        asset.assetId,
        asset.contractAddress,
        asset.symbol,
        asset.name,
        asset.assetClass,
        asset.jurisdiction,
        asset.issueSize,
        asset.issuer,
        asset.treasury,
        asset.status,
        asset.createdAt
      ]
    );

    await client.query(
      `insert into tokens(address, token_type, symbol, name, decimals, issued_supply)
       values($1, $2, $3, $4, $5, $6)
       on conflict (address) do update set
         token_type = excluded.token_type,
         symbol = excluded.symbol,
         name = excluded.name,
         decimals = excluded.decimals,
         issued_supply = excluded.issued_supply`,
      [asset.contractAddress, "asset", asset.symbol, asset.name, 18, asset.issueSize]
    );
  }
}

async function upsertIssuanceRequests(client: PoolClient, snapshot: IndexedSnapshot) {
  for (const request of snapshot.issuanceRequests) {
    await client.query(
      `insert into asset_issuance_requests(id, asset_id, name, owner, stage, status, target_raise, jurisdiction)
       values($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set
         asset_id = excluded.asset_id,
         name = excluded.name,
         owner = excluded.owner,
         stage = excluded.stage,
         status = excluded.status,
         target_raise = excluded.target_raise,
         jurisdiction = excluded.jurisdiction,
         updated_at = now()`,
      [request.id, request.assetId, request.name, request.owner, request.stage, request.status, request.targetRaise, request.jurisdiction]
    );
  }
}

export async function persistIndexedSnapshot(config: IndexerConfig, snapshot: IndexedSnapshot) {
  const pool = getIndexerDbPool(config);
  const client = await pool.connect();

  try {
    await client.query("begin");
    await upsertBlocks(client, snapshot);
    await upsertTransactions(client, snapshot);
    await upsertAddresses(client, snapshot);
    await upsertValidators(client, snapshot);
    await upsertAssets(client, snapshot);
    await upsertIssuanceRequests(client, snapshot);
    await client.query("refresh materialized view dashboard_metrics");
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
