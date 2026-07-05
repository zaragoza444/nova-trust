#!/usr/bin/env python3
"""Remote clone-token mint on the Nova Trust VPS over SSH."""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vps_ssh_lib import connect_vps, run_remote


def main() -> None:
    branch = os.environ.get("VPS_DEPLOY_BRANCH", "main")
    repo_dir = os.environ.get("VPS_REPO_DIR", "~/nova-trust")
    manifest = os.environ.get(
        "ZBC_BOOTSTRAP_MANIFEST_PATH",
        f"{repo_dir}/contracts/deployments/z-blockchain-production-liquidity.json",
    )
    manifest_docker = "/work/contracts/deployments/z-blockchain-production-liquidity.json"

    remote_script = f"""
set -euo pipefail
cd {repo_dir}
if [ ! -d .git ]; then
  git clone https://github.com/zaragoza444/nova-trust.git .
fi
git fetch origin {branch}
git checkout -B {branch} FETCH_HEAD
git pull origin {branch}
export ZBC_BOOTSTRAP_MANIFEST_PATH={manifest_docker}
bash scripts/mint-clone-tokens-vps.sh
"""

    client = connect_vps()
    try:
        print("Connected to VPS. Syncing repo and minting clone tokens...")
        code, out, _ = run_remote(client, remote_script)
        if code != 0:
            raise SystemExit(code)

        fetch_cmd = f"cat {manifest}"
        code, manifest_body, err = run_remote(client, fetch_cmd)
        if code == 0 and manifest_body.strip():
            local_manifest = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "contracts",
                "deployments",
                "z-blockchain-production-liquidity.json",
            )
            os.makedirs(os.path.dirname(local_manifest), exist_ok=True)
            with open(local_manifest, "w", encoding="utf-8") as handle:
                handle.write(manifest_body)
            parsed = json.loads(manifest_body)
            clone_count = len(parsed.get("cloneTokens", []))
            print(f"Saved production manifest locally ({clone_count} clone tokens recorded).")
        else:
            print("Mint completed but manifest fetch failed:", err.strip())
    finally:
        client.close()


if __name__ == "__main__":
    main()
