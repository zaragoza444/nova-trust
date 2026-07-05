#!/usr/bin/env bash
set -euo pipefail

# Verify HTTP reachability of Z Ecosystem on Proxmox LXC VMIDs 5820–5828.
# Usage:
#   bash scripts/verify-z-proxmox-lxc.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REGISTRY="$ROOT/config/integrations/z-proxmox-lxc.v1.json"

python3 - "$REGISTRY" <<'PY'
import json, sys, urllib.request

registry = json.load(open(sys.argv[1]))
failures = []

def check(label, url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            ok = 200 <= resp.status < 400
            print(f"  {'OK' if ok else 'FAIL'}  {label:40}  {url}  ({resp.status})")
            if not ok:
                failures.append(label)
    except Exception as error:
        print(f"  FAIL  {label:40}  {url}  ({error})")
        failures.append(label)

print("Z Proxmox LXC reachability\n")

hub = registry["routing"]["hubApi"]
check("Hub health", f"{hub}/health")
check("Hub go-live", f"{hub}/api/go-live/status", {"x-z-role": "AUDITOR"})

for item in sorted(registry["containers"], key=lambda x: x["vmid"]):
    ip = item["ip"]
    path = item.get("primaryPath", "/")
    name = f"VMID {item['vmid']} {item['name']}"
    if item["role"] == "portal" or item["vmid"] == 5824:
        check(f"{name} portal", f"http://{ip}{path}")
        check(f"{name} api", f"http://{ip}/health")
    elif item["role"] == "dashboard":
        check(f"{name} dashboard", f"http://{ip}:3100{path}")

print("")
if failures:
    print(f"{len(failures)} check(s) failed")
    sys.exit(1)
print("All checks passed")
PY
