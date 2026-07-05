#!/usr/bin/env bash
set -euo pipefail

# Wire nginx on LXC 5825 for Z Dashboard on port 80 (proxies to local :3100 + hub API).
# Usage:
#   bash scripts/z-lxc-dashboard-wire.sh
#   Z_LXC_VMID=5825 bash scripts/z-lxc-dashboard-wire.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REGISTRY="$ROOT/config/integrations/z-proxmox-lxc.v1.json"
VMID="${Z_LXC_VMID:-5825}"
HUB_API="${Z_HUB_API:-http://192.168.11.126:4100}"
DASHBOARD_PORT="${Z_DASHBOARD_PORT:-3100}"
TEMPLATE="$ROOT/deploy/nginx/z-lxc-dashboard.conf.template"
SITE="/etc/nginx/sites-available/z-ecosystem-dashboard"

read_dashboard_ip() {
  python3 - "$REGISTRY" "$VMID" <<'PY'
import json, sys
registry = json.load(open(sys.argv[1]))
vmid = int(sys.argv[2])
for item in registry["containers"]:
    if item["vmid"] == vmid:
        print(item["ip"])
        sys.exit(0)
print("192.168.11.127")
PY
}

DASHBOARD_IP="$(read_dashboard_ip)"

echo "==> Wiring Z Dashboard nginx on VMID ${VMID} (${DASHBOARD_IP}:80 → :${DASHBOARD_PORT})"

if ! command -v nginx >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq && apt-get install -y nginx curl
  elif command -v apk >/dev/null 2>&1; then
    apk add --no-cache nginx curl
  fi
fi

mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
sed \
  -e "s|__DASHBOARD_IP__|${DASHBOARD_IP}|g" \
  -e "s|__HUB_API__|${HUB_API}|g" \
  -e "s|__DASHBOARD_PORT__|${DASHBOARD_PORT}|g" \
  "$TEMPLATE" > "$SITE"

ln -sf "$SITE" /etc/nginx/sites-enabled/z-ecosystem-dashboard
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
if command -v systemctl >/dev/null 2>&1; then
  systemctl enable nginx
  systemctl reload nginx
else
  service nginx reload
fi

cat <<EOF

Z Dashboard wired on port 80

  Z Chart     http://${DASHBOARD_IP}/zchart
  Z Trade     http://${DASHBOARD_IP}/ztrade
  Z Swap      http://${DASHBOARD_IP}/zswap
  Z Wallet    http://${DASHBOARD_IP}/wallet
  Z Bank      http://${DASHBOARD_IP}/zbank
  Z Chain     http://${DASHBOARD_IP}/z-chain
  Z Bot       http://${DASHBOARD_IP}/zbot
  API         http://${DASHBOARD_IP}/api/go-live/status
  Health      http://${DASHBOARD_IP}/health

  Direct UI   http://${DASHBOARD_IP}:${DASHBOARD_PORT}/zchart

EOF
