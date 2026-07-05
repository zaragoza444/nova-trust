#!/usr/bin/env python3
"""SSH helpers for multi-node Proxmox Z Ecosystem deploy."""

from __future__ import annotations

import json
import os
import shlex
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vps_ssh_lib import env, load_private_key, require_vps_auth, run_remote

REPO_ROOT = Path(__file__).resolve().parents[1]
NODES_REGISTRY = REPO_ROOT / "config" / "integrations" / "z-proxmox-nodes.v1.json"
LXC_REGISTRY = REPO_ROOT / "config" / "integrations" / "z-proxmox-lxc.v1.json"


def load_nodes_registry() -> dict:
    return json.loads(NODES_REGISTRY.read_text(encoding="utf-8"))


def load_lxc_registry() -> dict:
    return json.loads(LXC_REGISTRY.read_text(encoding="utf-8"))


def node_host(node: dict) -> str:
    primary = env(node["managementHostEnv"])
    if primary:
        return primary
    fallback = env(node.get("fallbackHostEnv", "PROXMOX_SSH_HOST"))
    if fallback:
        return fallback
    raise SystemExit(
        f"Missing Proxmox host for {node['id']}. Set {node['managementHostEnv']} "
        f"or {node.get('fallbackHostEnv', 'PROXMOX_SSH_HOST')}."
    )


def connect_node(node: dict):
    require_vps_auth()
    host = node_host(node)
    user = env("PROXMOX_SSH_USER", env("VPS_SSH_USER", node.get("defaultSshUser", "root"))) or "root"
    password = env("PROXMOX_SSH_PASSWORD") or env("VPS_SSH_PASSWORD")
    key_data = env("PROXMOX_SSH_PRIVATE_KEY") or env("VPS_SSH_PRIVATE_KEY")
    key_path = env("PROXMOX_SSH_KEY_PATH") or env("VPS_SSH_KEY_PATH")

    import paramiko

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

    client.connect(**connect_kwargs)
    return client, host, user


def vmids_for_node(node_id: str) -> list[int]:
    registry = load_lxc_registry()
    return sorted(item["vmid"] for item in registry["containers"] if item.get("host") == node_id)


DEFAULT_LXC_REPO = "/opt/nova-trust"
HUB_VMID = 5824
HUB_NODE_ID = "r630-04"
DASHBOARD_VMID = 5825
DASHBOARD_NODE_ID = "r630-03"


def node_by_id(node_id: str) -> dict:
    for node in load_nodes_registry()["nodes"]:
        if node["id"] == node_id:
            return node
    raise SystemExit(f"Unknown Proxmox node: {node_id}")


def lxc_repo_dir() -> str:
    return env("Z_LXC_REPO_DIR", env("VPS_REPO_DIR", DEFAULT_LXC_REPO)) or DEFAULT_LXC_REPO


def run_in_lxc(node_id: str, vmid: int, inner_script: str) -> tuple[int, str, str]:
    node = node_by_id(node_id)
    client, _, _ = connect_node(node)
    try:
        command = f"pct exec {vmid} -- bash -lc {shlex.quote(inner_script)}"
        return run_remote(client, command)
    finally:
        client.close()


def run_in_hub(inner_script: str) -> tuple[int, str, str]:
    return run_in_lxc(HUB_NODE_ID, HUB_VMID, inner_script)


def run_in_dashboard(inner_script: str) -> tuple[int, str, str]:
    return run_in_lxc(DASHBOARD_NODE_ID, DASHBOARD_VMID, inner_script)


def iter_nodes():
    registry = load_nodes_registry()
    filter_node = env("PROXMOX_NODE")
    for node in registry["nodes"]:
        if filter_node and node["id"] != filter_node:
            continue
        yield node
