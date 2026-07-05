#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${NOVA_PRODUCTION_ENV_FILE:-$ROOT/deploy/.env.production}"
ENV_EXAMPLE="$ROOT/deploy/production.env.example"
RPC_URL="${ZBC_RPC_URL:-http://127.0.0.1:8546}"
DEPLOYER_KEY="${ZBC_DEPLOYER_PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
MANIFEST="${ZBC_BOOTSTRAP_MANIFEST_PATH:-$ROOT/contracts/deployments/z-blockchain-production-liquidity.json}"
MANIFEST_DOCKER="/work/contracts/deployments/z-blockchain-production-liquidity.json"
USE_DOCKER="${GO_LIVE_USE_DOCKER:-auto}"

echo "==> Nova Trust GO LIVE"

if [ ! -f "$ENV_FILE" ]; then
  echo "Creating ${ENV_FILE} from example..."
  cp "$ENV_EXAMPLE" "$ENV_FILE"
fi

install_dependencies() {
  (
    cd "$ROOT"
    NODE_ENV=development npm install
    NODE_ENV=development npm install --workspace @nova/contracts
    NODE_ENV=development npm install --workspace @nova/api
    NODE_ENV=development npm install --workspace @nova/dashboard
  )
}

install_dependencies

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

start_blockchain() {
  if curl -sf -X POST "$RPC_URL" -H "content-type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null 2>&1; then
    echo "Z Blockchain RPC already live at ${RPC_URL}"
    return
  fi

  if command -v docker >/dev/null 2>&1; then
    echo "Starting Z Blockchain node via docker compose..."
    docker compose -f "$ROOT/deploy/docker-compose.z-blockchain.yml" up -d
    for _ in $(seq 1 30); do
      if curl -sf -X POST "$RPC_URL" -H "content-type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null; then
        break
      fi
      sleep 2
    done
  else
    echo "Z Blockchain RPC not reachable at ${RPC_URL} and docker is unavailable."
    exit 1
  fi
}

bootstrap_on_chain() {
  if [ "${GO_LIVE_SKIP_BOOTSTRAP:-false}" = "true" ]; then
    echo "Skipping on-chain bootstrap (GO_LIVE_SKIP_BOOTSTRAP=true)"
    return
  fi

  echo "==> Ensuring BTC clone + oracle prices on chain 44002..."
  (
    cd "$ROOT"
    npm install
    npm install --workspace @nova/contracts
    export ZBC_RPC_URL="$RPC_URL"
    export ZBC_DEPLOYER_PRIVATE_KEY="$DEPLOYER_KEY"
    export ZBC_EXPECTED_CHAIN_ID="44002"
    export ZBC_BOOTSTRAP_MANIFEST_PATH="$MANIFEST"

    if command -v docker >/dev/null 2>&1; then
      docker run --rm --network host \
        -v "$ROOT:/work" -w /work \
        -e ZBC_RPC_URL -e ZBC_DEPLOYER_PRIVATE_KEY -e ZBC_EXPECTED_CHAIN_ID \
        -e ZBC_BOOTSTRAP_MANIFEST_PATH="$MANIFEST_DOCKER" \
        -e ZBC_CLONE_CATALOG_PATH="config/tokens/clone-tokens-btc-1m.v1.json" \
        node:22-bookworm bash -lc "npm run build --workspace @nova/contracts && npm run setup:clone-btc-1m:z-block-chain --workspace @nova/contracts"

      docker run --rm --network host \
        -v "$ROOT:/work" -w /work \
        -e ZBC_RPC_URL -e ZBC_DEPLOYER_PRIVATE_KEY -e ZBC_EXPECTED_CHAIN_ID \
        -e ZBC_BOOTSTRAP_MANIFEST_PATH="$MANIFEST_DOCKER" \
        -e ZBC_ORACLE_REGISTRY_PATH="config/oracles/z-block-chain-prices.v1.json" \
        node:22-bookworm bash -lc "npm run build --workspace @nova/contracts && npm run setup:oracle:z-block-chain --workspace @nova/contracts"
    else
      npm run build --workspace @nova/contracts
      ZBC_CLONE_CATALOG_PATH=config/tokens/clone-tokens-btc-1m.v1.json npm run setup:clone-btc-1m:z-block-chain --workspace @nova/contracts
      ZBC_ORACLE_REGISTRY_PATH=config/oracles/z-block-chain-prices.v1.json npm run setup:oracle:z-block-chain --workspace @nova/contracts
    fi
  )
}

