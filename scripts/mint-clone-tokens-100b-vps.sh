#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RPC_URL="${ZBC_RPC_URL:-http://127.0.0.1:8546}"
MANIFEST="${ZBC_BOOTSTRAP_MANIFEST_PATH:-$ROOT/contracts/deployments/z-blockchain-production-liquidity.json}"
MANIFEST_DOCKER="/work/contracts/deployments/z-blockchain-production-liquidity.json"
DEPLOYER_KEY="${ZBC_DEPLOYER_PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

echo "Minting 100 billion supply clone tokens on Z Blockchain (44002)..."

(
  cd "$ROOT"
  npm install
  docker run --rm --network host \
    -v "$ROOT:/work" -w /work \
    -e ZBC_RPC_URL="$RPC_URL" \
    -e ZBC_DEPLOYER_PRIVATE_KEY="$DEPLOYER_KEY" \
    -e ZBC_EXPECTED_CHAIN_ID="44002" \
    -e ZBC_BOOTSTRAP_MANIFEST_PATH="$MANIFEST_DOCKER" \
    -e ZBC_CLONE_CATALOG_PATH="config/tokens/clone-tokens-100b.v1.json" \
    node:22-bookworm bash -lc "npm run build --workspace @nova/contracts && npm run setup:clone-tokens-100b:z-block-chain --workspace @nova/contracts"
)

echo "100B clone token mint complete. Manifest: ${MANIFEST}"
