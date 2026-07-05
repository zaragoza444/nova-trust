#!/usr/bin/env python3
"""Deploy Z Ecosystem across r630-03 and r630-04 Proxmox nodes over SSH."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from proxmox_ssh_lib import connect_node, iter_nodes, run_remote


def main() -> None:
    branch = os.environ.get("Z_LXC_BRANCH", os.environ.get("VPS_DEPLOY_BRANCH", "main"))
    repo = os.environ.get("Z_LXC_REPO_DIR", "/opt/nova-trust")

    for node in iter_nodes():
        node_id = node["id"]
        client, host, user = connect_node(node)
        try:
            print(f"\n{'=' * 60}\nDeploying on {node_id} ({user}@{host})\n{'=' * 60}")
            remote_script = f"""
set -euo pipefail
REPO="{repo}"
if [ ! -d "$REPO/.git" ]; then
  mkdir -p "$REPO"
  git clone https://github.com/zaragoza444/nova-trust.git "$REPO"
fi
cd "$REPO"
git fetch origin {branch}
git checkout -B {branch} FETCH_HEAD
export Z_LXC_BRANCH={branch}
export Z_LXC_REPO_DIR="$REPO"
export PROXMOX_NODE={node_id}
bash scripts/deploy-z-proxmox-lxc.sh
"""
            code, out, _ = run_remote(client, remote_script)
            if code != 0:
                raise SystemExit(code)
            marker = "Z Ecosystem endpoints:"
            if marker in out:
                print(out[out.rfind(marker):])
        finally:
            client.close()


if __name__ == "__main__":
    main()
