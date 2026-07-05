#!/usr/bin/env bash
set -euo pipefail

# Deploy Z hub stack inside LXC 5824 (omdnl-digital-portal).
# Run inside the container or via: pct exec 5824 -- bash /opt/nova-trust/scripts/z-lxc-hub-go-live.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${Z_PRODUCTION_ENV_FILE:-$ROOT/deploy/.env.z-production}"
ENV_EXAMPLE="$ROOT/deploy/proxmox/z-lxc-production.env.example"

echo "==> Z Ecosystem hub go-live (LXC 5824)"

if [ ! -f "$ENV_FILE" ]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "Created ${ENV_FILE}"
fi

(
  cd "$ROOT"
  NODE_ENV=development npm install
)

export GO_LIVE_USE_DOCKER=true
export Z_PRODUCTION_ENV_FILE="$ENV_FILE"

# Hub runs chain + API only (no dashboard)
docker compose -f "$ROOT/deploy/docker-compose.z-production.yml" up -d --build z-chain z-api z-bot

for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:4100/health" >/dev/null; then
    break
  fi
  sleep 2
done

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

curl -sf -H "x-z-role: AUDITOR" "http://127.0.0.1:4100/api/go-live/status" | tee /tmp/z-hub-go-live-status.json
echo ""

cat <<EOF

Z Hub LIVE on $(hostname -I | awk '{print $1}')

  Z API       http://192.168.11.126:4100/health
  Z Chain RPC http://127.0.0.1:8546 (chain 44002)
  Go-live     http://192.168.11.126:4100/api/go-live/status
  Z Bot       docker compose logs z-bot

EOF
