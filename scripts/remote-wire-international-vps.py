#!/usr/bin/env python3
"""Remote international wiring on Proxmox dashboard LXC 5825 over SSH."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from proxmox_ssh_lib import lxc_repo_dir, run_in_dashboard


def main() -> None:
    branch = os.environ.get("VPS_DEPLOY_BRANCH", "main")
    repo_dir = lxc_repo_dir()

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
bash scripts/wire-international-vps.sh
"""

    print("Connected to Proxmox. Wiring internationally on dashboard LXC 5825...")
    code, out, _ = run_in_dashboard(inner_script)
    if code != 0:
        raise SystemExit(code)
    if "wired internationally" in out.lower():
        print(out[out.lower().rfind("nova trust wired internationally"):])


if __name__ == "__main__":
    main()
