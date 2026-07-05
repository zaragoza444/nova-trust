#!/usr/bin/env bash
set -euo pipefail

# Deploy Z Dashboard inside LXC 5825 (omnl-office24-portal).
# Run inside the container or via: pct exec 5825 -- bash /opt/nova-trust/scripts/z-lxc-dashboard-go-live.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${Z_PRODUCTION_ENV_FILE:-$ROOT/deploy/.env.z-production}"
ENV_EXAMPLE="$ROOT/deploy/proxmox/z-lxc-dashboard.env.example"

echo "==> Z Ecosystem dashboard go-live (LXC 5825)"

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

docker compose -f "$ROOT/deploy/docker-compose.z-production.yml" up -d --build z-dashboard

for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:3100" >/dev/null; then
    break
  fi
  sleep 2
done

echo "==> Installing nginx for Z Dashboard on port 80"
bash "$ROOT/scripts/z-lxc-dashboard-wire.sh"

cat <<EOF

Z Dashboard LIVE on $(hostname -I | awk '{print $1}')

  Z Chart     http://192.168.11.127/zchart
  Z Trade     http://192.168.11.127/ztrade
  Z Swap      http://192.168.11.127/zswap
  Z Wallet    http://192.168.11.127/wallet
  Z Bank      http://192.168.11.127/zbank
  Z Chain     http://192.168.11.127/z-chain
  Z Bot       http://192.168.11.127/zbot
  API         http://192.168.11.127/api/go-live/status

  Direct      http://192.168.11.127:3100/zchart

EOF
