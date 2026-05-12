# Getting Started

## Requirements

- Node.js `18+`
- npm `9+`
- Docker Desktop for local Besu infrastructure

## Install

From the repository root:

```bash
npm install
```

## Common Commands

Start the dashboard:

```bash
npm start
```

If port `3000` is busy:

```bash
npm start -- --port 3005
```

Start individual services:

```bash
npm run dev:api
npm run dev:indexer
npm run dev:dashboard
```

Run the release validation build:

```bash
npm run release:check
```

## Infrastructure

The local chain configuration lives under `infra/besu/`.

Key files:

- `infra/besu/docker-compose.yml`
- `infra/besu/config/genesis.json`
- `infra/besu/scripts/init-network.ps1`
- `infra/besu/scripts/check-health.ps1`

## Suggested First Reads

- `README.md`
- `docs/architecture/network-foundation.md`
- `docs/releases.md`
