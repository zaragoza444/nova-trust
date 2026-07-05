#!/usr/bin/env python3
"""Remote clone-token mint on Proxmox hub LXC 5824 over SSH."""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from proxmox_ssh_lib import lxc_repo_dir, run_in_hub


def main() -> None:
    branch = os.environ.get("VPS_DEPLOY_BRANCH", "main")
    repo_dir = lxc_repo_dir()
    manifest = os.environ.get(
        "ZBC_BOOTSTRAP_MANIFEST_PATH",
        f"{repo_dir}/contracts/deployments/z-blockchain-production-liquidity.json",
    )
    manifest_docker = "/work/contracts/deployments/z-blockchain-production-liquidity.json"

    inner_script = f"""
set -euo pipefail
REPO="{repo_dir}"
if [ ! -d "$REPO/.git" ]; then
  mkdir -p "$REPO"
  git clone https://github.com/zaragoza444/nova-trust.git "$REPO"
fi
cd "$REPO"
git fetch origin {branch}
git checkout -B {branch} FETCH_HEAD
export ZBC_BOOTSTRAP_MANIFEST_PATH={manifest_docker}
bash scripts/mint-clone-tokens-vps.sh
"""

    print("Connected to Proxmox. Syncing repo and minting clone tokens on hub LXC 5824...")
    code, out, _ = run_in_hub(inner_script)
    if code != 0:
        raise SystemExit(code)

    fetch_script = f"cat {manifest}"
    code, manifest_body, err = run_in_hub(fetch_script)
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


if __name__ == "__main__":
    main()
