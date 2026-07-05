#!/usr/bin/env python3
"""Remote oracle price publish on the Nova Trust VPS over SSH."""

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
bash scripts/put-oracle-prices-vps.sh
"""

    client = connect_vps()
    try:
        print("Connected to VPS. Syncing repo and publishing oracle prices...")
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
            feed_count = len(parsed.get("oracle", {}).get("feeds", []))
            oracle_address = parsed.get("contracts", {}).get("priceOracle", {}).get("address")
            print(f"Saved production manifest locally ({feed_count} oracle feeds, oracle={oracle_address}).")
        else:
            print("Oracle publish completed but manifest fetch failed:", err.strip())
    finally:
        client.close()


if __name__ == "__main__":
    main()
