#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${NOVA_PRODUCTION_ENV_FILE:-$ROOT/deploy/.env.production}"
ENV_EXAMPLE="$ROOT/deploy/production.env.example"
USE_DOCKER="${GO_LIVE_USE_DOCKER:-auto}"

tmux_cmd() {
  if [ -f /exec-daemon/tmux.portal.conf ]; then
    tmux -f /exec-daemon/tmux.portal.conf "$@"
  else
    tmux "$@"
  fi
}

echo "==> Nova Trust GO LIVE"

if [ ! -f "$ENV_FILE" ]; then
  echo "Creating ${ENV_FILE} from example..."
  cp "$ENV_EXAMPLE" "$ENV_FILE"
fi

(
  cd "$ROOT"
  NODE_ENV=development npm install
  NODE_ENV=development npm install --workspace @nova/api
  NODE_ENV=development npm install --workspace @nova/dashboard
)

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

start_services_docker() {
  echo "==> Starting Nova API + dashboard via docker compose..."
  docker compose -f "$ROOT/deploy/docker-compose.production.yml" up -d --build
}

start_services_local() {
  echo "==> Starting Nova API + dashboard locally..."
  npm run build --workspace @nova/api
  npm run build --workspace @nova/dashboard

  for session in nova-api-live nova-dashboard-live; do
    tmux_cmd has-session -t "=$session" 2>/dev/null && tmux_cmd kill-session -t "$session" || true
  done

  if command -v fuser >/dev/null 2>&1; then
    fuser -k 4000/tcp >/dev/null 2>&1 || true
    fuser -k 3000/tcp >/dev/null 2>&1 || true
  fi
  sleep 1

  tmux_cmd new-session -d -s nova-api-live -c "$ROOT" -- "${SHELL:-bash}" -l
  tmux_cmd send-keys -t nova-api-live:0.0 "set -a && source \"$ENV_FILE\" && set +a && export NODE_ENV=production && node services/api/dist/app.js" C-m

  tmux_cmd new-session -d -s nova-dashboard-live -c "$ROOT" -- "${SHELL:-bash}" -l
  tmux_cmd send-keys -t nova-dashboard-live:0.0 "set -a && source \"$ENV_FILE\" && set +a && npm run start --workspace @nova/dashboard -- -p 3000 -H 0.0.0.0" C-m

  for _ in $(seq 1 30); do
    if curl -sf "http://127.0.0.1:4000/health" >/dev/null && curl -sf "http://127.0.0.1:3000" >/dev/null; then
      break
    fi
    sleep 2
  done
}

verify_live() {
  echo "==> Running Nova go-live verification..."
  npm run test:multi-network --workspace @nova/api
  curl -sf "http://127.0.0.1:4000/api/go-live/status" | tee /tmp/nova-go-live-status.json
  echo ""
}

if [ "$USE_DOCKER" = "true" ] || { [ "$USE_DOCKER" = "auto" ] && command -v docker >/dev/null 2>&1; }; then
  start_services_docker
else
  start_services_local
fi

verify_live

cat <<EOF

Nova Trust is LIVE

  Dashboard   http://127.0.0.1:3000
  Networks    http://127.0.0.1:3000/networks
  Trading     http://127.0.0.1:3000/trading
  API health  http://127.0.0.1:4000/health
  Go-live     http://127.0.0.1:4000/api/go-live/status

EOF
