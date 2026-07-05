#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${Z_PRODUCTION_ENV_FILE:-$ROOT/deploy/.env.z-production}"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

export Z_API_URL="${Z_API_URL:-http://127.0.0.1:4100}"
export Z_BOT_INTERVAL_SECONDS="${Z_BOT_INTERVAL_SECONDS:-60}"
export Z_BOT_AUTO_START="${Z_BOT_AUTO_START:-true}"
export Z_BOT_ROLE="${Z_BOT_ROLE:-TREASURY_OPERATOR}"

echo "==> Starting Z Bot international trading worker"
npm run build --workspace @z/bot
node "$ROOT/services/z-bot/dist/runner.js"
