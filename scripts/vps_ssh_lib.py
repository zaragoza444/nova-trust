#!/usr/bin/env python3
"""Shared SSH helpers for Nova Trust / Z Ecosystem VPS remote scripts."""

from __future__ import annotations

import os
import sys
import textwrap

try:
    import paramiko
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko


DEFAULT_VPS_HOST = "51.75.64.28"
DEFAULT_VPS_USER = "ubuntu"


def env(name: str, default: str | None = None) -> str | None:
    value = os.environ.get(name)
    if value is None or value.strip() == "":
        return default
    return value.strip()


def require_vps_auth() -> None:
    password = env("VPS_SSH_PASSWORD")
    key_data = env("VPS_SSH_PRIVATE_KEY")
    key_path = env("VPS_SSH_KEY_PATH")
    if password or key_data or key_path:
        return
    raise SystemExit(
        "Missing VPS SSH credentials. Configure GitHub secrets "
        "VPS_SSH_PRIVATE_KEY or VPS_SSH_PASSWORD (and optionally VPS_SSH_HOST, VPS_SSH_USER)."
    )


def load_private_key(key_data: str) -> paramiko.PKey:
    normalized = textwrap.dedent(key_data).encode()
    loaders = (
        paramiko.RSAKey.from_private_key,
        paramiko.ECDSAKey.from_private_key,
        paramiko.Ed25519Key.from_private_key,
    )
    last_error: Exception | None = None
    for loader in loaders:
        try:
            return loader(normalized)
        except Exception as error:  # noqa: BLE001 - try all supported key types
            last_error = error
    raise SystemExit(f"Unable to parse VPS_SSH_PRIVATE_KEY: {last_error}")


def connect_vps() -> paramiko.SSHClient:
    require_vps_auth()

    host = env("VPS_SSH_HOST", DEFAULT_VPS_HOST) or DEFAULT_VPS_HOST
    user = env("VPS_SSH_USER", DEFAULT_VPS_USER) or DEFAULT_VPS_USER
    password = env("VPS_SSH_PASSWORD")
    key_data = env("VPS_SSH_PRIVATE_KEY")
    key_path = env("VPS_SSH_KEY_PATH")

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
        connect_kwargs["pkey"] = load_private_key(key_data)
        connect_kwargs["allow_agent"] = False
        connect_kwargs["look_for_keys"] = False
    elif key_path:
        connect_kwargs["key_filename"] = key_path
    elif password:
        connect_kwargs["password"] = password
        connect_kwargs["allow_agent"] = False
        connect_kwargs["look_for_keys"] = False

    try:
        client.connect(**connect_kwargs)
    except Exception as error:  # noqa: BLE001 - surface actionable deploy failure
        raise SystemExit(f"SSH connection to {user}@{host} failed: {error}") from error

    return client


def run_remote(client: paramiko.SSHClient, command: str) -> tuple[int, str, str]:
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