start_services_docker() {
  echo "==> Starting production API + dashboard via docker compose..."
  docker compose -f "$ROOT/deploy/docker-compose.production.yml" up -d --build
}

start_services_local() {
  echo "==> Starting production API + dashboard locally..."
  npm run build --workspace @nova/api
  npm run build --workspace @nova/dashboard

  for session in nova-api-live nova-dashboard-live nova-api-dev nova-api-preview nova-dashboard-preview; do
    tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$session" 2>/dev/null && tmux -f /exec-daemon/tmux.portal.conf kill-session -t "$session" || true
  done

  if command -v fuser >/dev/null 2>&1; then
    fuser -k 4000/tcp >/dev/null 2>&1 || true
    fuser -k 3000/tcp >/dev/null 2>&1 || true
  elif command -v lsof >/dev/null 2>&1; then
    lsof -ti :4000 | xargs -r kill -9 || true
    lsof -ti :3000 | xargs -r kill -9 || true
  else
    netstat -tlnp 2>/dev/null | awk '/:4000 / {print $7}' | cut -d/ -f1 | xargs -r kill -9 || true
    netstat -tlnp 2>/dev/null | awk '/:3000 / {print $7}' | cut -d/ -f1 | xargs -r kill -9 || true
  fi
  sleep 1

  SESSION_API="nova-api-live"
  SESSION_DASH="nova-dashboard-live"

  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_API" -c "$ROOT" -- "${SHELL:-bash}" -l
  tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_API:0.0" "set -a && source \"$ENV_FILE\" && set +a && export NODE_ENV=production && node services/api/dist/app.js" C-m

  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_DASH" -c "$ROOT" -- "${SHELL:-bash}" -l
  tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_DASH:0.0" "set -a && source \"$ENV_FILE\" && set +a && npm run start --workspace @nova/dashboard -- -p 3000 -H 0.0.0.0" C-m

  for _ in $(seq 1 30); do
    if curl -sf "http://127.0.0.1:4000/health" >/dev/null && curl -sf "http://127.0.0.1:3000" >/dev/null; then
      break
    fi
    sleep 2
  done
}

verify_live() {
  echo "==> Running go-live verification..."
  npm run test:multi-network --workspace @nova/api
  curl -sf "http://127.0.0.1:4000/api/go-live/status" | tee /tmp/nova-go-live-status.json
  echo ""
}

start_blockchain
bootstrap_on_chain

if [ "$USE_DOCKER" = "true" ] || { [ "$USE_DOCKER" = "auto" ] && command -v docker >/dev/null 2>&1; }; then
  start_services_docker
else
  start_services_local
fi

verify_live

cat <<EOF

Nova Trust is LIVE

  Dashboard   http://127.0.0.1:3000
  Z Chain     http://127.0.0.1:3000/z-chain
  Networks    http://127.0.0.1:3000/networks
  Trading     http://127.0.0.1:3000/trading
  Z Bank      http://127.0.0.1:3000/zbank
  API health  http://127.0.0.1:4000/health
  Go-live     http://127.0.0.1:4000/api/go-live/status
  Oracle      http://127.0.0.1:4000/api/oracle/prices  (header x-nova-role: AUDITOR)
  Z Blockchain RPC  ${RPC_URL}  (chain 44002)

EOF
