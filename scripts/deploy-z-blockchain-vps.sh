#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RPC_URL="${ZBC_RPC_URL:-http://127.0.0.1:8546}"
DEPLOYER_KEY="${ZBC_DEPLOYER_PRIVATE_KEY:-0xac0974bec39a17e36ba4a06bb41922e206928527235df67593feb82667f399966}"
MANIFEST="${ZBC_BOOTSTRAP_MANIFEST_PATH:-$ROOT/contracts/deployments/z-blockchain-production-liquidity.json}"

echo "Starting Z Blockchain node (44002)..."
docker compose -f "$ROOT/deploy/docker-compose.z-blockchain.yml" up -d

echo "Waiting for RPC ${RPC_URL}..."
for _ in $(seq 1 30); do
  if curl -sf -X POST "$RPC_URL" -H "content-type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null; then
    break
  fi
  sleep 2
done

(
  cd "$ROOT"
  npm install
  npm run build --workspace @nova/contracts
  ZBC_RPC_URL="$RPC_URL" \
  ZBC_DEPLOYER_PRIVATE_KEY="$DEPLOYER_KEY" \
  ZBC_EXPECTED_CHAIN_ID="44002" \
  ZBC_NETWORK_NAME="Z Blockchain" \
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
  npm run setup:z-block-chain:preflight --workspace @nova/contracts
  npm run setup:z-block-chain --workspace @nova/contracts
)

echo "Z Blockchain mint complete. Manifest: ${MANIFEST}"
