#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${Z_PRODUCTION_ENV_FILE:-$ROOT/deploy/.env.z-production}"
ENV_EXAMPLE="$ROOT/deploy/z-production.env.example"
RPC_URL="${ZBC_RPC_URL:-http://127.0.0.1:8546}"
USE_DOCKER="${GO_LIVE_USE_DOCKER:-auto}"

tmux_cmd() {
  if [ -f /exec-daemon/tmux.portal.conf ]; then
    tmux -f /exec-daemon/tmux.portal.conf "$@"
  else
    tmux "$@"
  fi
}

echo "==> Z Ecosystem GO LIVE"

if [ ! -f "$ENV_FILE" ]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "Created ${ENV_FILE}"
fi

(
  cd "$ROOT"
  NODE_ENV=development npm install
)

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

  echo "Starting Z Blockchain node..."
  docker compose -f "$ROOT/deploy/docker-compose.z-production.yml" up -d z-chain
  for _ in $(seq 1 30); do
    if curl -sf -X POST "$RPC_URL" -H "content-type: application/json" \
      -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null; then
      break
    fi
    sleep 2
  done
}

start_services_docker() {
  echo "==> Starting Z API + dashboard via docker compose..."
  docker compose -f "$ROOT/deploy/docker-compose.z-production.yml" up -d --build z-api z-dashboard
}

start_services_local() {
  echo "==> Starting Z API + dashboard locally..."
  npm run build --workspace @z/api
  npm run build --workspace @z/dashboard

  SESSION_API="z-api-live"
  SESSION_DASH="z-dashboard-live"

  for session in "$SESSION_API" "$SESSION_DASH"; do
    tmux_cmd has-session -t "=$session" 2>/dev/null && tmux_cmd kill-session -t "$session" || true
  done

  if command -v fuser >/dev/null 2>&1; then
    fuser -k 4100/tcp >/dev/null 2>&1 || true
    fuser -k 3100/tcp >/dev/null 2>&1 || true
  elif command -v lsof >/dev/null 2>&1; then
    lsof -ti :4100 | xargs -r kill -9 || true
    lsof -ti :3100 | xargs -r kill -9 || true
  fi
  sleep 1

  tmux_cmd new-session -d -s "$SESSION_API" -c "$ROOT" -- "${SHELL:-bash}" -l
  tmux_cmd send-keys -t "$SESSION_API:0.0" "set -a && source \"$ENV_FILE\" && set +a && export NODE_ENV=production && node services/z-api/dist/app.js" C-m

  tmux_cmd new-session -d -s "$SESSION_DASH" -c "$ROOT" -- "${SHELL:-bash}" -l
  tmux_cmd send-keys -t "$SESSION_DASH:0.0" "set -a && source \"$ENV_FILE\" && set +a && npm run start --workspace @z/dashboard" C-m
}

wait_for_services() {
  for _ in $(seq 1 30); do
    if curl -sf "http://127.0.0.1:4100/health" >/dev/null && curl -sf "http://127.0.0.1:3100" >/dev/null; then
      return
    fi
    sleep 2
  done
  echo "Timed out waiting for Z API/dashboard health checks"
  exit 1
}

print_urls() {
  local public_host="${Z_PUBLIC_HOST:-51.75.64.28}"
  local public_scheme="${Z_PUBLIC_SCHEME:-http}"
  local use_nginx="${Z_INTERNATIONAL_NGINX:-false}"
  local dashboard_base api_base

  if [ "$use_nginx" = "true" ]; then
    dashboard_base="${public_scheme}://${public_host}"
    api_base="${public_scheme}://${public_host}"
  else
    dashboard_base="http://127.0.0.1:3100"
    api_base="http://127.0.0.1:4100"
  fi

  cat <<EOF

Z Ecosystem is LIVE

  Z Chart     ${dashboard_base}/zchart
  Z Trade     ${dashboard_base}/ztrade
  Z Swap      ${dashboard_base}/zswap
  Z Wallet    ${dashboard_base}/wallet
  Z Bank      ${dashboard_base}/zbank
  Z Chain     ${dashboard_base}/z-chain
  Z API       ${api_base}/health
  Go-live     ${api_base}/api/go-live/status

EOF
}

start_blockchain

if [ "$USE_DOCKER" = "true" ] || { [ "$USE_DOCKER" = "auto" ] && command -v docker >/dev/null 2>&1; }; then
  start_services_docker
else
  start_services_local
fi

wait_for_services
curl -sf -H "x-z-role: AUDITOR" "http://127.0.0.1:4100/api/go-live/status" | tee /tmp/z-go-live-status.json
echo ""
print_urls
