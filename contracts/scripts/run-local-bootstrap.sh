#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT="$(cd "$CONTRACTS/.." && pwd)"
MANIFEST="$CONTRACTS/deployments/nova-one-local-liquidity.json"
HARDHAT_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PORT="${NOVA_LOCAL_RPC_PORT:-8545}"
RPC_URL="http://127.0.0.1:${PORT}"

cleanup() {
  if [[ -n "${HARDHAT_PID:-}" ]] && kill -0 "$HARDHAT_PID" 2>/dev/null; then
    kill "$HARDHAT_PID" 2>/dev/null || true
    wait "$HARDHAT_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

echo "Starting local Nova One node on ${RPC_URL} (chain 22016)..."
(
  cd "$CONTRACTS"
  npx hardhat node --network hardhat --port "$PORT" --hostname 127.0.0.1
) &
HARDHAT_PID=$!

for _ in $(seq 1 30); do
  if curl -sf -X POST "$RPC_URL" \
    -H "content-type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null; then
    break
  fi
  sleep 1
done

sleep 2

CHAIN_ID="$(curl -sf -X POST "$RPC_URL" \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | python3 -c 'import json,sys; print(int(json.load(sys.stdin)["result"], 16))')"

if [[ "$CHAIN_ID" != "22016" ]]; then
  echo "Expected chain 22016, got ${CHAIN_ID}"
  exit 1
fi

echo "Running local liquidity bootstrap..."
(
  cd "$ROOT"
  NOVA_RPC_URL="$RPC_URL" \
  NOVA_DEPLOYER_PRIVATE_KEY="$HARDHAT_KEY" \
  NOVA_EXPECTED_CHAIN_ID="22016" \
  NOVA_NETWORK_NAME="Nova One Local" \
  NOVA_M1FIAT_SUPPLY="1000000" \
  NOVA_M1FIAT_LIQUIDITY="100000" \
  NOVA_WNOVA_LIQUIDITY="100" \
  NOVA_ACX_SUPPLY="500000" \
  NOVA_ACX_LIQUIDITY="50000" \
  NOVA_WNOVA_ACX_LIQUIDITY="50" \
  NOVA_SHIVA_SUPPLY="500000" \
  NOVA_SHIVA_LIQUIDITY="50000" \
  NOVA_WNOVA_SHIVA_LIQUIDITY="50" \
  NOVA_PRODUCTION_BOOTSTRAP_MANIFEST_PATH="$MANIFEST" \
  npm run setup:production --workspace @nova/contracts
)

echo "Local bootstrap complete. Manifest: ${MANIFEST}"
