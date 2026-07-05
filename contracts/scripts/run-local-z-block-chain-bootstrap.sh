#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT="$(cd "$CONTRACTS/.." && pwd)"
MANIFEST="$CONTRACTS/deployments/z-block-chain-local-liquidity.json"
HARDHAT_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PORT="${ZBC_LOCAL_RPC_PORT:-8546}"
RPC_URL="http://127.0.0.1:${PORT}"

cleanup() {
  if [[ -n "${HARDHAT_PID:-}" ]] && kill -0 "$HARDHAT_PID" 2>/dev/null; then
    kill "$HARDHAT_PID" 2>/dev/null || true
    wait "$HARDHAT_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "Starting local Z Blockchain node on ${RPC_URL} (chain 44002)..."
(cd "$CONTRACTS" && npx hardhat node --network zBlockChainHardhat --port "$PORT" --hostname 127.0.0.1) &
HARDHAT_PID=$!

for _ in $(seq 1 30); do
  curl -sf -X POST "$RPC_URL" -H "content-type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null && break
  sleep 1
done
sleep 2

(
  cd "$ROOT"
  ZBC_RPC_URL="$RPC_URL" \
  ZBC_DEPLOYER_PRIVATE_KEY="$HARDHAT_KEY" \
  ZBC_EXPECTED_CHAIN_ID="44002" \
  ZBC_NETWORK_NAME="Z Blockchain Local" \
  ZBC_M1FIAT_SUPPLY="1000000" \
  ZBC_M1FIAT_LIQUIDITY="100000" \
  ZBC_WZ_LIQUIDITY="100" \
  ZBC_ACX_SUPPLY="500000" \
  ZBC_ACX_LIQUIDITY="50000" \
  ZBC_WZ_ACX_LIQUIDITY="50" \
  ZBC_SHIVA_SUPPLY="500000" \
  ZBC_SHIVA_LIQUIDITY="50000" \
  ZBC_WZ_SHIVA_LIQUIDITY="50" \
  ZBC_BOOTSTRAP_MANIFEST_PATH="$MANIFEST" \
  npm run setup:z-block-chain --workspace @nova/contracts
)

echo "Local Z Blockchain bootstrap complete. Manifest: ${MANIFEST}"
