#!/usr/bin/env python3
"""Remote Z Ecosystem go-live on the VPS over SSH."""

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


def require_env(name: str, default: str | None = None) -> str:
    value = os.environ.get(name, default)
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def connect() -> paramiko.SSHClient:
    host = require_env("VPS_SSH_HOST", "51.75.64.28")
    user = require_env("VPS_SSH_USER", "ubuntu")
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
        key_file = paramiko.RSAKey.from_private_key(textwrap.dedent(key_data).encode())
        connect_kwargs["pkey"] = key_file
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
    use_wire = os.environ.get("Z_VPS_USE_WIRE", "true").lower() in {"1", "true", "yes"}

    deploy_script = "scripts/wire-z-vps.sh" if use_wire else "scripts/z-go-live.sh"

    remote_script = f"""
set -euo pipefail
cd {repo_dir}
if [ ! -d .git ]; then
  git clone https://github.com/zaragoza444/nova-trust.git .
fi
git fetch origin {branch}
git checkout -B {branch} FETCH_HEAD
git pull origin {branch}
export GO_LIVE_USE_DOCKER=true
bash {deploy_script}
curl -sf -H "x-z-role: AUDITOR" http://127.0.0.1:4100/api/go-live/status
"""

    client = connect()
    try:
        print("Connected to VPS. Deploying Z Ecosystem...")
        code, out, _ = run(client, remote_script)
        if code != 0:
            raise SystemExit(code)
        if out.strip():
            try:
                status = json.loads(out.strip().splitlines()[-1])
                print(json.dumps(status, indent=2))
            except json.JSONDecodeError:
                pass
        marker = "Z Ecosystem wired for public VPS access"
        if marker in out:
            print(out[out.rfind(marker):])
    finally:
        client.close()


if __name__ == "__main__":
    main()
