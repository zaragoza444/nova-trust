#!/usr/bin/env python3
"""Remote international wiring on the Nova Trust VPS over SSH."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vps_ssh_lib import connect_vps, run_remote


def main() -> None:
    branch = os.environ.get("VPS_DEPLOY_BRANCH", "main")
    repo_dir = os.environ.get("VPS_REPO_DIR", "~/nova-trust")
    remote_script = f"""
set -euo pipefail
cd {repo_dir}
if [ ! -d .git ]; then
  git clone https://github.com/zaragoza444/nova-trust.git .
fi
git fetch origin {branch}
git checkout -B {branch} FETCH_HEAD
git pull origin {branch}
bash scripts/wire-international-vps.sh
"""

    client = connect_vps()
    try:
        print("Connected to VPS. Wiring internationally...")
        code, out, _ = run_remote(client, remote_script)
        if code != 0:
            raise SystemExit(code)
        if "wired internationally" in out.lower():
            print(out[out.lower().rfind("nova trust wired internationally"):])
    finally:
        client.close()


if __name__ == "__main__":
    main()
