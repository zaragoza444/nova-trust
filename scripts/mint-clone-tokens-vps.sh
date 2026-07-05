#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RPC_URL="${ZBC_RPC_URL:-http://127.0.0.1:8546}"
MANIFEST="${ZBC_BOOTSTRAP_MANIFEST_PATH:-$ROOT/contracts/deployments/z-blockchain-production-liquidity.json}"
MANIFEST_DOCKER="/work/contracts/deployments/z-blockchain-production-liquidity.json"
DEPLOYER_KEY="${ZBC_DEPLOYER_PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

echo "Ensuring Z Blockchain node (44002) is running..."
if ! curl -sf -X POST "$RPC_URL" -H "content-type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null 2>&1; then
  docker compose -f "$ROOT/deploy/docker-compose.z-blockchain.yml" up -d
  for _ in $(seq 1 30); do
    if curl -sf -X POST "$RPC_URL" -H "content-type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null; then
      break
    fi
    sleep 2
  done
fi

(
  cd "$ROOT"
  npm install
  docker run --rm --network host \
    -v "$ROOT:/work" -w /work \
    -e ZBC_RPC_URL="$RPC_URL" \
    -e ZBC_DEPLOYER_PRIVATE_KEY="$DEPLOYER_KEY" \
    -e ZBC_EXPECTED_CHAIN_ID="44002" \
    -e ZBC_BOOTSTRAP_MANIFEST_PATH="$MANIFEST_DOCKER" \
    node:22-bookworm bash -lc "npm run build --workspace @nova/contracts && npm run setup:clone-tokens:z-block-chain --workspace @nova/contracts"
)

echo "Clone token mint complete. Manifest: ${MANIFEST}"
