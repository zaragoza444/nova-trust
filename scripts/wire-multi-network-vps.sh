#!/usr/bin/env bash
set -euo pipefail

# Wire production multi-network RPC env on the VPS and verify connectivity.
# Usage:
#   bash scripts/wire-multi-network-vps.sh
#   Z_WIRE_STACK=z bash scripts/wire-multi-network-vps.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${MULTI_NETWORK_ENV_FILE:-$HOME/nova-trust/.env.multi-network}"
EXAMPLE="$ROOT/contracts/multi-network.env.example"
STACK="${Z_WIRE_STACK:-nova}"
API_WORKSPACE="@nova/api"
TEST_SCRIPT="test:multi-network"

if [ "$STACK" = "z" ]; then
  API_WORKSPACE="@z/api"
  TEST_SCRIPT="test:z-multi-network"
fi

echo "==> Writing multi-network env to ${ENV_FILE}"
mkdir -p "$(dirname "$ENV_FILE")"
cp "$EXAMPLE" "$ENV_FILE"

if [ "$STACK" = "z" ]; then
  if ! grep -q '^export ZBC_RPC_URL=' "$ENV_FILE"; then
    echo 'export ZBC_RPC_URL="http://127.0.0.1:8546"' >> "$ENV_FILE"
  fi

  echo "==> Ensuring Z Blockchain node is up (44002 on 8546)..."
  if ! curl -sf -X POST "http://127.0.0.1:8546" \
    -H "content-type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null 2>&1; then
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
fi

echo "==> Installing dependencies and running ${STACK} multi-network connectivity test"
(
  cd "$ROOT"
  npm install
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  npm run build --workspace "$API_WORKSPACE"
  npm run "$TEST_SCRIPT" --workspace "$API_WORKSPACE"
)

echo ""
echo "Multi-network RPC wiring complete for ${STACK} stack."
if [ "$STACK" = "z" ]; then
  echo "Start Z API: npm run start:z-api"
else
  echo "Start Nova API: npm run start:api"
fi
