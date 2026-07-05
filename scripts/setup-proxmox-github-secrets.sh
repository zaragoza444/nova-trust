#!/usr/bin/env bash
set -euo pipefail

# Wire GitHub Actions secrets for Proxmox Z Ecosystem deploy.
#
# Usage:
#   cp deploy/proxmox/github-secrets.env.example deploy/proxmox/github-secrets.env
#   # edit management IPs + auth
#   source deploy/proxmox/github-secrets.env
#   bash scripts/setup-proxmox-github-secrets.sh          # print gh commands
#   bash scripts/setup-proxmox-github-secrets.sh --apply  # run gh secret set
#   bash scripts/setup-proxmox-github-secrets.sh --test   # SSH test only

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REGISTRY="$ROOT/config/integrations/z-proxmox-nodes.v1.json"
APPLY=false
TEST_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=true ;;
    --test) TEST_ONLY=true ;;
  esac
done

require_var() {
  local name="$1"
  local value="${!name:-}"
  if [ -z "$value" ]; then
    echo "ERROR: Set ${name} in deploy/proxmox/github-secrets.env"
    exit 1
  fi
  if [[ "$value" == *"???"* ]]; then
    echo "ERROR: Replace placeholder in ${name} (run discover-proxmox-management-ips.sh --write)"
    exit 1
  fi
}

echo "==> Proxmox GitHub secrets for Z Ecosystem LXC 5820–5828"
echo ""

require_var PROXMOX_R630_04_HOST
require_var PROXMOX_R630_03_HOST

if [ -z "${PROXMOX_SSH_PRIVATE_KEY:-}" ] && [ -z "${PROXMOX_SSH_PASSWORD:-}" ]; then
  echo "WARN  Set PROXMOX_SSH_PRIVATE_KEY or PROXMOX_SSH_PASSWORD before --apply"
fi

REPO="${GITHUB_REPOSITORY:-zaragoza444/nova-trust}"

set_secret() {
  local name="$1"
  local value="$2"
  if [ -z "$value" ] || [[ "$value" == *"???"* ]]; then
    return
  fi
  if $APPLY; then
    if ! command -v gh >/dev/null 2>&1; then
      echo "ERROR: gh CLI required for --apply. Install: https://cli.github.com/"
      exit 1
    fi
    printf '%s' "$value" | gh secret set "$name" --repo "$REPO"
    echo "  set  ${name}"
  else
    echo "  gh secret set ${name} --repo ${REPO}"
  fi
}

echo "Repository: ${REPO}"
echo ""
echo "Secrets to configure:"
echo "  PROXMOX_R630_04_HOST=${PROXMOX_R630_04_HOST}  (VMIDs 5820–5824)"
echo "  PROXMOX_R630_03_HOST=${PROXMOX_R630_03_HOST}  (VMIDs 5825–5828)"
echo "  PROXMOX_SSH_USER=${PROXMOX_SSH_USER:-root}"
echo ""

if ! $APPLY; then
  echo "Run with --apply to push secrets via gh CLI, or paste manually in GitHub → Settings → Secrets."
  echo ""
fi

set_secret PROXMOX_R630_04_HOST "$PROXMOX_R630_04_HOST"
set_secret PROXMOX_R630_03_HOST "$PROXMOX_R630_03_HOST"
set_secret PROXMOX_SSH_USER "${PROXMOX_SSH_USER:-root}"
set_secret PROXMOX_SSH_HOST "${PROXMOX_SSH_HOST:-$PROXMOX_R630_04_HOST}"

if [ -n "${PROXMOX_SSH_PRIVATE_KEY:-}" ]; then
  set_secret PROXMOX_SSH_PRIVATE_KEY "$PROXMOX_SSH_PRIVATE_KEY"
fi
if [ -n "${PROXMOX_SSH_PASSWORD:-}" ]; then
  set_secret PROXMOX_SSH_PASSWORD "$PROXMOX_SSH_PASSWORD"
fi

test_ssh() {
  local host="$1"
  local label="$2"
  echo "--- SSH ${label} (${PROXMOX_SSH_USER:-root}@${host})"
  if [ -n "${PROXMOX_SSH_PRIVATE_KEY:-}" ]; then
    ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 \
      -i <(printf '%s' "$PROXMOX_SSH_PRIVATE_KEY") \
      "${PROXMOX_SSH_USER:-root}@${host}" "hostname && pct list | grep -E '582[0-8]' || pct list | tail -5"
  elif [ -n "${PROXMOX_SSH_PASSWORD:-}" ] && command -v sshpass >/dev/null 2>&1; then
    sshpass -p "$PROXMOX_SSH_PASSWORD" ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 \
      "${PROXMOX_SSH_USER:-root}@${host}" "hostname && pct list | grep -E '582[0-8]' || pct list | tail -5"
  else
    ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 \
      "${PROXMOX_SSH_USER:-root}@${host}" "hostname && pct list | grep -E '582[0-8]' || pct list | tail -5"
  fi
}

if $TEST_ONLY || $APPLY; then
  echo ""
  echo "==> SSH connectivity test"
  test_ssh "$PROXMOX_R630_04_HOST" "r630-04"
  test_ssh "$PROXMOX_R630_03_HOST" "r630-03"
  echo ""
  echo "SSH tests passed."
fi

if ! $APPLY && ! $TEST_ONLY; then
  echo "Optional:"
  echo "  bash scripts/setup-proxmox-github-secrets.sh --test"
  echo "  bash scripts/setup-proxmox-github-secrets.sh --apply"
fi
