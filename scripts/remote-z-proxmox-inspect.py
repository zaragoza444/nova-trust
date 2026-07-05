#!/usr/bin/env python3
"""Remote Proxmox LXC inspection (pct config + HTTP) over SSH."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vps_ssh_lib import connect_vps, run_remote


def main() -> None:
    host = os.environ.get("PROXMOX_SSH_HOST") or os.environ.get("VPS_SSH_HOST")
    user = os.environ.get("PROXMOX_SSH_USER", os.environ.get("VPS_SSH_USER", "root"))
    repo = os.environ.get("Z_LXC_REPO_DIR", "/root/nova-trust")
    branch = os.environ.get("Z_LXC_BRANCH", os.environ.get("VPS_DEPLOY_BRANCH", "main"))

    if not host:
        raise SystemExit(
            "Set PROXMOX_SSH_HOST to your Proxmox node management IP. "
            "Configure PROXMOX_SSH_PRIVATE_KEY or PROXMOX_SSH_PASSWORD."
        )

    os.environ.setdefault("VPS_SSH_HOST", host)
    os.environ.setdefault("VPS_SSH_USER", user)

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
bash scripts/inspect-z-proxmox-lxc.sh
"""

    client = connect_vps()
    try:
        print(f"Inspecting Proxmox LXC 5820–5828 on {user}@{host}...")
        code, out, _ = run_remote(client, remote_script)
        if code != 0:
            raise SystemExit(code)
    finally:
        client.close()


if __name__ == "__main__":
    main()
