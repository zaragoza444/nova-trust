#!/usr/bin/env python3
"""Remote oracle price publish on the Nova Trust VPS over SSH."""

from __future__ import annotations

import json
import os
import sys
import textwrap

try:
    import paramiko
except ImportError:
    print("Installing paramiko...")
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
    branch = os.environ.get("VPS_DEPLOY_BRANCH", "cursor/put-oracle-price-4f28")
    repo_dir = os.environ.get("VPS_REPO_DIR", "~/nova-trust")
    manifest = os.environ.get(
        "ZBC_BOOTSTRAP_MANIFEST_PATH",
        f"{repo_dir}/contracts/deployments/z-blockchain-production-liquidity.json",
    )
    manifest_docker = "/work/contracts/deployments/z-blockchain-production-liquidity.json"

    remote_script = f"""
set -euo pipefail
cd {repo_dir}
if [ ! -d .git ]; then
  git clone https://github.com/zaragoza444/nova-trust.git .
fi
git fetch origin {branch}
git checkout -B {branch} FETCH_HEAD
git pull origin {branch}
export ZBC_BOOTSTRAP_MANIFEST_PATH={manifest_docker}
bash scripts/put-oracle-prices-vps.sh
"""

    client = connect()
    try:
        print("Connected to VPS. Syncing repo and publishing oracle prices...")
        code, out, _ = run(client, remote_script)
        if code != 0:
            raise SystemExit(code)

        fetch_cmd = f"cat {manifest}"
        code, manifest_body, err = run(client, fetch_cmd)
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
            feed_count = len(parsed.get("oracle", {}).get("feeds", []))
            oracle_address = parsed.get("contracts", {}).get("priceOracle", {}).get("address")
            print(f"Saved production manifest locally ({feed_count} oracle feeds, oracle={oracle_address}).")
        else:
            print("Oracle publish completed but manifest fetch failed:", err.strip())
    finally:
        client.close()


if __name__ == "__main__":
    main()
