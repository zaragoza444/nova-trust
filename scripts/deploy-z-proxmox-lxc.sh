#!/usr/bin/env bash
set -euo pipefail

# Orchestrate Z Ecosystem deployment across Proxmox LXC VMIDs 5820–5828.
# Run on a Proxmox host (or any machine with pct + SSH to LXCs).
#
# Usage:
#   bash scripts/deploy-z-proxmox-lxc.sh
#   Z_LXC_SKIP_CLONE=true bash scripts/deploy-z-proxmox-lxc.sh   # repo already on LXCs
#
# Prerequisites per LXC:
#   - Node 20+, docker, git
#   - /opt/nova-trust checkout (cloned automatically if missing)

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_DIR="${Z_LXC_REPO_DIR:-/opt/nova-trust}"
BRANCH="${Z_LXC_BRANCH:-main}"
REGISTRY="$ROOT/config/integrations/z-proxmox-lxc.v1.json"

HUB_VMID=5824
DASH_VMID=5825
PORTAL_VMIDS=(5820 5821 5822 5823 5826 5827 5828)

pct_exec() {
  local vmid="$1"
  shift
  if command -v pct >/dev/null 2>&1; then
    pct exec "$vmid" -- "$@"
  else
    echo "pct not found — run manually inside VMID ${vmid}: $*"
    return 1
  fi
}

ensure_repo() {
  local vmid="$1"
  pct_exec "$vmid" bash -lc "
    set -euo pipefail
    if [ ! -d '${REPO_DIR}/.git' ]; then
      mkdir -p '${REPO_DIR}'
      git clone https://github.com/zaragoza444/nova-trust.git '${REPO_DIR}'
    fi
    cd '${REPO_DIR}'
    git fetch origin '${BRANCH}'
    git checkout -B '${BRANCH}' FETCH_HEAD
  "
}

install_prereqs() {
  local vmid="$1"
  pct_exec "$vmid" bash -lc "
    set -euo pipefail
    if command -v apt-get >/dev/null 2>&1; then
      apt-get update -qq
      DEBIAN_FRONTEND=noninteractive apt-get install -y git curl ca-certificates docker.io docker-compose-plugin nginx python3 || true
      systemctl enable docker 2>/dev/null || true
      systemctl start docker 2>/dev/null || true
    fi
  " || true
}

echo "==> Z Ecosystem Proxmox LXC deploy (VMIDs 5820–5828)"
echo "    Registry: ${REGISTRY}"
echo "    Branch:   ${BRANCH}"
echo ""

for vmid in "$HUB_VMID" "$DASH_VMID" "${PORTAL_VMIDS[@]}"; do
  echo "==> Preparing LXC ${vmid}"
  install_prereqs "$vmid"
  if [ "${Z_LXC_SKIP_CLONE:-false}" != "true" ]; then
    ensure_repo "$vmid"
  fi
done

echo ""
echo "==> Phase 1: Hub (5824 — Z Chain + Z API + Z Bot)"
pct_exec "$HUB_VMID" bash -lc "cd '${REPO_DIR}' && bash scripts/z-lxc-hub-go-live.sh"

echo ""
echo "==> Phase 2: Dashboard (5825 — Z Dashboard UI)"
pct_exec "$DASH_VMID" bash -lc "cd '${REPO_DIR}' && bash scripts/z-lxc-dashboard-go-live.sh"

echo ""
echo "==> Phase 3: Product portals (nginx reverse proxy)"
for vmid in "${PORTAL_VMIDS[@]}"; do
  echo "--- Portal VMID ${vmid}"
  pct_exec "$vmid" bash -lc "cd '${REPO_DIR}' && Z_LXC_VMID=${vmid} bash scripts/z-lxc-portal-wire.sh"
done

echo ""
echo "==> Phase 4: Hub portal nginx (5824 — direct /z-chain access)"
pct_exec "$HUB_VMID" bash -lc "cd '${REPO_DIR}' && Z_LXC_VMID=5824 Z_LXC_PRIMARY_PATH=/z-chain bash scripts/z-lxc-portal-wire.sh" || true

echo ""
echo "==> Deployment summary"
python3 - "$REGISTRY" <<'PY'
import json, sys
registry = json.load(open(sys.argv[1]))
print("\nZ Ecosystem endpoints:\n")
for item in sorted(registry["containers"], key=lambda x: x["vmid"]):
    path = item.get("primaryPath", "/")
    print(f"  VMID {item['vmid']:4}  {item['name']:28}  {item['ip']:16}  {item.get('zProduct','?'):10}  http://{item['ip']}{path}")
print("\n  Hub API     http://192.168.11.126:4100/health")
print("  Dashboard   http://192.168.11.127:3100/zchart")
print("  Go-live     http://192.168.11.126:4100/api/go-live/status")
PY
