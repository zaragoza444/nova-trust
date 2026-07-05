#!/usr/bin/env bash
set -euo pipefail

# Wire production multi-network RPC env on the VPS and verify connectivity.
# Run on the VPS after cloning/pulling nova-trust:
#   bash scripts/wire-multi-network-vps.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${MULTI_NETWORK_ENV_FILE:-$HOME/nova-trust/.env.multi-network}"
EXAMPLE="$ROOT/contracts/multi-network.env.example"

echo "==> Writing multi-network env to ${ENV_FILE}"
mkdir -p "$(dirname "$ENV_FILE")"
cp "$EXAMPLE" "$ENV_FILE"

# Ensure Z Blockchain local RPC matches running Ganache on the VPS
if ! rg -q '^export ZBC_RPC_URL=' "$ENV_FILE"; then
  echo 'export ZBC_RPC_URL="http://127.0.0.1:8546"' >> "$ENV_FILE"
fi

echo "==> Ensuring Z Blockchain node is up (44002 on 8546)..."
if ! curl -sf -X POST "http://127.0.0.1:8546" \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null 2>&1; then
  echo "Z Blockchain RPC not reachable; starting docker compose..."
  docker compose -f "$ROOT/deploy/docker-compose.z-blockchain.yml" up -d
  for _ in $(seq 1 30); do
    if curl -sf -X POST "http://127.0.0.1:8546" \
      -H "content-type: application/json" \
      -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null; then
      break
    fi
    sleep 2
  done
fi

echo "==> Installing dependencies and running multi-network connectivity test"
(
  cd "$ROOT"
  npm install
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  npm run build --workspace @nova/api
  npm run test:multi-network --workspace @nova/api
)

echo ""
echo "Multi-network RPC wiring complete."
echo "Source before starting the API:"
echo "  source ${ENV_FILE}"
echo "  npm run start:api"
