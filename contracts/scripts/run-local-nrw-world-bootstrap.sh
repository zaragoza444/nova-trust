#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT="$(cd "$CONTRACTS/.." && pwd)"
MANIFEST="$CONTRACTS/deployments/nrw-world-local-liquidity.json"
HARDHAT_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PORT="${NRW_LOCAL_RPC_PORT:-8560}"
RPC_URL="http://127.0.0.1:${PORT}"

cleanup() {
  if [[ -n "${HARDHAT_PID:-}" ]] && kill -0 "$HARDHAT_PID" 2>/dev/null; then
    kill "$HARDHAT_PID" 2>/dev/null || true
    wait "$HARDHAT_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "Starting local NRW World node on ${RPC_URL} (chain 33001)..."
(cd "$CONTRACTS" && npx hardhat node --network nrwWorldHardhat --port "$PORT" --hostname 127.0.0.1) &
HARDHAT_PID=$!

for _ in $(seq 1 30); do
  curl -sf -X POST "$RPC_URL" -H "content-type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null && break
  sleep 1
done
sleep 2

(
  cd "$ROOT"
  NRW_RPC_URL="$RPC_URL" \
  NRW_DEPLOYER_PRIVATE_KEY="$HARDHAT_KEY" \
  NRW_EXPECTED_CHAIN_ID="33001" \
  NRW_NETWORK_NAME="NRW World Local" \
  NRW_M1FIAT_SUPPLY="1000000" \
  NRW_M1FIAT_LIQUIDITY="100000" \
  NRW_WNRW_LIQUIDITY="100" \
  NRW_ACX_SUPPLY="500000" \
  NRW_ACX_LIQUIDITY="50000" \
  NRW_WNRW_ACX_LIQUIDITY="50" \
  NRW_SHIVA_SUPPLY="500000" \
  NRW_SHIVA_LIQUIDITY="50000" \
  NRW_WNRW_SHIVA_LIQUIDITY="50" \
  NRW_BOOTSTRAP_MANIFEST_PATH="$MANIFEST" \
  npm run setup:nrw-world --workspace @nova/contracts
)

echo "Local NRW World bootstrap complete. Manifest: ${MANIFEST}"
