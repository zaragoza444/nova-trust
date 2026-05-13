create table if not exists blocks (
  number bigint primary key,
  hash text not null unique,
  parent_hash text not null,
  timestamp timestamptz not null,
  validator_address text not null,
  transaction_count integer not null,
  gas_used numeric(30, 0) not null
);

create table if not exists transactions (
  hash text primary key,
  block_number bigint not null references blocks(number),
  from_address text not null,
  to_address text,
  status text not null,
  category text not null,
  value_wei numeric(40, 0) not null,
  contract_address text,
  method_signature text,
  created_at timestamptz not null default now()
);

create table if not exists addresses (
  address text primary key,
  first_seen_block bigint not null,
  last_seen_block bigint not null,
  is_contract boolean not null default false,
  tags text[] not null default '{}'
);

create table if not exists validators (
  address text primary key,
  moniker text not null,
  status text not null,
  peer_count integer not null default 0,
  signed_blocks_24h integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists tokens (
  address text primary key,
  token_type text not null,
  symbol text not null,
  name text not null,
  decimals integer not null default 18,
  issued_supply numeric(40, 0) not null default 0
);

create table if not exists assets (
  asset_id text primary key,
  contract_address text not null unique,
  symbol text not null,
  name text not null,
  asset_class text not null,
  jurisdiction text not null,
  issue_size numeric(40, 0) not null,
  issuer_address text not null,
  treasury_address text not null,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists asset_issuance_requests (
  id text primary key,
  asset_id text not null,
  name text not null,
  owner text not null,
  stage text not null,
  status text not null,
  target_raise text not null,
  jurisdiction text not null,
  updated_at timestamptz not null default now()
);

create table if not exists compliance_events (
  id bigserial primary key,
  tx_hash text not null,
  participant_address text not null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null
);

create table if not exists treasury_actions (
  id bigint primary key,
  action_type text not null,
  target_address text not null,
  amount numeric(40, 0) not null,
  status text not null,
  created_at timestamptz not null,
  executed_at timestamptz
);

create materialized view if not exists dashboard_metrics as
select
  coalesce((select max(number) from blocks), 0) as indexed_blocks,
  coalesce((select count(*) from transactions where created_at > now() - interval '24 hours'), 0) as transactions_24h,
  coalesce((select count(*) from addresses where last_seen_block >= greatest((select max(number) - 7200 from blocks), 0)), 0) as active_addresses_24h,
  coalesce((select sum(value_wei) from transactions where category = 'settlement' and created_at > now() - interval '24 hours'), 0) as settlement_volume_24h,
  coalesce((select count(*) from transactions where status = 'failed' and category = 'settlement' and created_at > now() - interval '24 hours'), 0) as failed_settlements_24h;
