#!/usr/bin/env python3
"""Remote Nova Trust go-live on Proxmox dashboard LXC 5825 over SSH."""

from __future__ import annotations

import json
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
export GO_LIVE_USE_DOCKER=true
bash scripts/go-live.sh
curl -sf http://127.0.0.1:4000/api/go-live/status
"""

    print("Connected to Proxmox. Going live on dashboard LXC 5825...")
    code, out, _ = run_in_dashboard(inner_script)
    if code != 0:
        raise SystemExit(code)
    if out.strip():
        try:
            status = json.loads(out.strip().splitlines()[-1])
            print(json.dumps(status, indent=2))
        except json.JSONDecodeError:
            pass


if __name__ == "__main__":
    main()
