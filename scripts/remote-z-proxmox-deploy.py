#!/usr/bin/env python3
"""Deploy Z Ecosystem to Proxmox LXC containers 5820–5828 over SSH."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vps_ssh_lib import connect_vps, run_remote


def main() -> None:
    host = os.environ.get("PROXMOX_SSH_HOST") or os.environ.get("VPS_SSH_HOST")
    user = os.environ.get("PROXMOX_SSH_USER", os.environ.get("VPS_SSH_USER", "root"))
    branch = os.environ.get("Z_LXC_BRANCH", os.environ.get("VPS_DEPLOY_BRANCH", "main"))

    if not host:
        raise SystemExit(
            "Set PROXMOX_SSH_HOST to your Proxmox node (e.g. r630-04 management IP). "
            "Also configure PROXMOX_SSH_PRIVATE_KEY or PROXMOX_SSH_PASSWORD."
        )

    os.environ.setdefault("VPS_SSH_HOST", host)
    os.environ.setdefault("VPS_SSH_USER", user)

    remote_script = f"""
set -euo pipefail
REPO="${{Z_LXC_REPO_DIR:-/root/nova-trust}}"
if [ ! -d "$REPO/.git" ]; then
  git clone https://github.com/zaragoza444/nova-trust.git "$REPO"
fi
cd "$REPO"
git fetch origin {branch}
git checkout -B {branch} FETCH_HEAD
export Z_LXC_BRANCH={branch}
bash scripts/deploy-z-proxmox-lxc.sh
"""

    client = connect_vps()
    try:
        print(f"Connected to Proxmox host {user}@{host}. Deploying Z Ecosystem to LXC 5820–5828...")
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
