#!/usr/bin/env bash
set -euo pipefail

# Wire nginx product portal on an LXC (5820–5823, 5826–5828).
# Usage:
#   Z_LXC_VMID=5820 bash scripts/z-lxc-portal-wire.sh
#   Z_LXC_VMID=5820 Z_LXC_PRIMARY_PATH=/ztrade bash scripts/z-lxc-portal-wire.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REGISTRY="$ROOT/config/integrations/z-proxmox-lxc.v1.json"
VMID="${Z_LXC_VMID:?Set Z_LXC_VMID to a portal container id (5820-5823 or 5826-5828)}"

HUB_API="${Z_HUB_API:-http://192.168.11.126:4100}"
DASHBOARD="${Z_DASHBOARD:-http://192.168.11.127:3100}"
TEMPLATE="$ROOT/deploy/nginx/z-lxc-portal.conf.template"
SITE="/etc/nginx/sites-available/z-ecosystem-portal"

read_portal_config() {
  python3 - "$REGISTRY" "$VMID" <<'PY'
import json, sys
registry = json.load(open(sys.argv[1]))
vmid = int(sys.argv[2])
for item in registry["containers"]:
    if item["vmid"] == vmid:
        print(item["ip"])
        print(item.get("primaryPath", "/"))
        print(item.get("zProduct", "z-ecosystem"))
        sys.exit(0)
raise SystemExit(f"VMID {vmid} not found in {sys.argv[1]}")
PY
}

mapfile -t PORTAL_META < <(read_portal_config)
PORTAL_IP="${PORTAL_META[0]}"
PRIMARY_PATH="${Z_LXC_PRIMARY_PATH:-${PORTAL_META[1]}}"

echo "==> Wiring Z portal VMID ${VMID} (${PORTAL_IP}) → ${PRIMARY_PATH}"

if ! command -v nginx >/dev/null 2>&1; then
  echo "Installing nginx..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq && apt-get install -y nginx curl
  elif command -v apk >/dev/null 2>&1; then
    apk add --no-cache nginx curl
  else
    echo "Install nginx manually on this LXC"
    exit 1
  fi
fi

mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
sed \
  -e "s|__PORTAL_IP__|${PORTAL_IP}|g" \
  -e "s|__PRIMARY_PATH__|${PRIMARY_PATH}|g" \
  -e "s|__HUB_API__|${HUB_API}|g" \
  -e "s|__DASHBOARD__|${DASHBOARD}|g" \
  "$TEMPLATE" > "$SITE"

ln -sf "$SITE" /etc/nginx/sites-enabled/z-ecosystem-portal
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
if command -v systemctl >/dev/null 2>&1; then
  systemctl enable nginx
  systemctl reload nginx
else
  service nginx reload
fi

echo "==> Portal health checks"
curl -sf "http://127.0.0.1/health" | head -c 200 || echo "(health pending — ensure hub 5824 is live)"
echo ""

cat <<EOF

Z Portal wired on ${PORTAL_IP}

  Product entry  http://${PORTAL_IP}${PRIMARY_PATH}
  API proxy      http://${PORTAL_IP}/api/go-live/status
  Health         http://${PORTAL_IP}/health

EOF
