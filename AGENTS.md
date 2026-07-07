# AGENTS.md

## Cursor Cloud specific instructions

Nova Trust Digital Finance is a single-product npm-workspaces monorepo for a permissioned EVM
financial network: a blockchain settlement layer (Hyperledger Besu/QBFT), a Solidity contract
suite, a chain indexer, an operations/explorer API, and a Next.js dashboard. Every layer degrades
gracefully to bundled mock/fallback data, so most services run without their upstream dependency.

Standard commands live in `package.json` (root + each workspace) and `docs/getting-started.md`;
use those rather than duplicating them here. Node 22 and npm are used (CI pins Node 22).

### Services and how they fit together

- `apps/dashboard` (`@nova/dashboard`, Next.js, port 3000): the product UI. Dev: `npm run dev:dashboard`.
  Reads the API via `NOVA_API_URL` (default `http://127.0.0.1:4000`) and falls back to bundled mock
  data if the API is down, so it renders standalone. Sends `x-nova-role` from `NOVA_DASHBOARD_ROLE`
  (default `AUDITOR`).
- `services/api` (`@nova/api`, plain `node:http`, port 4000): Dev: `npm run dev:api`. `dev`/`start`
  run the compiled `dist/` output (they build first), not the TS sources directly. Protected routes
  require an `x-nova-role` header (e.g. `AUDITOR`); without it they return 403. Only `/api/assets`
  reads Postgres (falls back to mock on any DB error); other routes serve mock data.
- `services/indexer` (`@nova/indexer`): Dev: `npm run dev:indexer`. It is a one-shot script (runs
  once and exits), not a long-running daemon. It **requires PostgreSQL** — it calls
  `ensureIndexerSchema` + `persistIndexedSnapshot` and will `process.exit(1)` if the DB is
  unreachable. Besu is optional: without an RPC/deployment manifest it persists a built-in fallback
  snapshot (blocks/txs/validators/3 assets). Re-run it any time to (re)seed Postgres.
- `contracts` (`@nova/contracts`, Hardhat + Solidity 0.8.24): build `npm run build --workspace
  @nova/contracts`; tests `npm run test:contracts`. Tests/deploy use Node native
  `--experimental-strip-types` (needs Node 22+).
- PostgreSQL: hard dependency of the indexer and of `/api/assets`. Default connection string is
  `postgres://nova:nova@localhost:5432/nova` (`NOVA_DATABASE_URL`). Not auto-started; start it before
  running the indexer (e.g. `sudo pg_ctlcluster 16 main start`). Role/db `nova` (password `nova`)
  must exist.

### Data pipeline for a real (non-mock) end-to-end check

Start Postgres -> `npm run dev:indexer` (seeds Postgres) -> `npm run dev:api` -> `npm run dev:dashboard`.
The dashboard `/assets` page then reflects DB-backed data (assets are ordered `created_at desc`, i.e.
NMM, NBI-A, NST — different from the mock order, a quick way to confirm you are seeing live data).

### Besu network caveat (known scaffold limitation)

`infra/besu/docker-compose.yml` is a 7-node QBFT scaffold that **does not start as-is**:
`infra/besu/config/static-nodes.json` ships placeholder enode IDs (e.g. `enode://validator1@...`)
instead of real 128-hex node public keys, so Besu exits with "Invalid enode URL syntax". Running the
chain for real requires generating node keys and rewriting `static-nodes.json` (and matching the
QBFT validator set) — out of scope for normal dev, and not required because the indexer/API/dashboard
all fall back to mock/fallback data. The init/health scripts under `infra/besu/scripts/` are
PowerShell (`.ps1`).

### Lint

`npm run lint` is effectively a no-op: it runs `--workspaces --if-present` and no workspace defines a
`lint` script (matches CI). Do not expect lint failures from it.
