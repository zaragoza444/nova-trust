#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${Z_PRODUCTION_ENV_FILE:-$ROOT/deploy/.env.z-production}"
ENV_EXAMPLE="$ROOT/deploy/z-production.env.example"
RPC_URL="${ZBC_RPC_URL:-http://127.0.0.1:8546}"

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

if ! curl -sf -X POST "$RPC_URL" -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null 2>&1; then
  docker compose -f "$ROOT/deploy/docker-compose.z-production.yml" up -d z-chain
  for _ in $(seq 1 30); do
    if curl -sf -X POST "$RPC_URL" -H "content-type: application/json" \
      -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null; then
      break
    fi
    sleep 2
  done
fi

npm run build --workspace @z/api
npm run build --workspace @z/dashboard

SESSION_API="z-api-live"
SESSION_DASH="z-dashboard-live"

for session in "$SESSION_API" "$SESSION_DASH"; do
  tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$session" 2>/dev/null && tmux -f /exec-daemon/tmux.portal.conf kill-session -t "$session" || true
done

tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_API" -c "$ROOT" -- "${SHELL:-bash}" -l
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_API:0.0" "set -a && source \"$ENV_FILE\" && set +a && export NODE_ENV=production && node services/z-api/dist/app.js" C-m

tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_DASH" -c "$ROOT" -- "${SHELL:-bash}" -l
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_DASH:0.0" "set -a && source \"$ENV_FILE\" && set +a && npm run start --workspace @z/dashboard" C-m

for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:4100/health" >/dev/null && curl -sf "http://127.0.0.1:3100" >/dev/null; then
    break
  fi
  sleep 2
done

curl -sf -H "x-z-role: AUDITOR" "http://127.0.0.1:4100/api/go-live/status" | tee /tmp/z-go-live-status.json
echo ""

cat <<EOF

Z Ecosystem is LIVE

  Z Chart     http://127.0.0.1:3100/zchart
  Z Trade     http://127.0.0.1:3100/ztrade
  Z Swap      http://127.0.0.1:3100/zswap
  Z Wallet    http://127.0.0.1:3100/wallet
  Z Bank      http://127.0.0.1:3100/zbank
  Z Chain     http://127.0.0.1:3100/z-chain
  Z API       http://127.0.0.1:4100/health
  Go-live     http://127.0.0.1:4100/api/go-live/status

EOF
