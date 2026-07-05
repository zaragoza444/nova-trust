#!/usr/bin/env python3
"""Remote international wiring on the Nova Trust VPS over SSH."""

from __future__ import annotations

import json
import os
import sys
import textwrap

try:
    import paramiko
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko


def connect() -> paramiko.SSHClient:
    host = os.environ.get("VPS_SSH_HOST", "51.75.64.28")
    user = os.environ.get("VPS_SSH_USER", "ubuntu")
    password = os.environ.get("VPS_SSH_PASSWORD")
    key_data = os.environ.get("VPS_SSH_PRIVATE_KEY")
    key_path = os.environ.get("VPS_SSH_KEY_PATH")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    connect_kwargs: dict = {
        "hostname": host,
        "username": user,
        "timeout": 30,
        "allow_agent": True,
        "look_for_keys": True,
    }

    if key_data:
        connect_kwargs["pkey"] = paramiko.RSAKey.from_private_key(textwrap.dedent(key_data).encode())
        connect_kwargs["allow_agent"] = False
        connect_kwargs["look_for_keys"] = False
    elif key_path:
        connect_kwargs["key_filename"] = key_path
    elif password:
        connect_kwargs["password"] = password
        connect_kwargs["allow_agent"] = False
        connect_kwargs["look_for_keys"] = False

    client.connect(**connect_kwargs)
    return client


def run(client: paramiko.SSHClient, command: str) -> tuple[int, str, str]:
    print(f"$ {command}")
    _, stdout, stderr = client.exec_command(command, get_pty=True)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print(err.rstrip(), file=sys.stderr)
    return exit_code, out, err


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

    client = connect()
    try:
        print("Connected to VPS. Wiring internationally...")
        code, out, _ = run(client, remote_script)
        if code != 0:
            raise SystemExit(code)
        if "wired internationally" in out.lower():
            print(out[out.lower().rfind("nova trust wired internationally"):])
    finally:
        client.close()


if __name__ == "__main__":
    main()
