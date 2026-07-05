#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RPC_URL="http://127.0.0.1:8546"
MANIFEST="$ROOT/deployments/z-block-chain-local-liquidity.json"
DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

echo "Starting local Z Blockchain node..."
docker compose -f "$ROOT/../deploy/docker-compose.z-blockchain.yml" up -d

for _ in $(seq 1 30); do
  if curl -sf -X POST "$RPC_URL" -H "content-type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null; then
    break
  fi
  sleep 2
done

if [ ! -f "$MANIFEST" ]; then
  echo "Running full Z Blockchain bootstrap first..."
  (
    cd "$ROOT/.."
    ZBC_RPC_URL="$RPC_URL" \
    ZBC_DEPLOYER_PRIVATE_KEY="$DEPLOYER_KEY" \
    ZBC_BOOTSTRAP_MANIFEST_PATH="$MANIFEST" \
    npm run setup:z-block-chain:local --workspace @nova/contracts
  )
fi

(
  cd "$ROOT/.."
  ZBC_RPC_URL="$RPC_URL" \
  ZBC_DEPLOYER_PRIVATE_KEY="$DEPLOYER_KEY" \
  ZBC_BOOTSTRAP_MANIFEST_PATH="$MANIFEST" \
  npm run setup:clone-tokens:z-block-chain --workspace @nova/contracts
)

echo "Local clone token mint complete: $MANIFEST"
