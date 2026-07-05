#!/usr/bin/env bash
set -euo pipefail

# Register and wire the production Z Wallet on Z Blockchain (44002).
# Usage:
#   cp contracts/z-wallet.env.example deploy/.env.z-wallet
#   # edit deploy/.env.z-wallet with Z_WALLET_ADDRESS and admin key
#   bash scripts/setup-z-wallet-production.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${Z_WALLET_ENV_FILE:-$ROOT/deploy/.env.z-wallet}"
RPC_URL="${ZBC_RPC_URL:-http://127.0.0.1:8546}"

if [ ! -f "$ENV_FILE" ]; then
  cp "$ROOT/contracts/z-wallet.env.example" "$ENV_FILE"
  echo "Created ${ENV_FILE} — edit Z_WALLET_ADDRESS and ZBC_DEPLOYER_PRIVATE_KEY before re-running."
  exit 1
fi

echo "==> Ensuring Z Blockchain RPC is reachable at ${RPC_URL}"
if ! curl -sf -X POST "$RPC_URL" \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null 2>&1; then
  echo "Starting Z Blockchain node..."
  docker compose -f "$ROOT/deploy/docker-compose.z-blockchain.yml" up -d
  for _ in $(seq 1 30); do
    if curl -sf -X POST "$RPC_URL" \
      -H "content-type: application/json" \
      -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null; then
      break
    fi
    sleep 2
  done
fi

(
  cd "$ROOT"
  npm install
  npm install --workspace @nova/contracts
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  npm run build --workspace @nova/contracts
  npm run setup:z-wallet:production --workspace @nova/contracts
)

echo ""
echo "Z Wallet production registration complete."
echo "Verify balances: curl -H 'x-z-role: AUDITOR' http://127.0.0.1:4100/api/z-wallet/overview"
