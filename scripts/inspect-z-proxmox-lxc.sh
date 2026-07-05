#!/usr/bin/env bash
set -euo pipefail

# Inspect Proxmox LXC VMIDs 5820–5828: pct status/config + HTTP reachability.
# Run on a Proxmox node (needs pct) or any host that can reach 192.168.11.x.
#
# Usage:
#   bash scripts/inspect-z-proxmox-lxc.sh
#   bash scripts/inspect-z-proxmox-lxc.sh --http-only
#   bash scripts/inspect-z-proxmox-lxc.sh --pct-only

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REGISTRY="$ROOT/config/integrations/z-proxmox-lxc.v1.json"
PROXMOX_NODE="${PROXMOX_NODE:-}"

read_node_vmids() {
  python3 - "$REGISTRY" "$PROXMOX_NODE" <<'PY'
import json, sys
registry = json.load(open(sys.argv[1]))
node_filter = sys.argv[2]
items = registry["containers"]
if node_filter:
    items = [i for i in items if i.get("host") == node_filter]
for item in sorted(items, key=lambda x: x["vmid"]):
    print(item["vmid"])
PY
}

mapfile -t VMIDS < <(read_node_vmids)
if [ ${#VMIDS[@]} -eq 0 ]; then
  VMIDS=(5820 5821 5822 5823 5824 5825 5826 5827 5828)
fi

RUN_PCT=true
RUN_HTTP=true

for arg in "$@"; do
  case "$arg" in
    --http-only) RUN_PCT=false ;;
    --pct-only) RUN_HTTP=false ;;
    -h|--help)
      echo "Usage: bash scripts/inspect-z-proxmox-lxc.sh [--http-only|--pct-only]"
      exit 0
      ;;
  esac
done

if $RUN_PCT; then
  echo "============================================================"
  echo "Proxmox LXC status and pct config (${PROXMOX_NODE:-5820–5828})"
  echo "============================================================"
  echo ""

  if ! command -v pct >/dev/null 2>&1; then
    echo "WARN  pct not found on this host — skipping Proxmox inspection."
    echo "      Run this script on r630-03/r630-04 or set PROXMOX_SSH_HOST and use remote-z-proxmox-inspect.py"
    echo ""
  else
    for vmid in "${VMIDS[@]}"; do
      echo "------------------------------------------------------------"
      echo "VMID ${vmid}"
      echo "------------------------------------------------------------"
      if pct status "$vmid" 2>/dev/null; then
        :
      else
        echo "  status: unavailable (container missing or no permission)"
      fi
      echo ""
      echo "--- pct config ${vmid} ---"
      if pct config "$vmid" 2>/dev/null; then
        :
      else
        echo "  (pct config failed for VMID ${vmid})"
      fi
      echo ""
    done
  fi
fi

if $RUN_HTTP; then
  echo "============================================================"
  echo "HTTP reachability (Z Ecosystem endpoints)"
  echo "============================================================"
  echo ""
  bash "$ROOT/scripts/verify-z-proxmox-lxc.sh" || HTTP_EXIT=$?
  HTTP_EXIT="${HTTP_EXIT:-0}"
else
  HTTP_EXIT=0
fi

exit "$HTTP_EXIT"
