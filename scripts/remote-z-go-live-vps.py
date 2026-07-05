#!/usr/bin/env python3
"""Remote Z Ecosystem go-live on Proxmox LXC (VMIDs 5820–5828)."""

from __future__ import annotations

import importlib.util
from pathlib import Path


def main() -> None:
    deploy_path = Path(__file__).resolve().parent / "remote-z-proxmox-deploy.py"
    spec = importlib.util.spec_from_file_location("remote_z_proxmox_deploy", deploy_path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Unable to load {deploy_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.main()


if __name__ == "__main__":
    main()
