#!/usr/bin/env python3
"""Inspect pct config + HTTP on all Proxmox nodes (r630-03, r630-04)."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from proxmox_ssh_lib import connect_node, iter_nodes, run_remote


def main() -> None:
    branch = os.environ.get("Z_LXC_BRANCH", os.environ.get("VPS_DEPLOY_BRANCH", "main"))
    repo = os.environ.get("Z_LXC_REPO_DIR", "/opt/nova-trust")
    exit_code = 0

    for node in iter_nodes():
        node_id = node["id"]
        client, host, user = connect_node(node)
        try:
            print(f"\n{'=' * 60}\nInspect {node_id} ({user}@{host})\n{'=' * 60}")
            remote_script = f"""
set -euo pipefail
REPO="{repo}"
if [ -d "$REPO/.git" ]; then
  cd "$REPO"
  git fetch origin {branch} 2>/dev/null || true
  git checkout {branch} 2>/dev/null || true
else
  git clone https://github.com/zaragoza444/nova-trust.git "$REPO"
  cd "$REPO"
  git checkout {branch} 2>/dev/null || true
fi
export PROXMOX_NODE={node_id}
bash scripts/inspect-z-proxmox-lxc.sh --pct-only || true
"""
            code, out, _ = run_remote(client, remote_script)
            if code != 0:
                exit_code = code
        finally:
            client.close()

    node = next(iter_nodes())
    client, host, user = connect_node(node)
    try:
        print(f"\n{'=' * 60}\nHTTP reachability via {user}@{host}\n{'=' * 60}")
        remote_script = f"""
set -euo pipefail
REPO="{repo}"
cd "$REPO"
bash scripts/verify-z-proxmox-lxc.sh
"""
        code, _, _ = run_remote(client, remote_script)
        if code != 0:
            exit_code = code
    finally:
        client.close()

    if exit_code != 0:
        raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
