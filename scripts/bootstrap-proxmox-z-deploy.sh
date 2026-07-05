#!/usr/bin/env bash
set -euo pipefail

# One-shot: discover Proxmox IPs → test SSH → push GitHub secrets → optional deploy.
#
# Usage (on LAN with SSH to Proxmox):
#   export PROXMOX_SSH_PRIVATE_KEY="$(cat ~/.ssh/id_ed25519)"
#   bash scripts/bootstrap-proxmox-z-deploy.sh
#   bash scripts/bootstrap-proxmox-z-deploy.sh --deploy

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY=false
BRANCH="${Z_LXC_BRANCH:-cursor/z-proxmox-lxc-deploy-4f28}"

for arg in "$@"; do
  case "$arg" in
    --deploy) DEPLOY=true ;;
  esac
done

echo "==> Step 1: Discover Proxmox management IPs"
bash "$ROOT/scripts/discover-proxmox-management-ips.sh" --write
source "$ROOT/deploy/proxmox/github-secrets.env"

echo ""
echo "==> Step 2: Test SSH to both nodes"
bash "$ROOT/scripts/setup-proxmox-github-secrets.sh" --test

echo ""
echo "==> Step 3: Push GitHub secrets"
bash "$ROOT/scripts/setup-proxmox-github-secrets.sh" --apply

if $DEPLOY; then
  echo ""
  echo "==> Step 4: Deploy Z Ecosystem to LXC 5820–5828"
  export Z_LXC_BRANCH="$BRANCH"
  python3 "$ROOT/scripts/remote-z-proxmox-deploy.py"
  python3 "$ROOT/scripts/remote-z-proxmox-inspect.py" || true
fi

echo ""
echo "Done. Run GitHub workflow 'Deploy Z Ecosystem (Proxmox LXC)' or use --deploy next time."
