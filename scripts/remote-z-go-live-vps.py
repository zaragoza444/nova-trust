#!/usr/bin/env python3
"""Remote Z Ecosystem go-live on the VPS over SSH."""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vps_ssh_lib import connect_vps, run_remote


def main() -> None:
    branch = os.environ.get("VPS_DEPLOY_BRANCH", "main")
    repo_dir = os.environ.get("VPS_REPO_DIR", "~/nova-trust")
    use_wire = os.environ.get("Z_VPS_USE_WIRE", "true").lower() in {"1", "true", "yes"}

    deploy_script = "scripts/wire-z-vps.sh" if use_wire else "scripts/z-go-live.sh"

    remote_script = f"""
set -euo pipefail
cd {repo_dir}
if [ ! -d .git ]; then
  git clone https://github.com/zaragoza444/nova-trust.git .
fi
git fetch origin {branch}
git checkout -B {branch} FETCH_HEAD
git pull origin {branch}
export GO_LIVE_USE_DOCKER=true
bash {deploy_script}
docker compose -f deploy/docker-compose.z-production.yml up -d --build z-bot 2>/dev/null || true
curl -sf -H "x-z-role: AUDITOR" http://127.0.0.1:4100/api/go-live/status
"""

    client = connect_vps()
    try:
        print("Connected to VPS. Deploying Z Ecosystem...")
        code, out, _ = run_remote(client, remote_script)
        if code != 0:
            raise SystemExit(code)
        if out.strip():
            try:
                status = json.loads(out.strip().splitlines()[-1])
                print(json.dumps(status, indent=2))
            except json.JSONDecodeError:
                pass
        marker = "Z Ecosystem wired for public VPS access"
        if marker in out:
            print(out[out.rfind(marker):])
    finally:
        client.close()


if __name__ == "__main__":
    main()
