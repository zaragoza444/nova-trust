#!/usr/bin/env bash
set -euo pipefail

# Verify HTTP reachability of Z Ecosystem on Proxmox LXC VMIDs 5820–5828.
# Usage:
#   bash scripts/verify-z-proxmox-lxc.sh
#   Z_LXC_HTTP_TIMEOUT=15 bash scripts/verify-z-proxmox-lxc.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REGISTRY="$ROOT/config/integrations/z-proxmox-lxc.v1.json"
TIMEOUT="${Z_LXC_HTTP_TIMEOUT:-8}"

python3 - "$REGISTRY" "$TIMEOUT" <<'PY'
import json, sys, urllib.error, urllib.request

registry = json.load(open(sys.argv[1]))
timeout = float(sys.argv[2])
failures = []
warnings = []

def check(label, url, headers=None, required=True):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            ok = 200 <= resp.status < 400
            status = f"({resp.status})"
            if ok:
                print(f"  OK    {label:42}  {url}  {status}")
            else:
                print(f"  FAIL  {label:42}  {url}  {status}")
                (failures if required else warnings).append(label)
    except urllib.error.HTTPError as error:
        print(f"  FAIL  {label:42}  {url}  (HTTP {error.code})")
        (failures if required else warnings).append(label)
    except Exception as error:
        print(f"  FAIL  {label:42}  {url}  ({error})")
        (failures if required else warnings).append(label)

print("Z Proxmox LXC HTTP reachability\n")

hub = registry["routing"]["hubApi"]
dashboard = registry["routing"]["dashboard"]

check("Hub /health", f"{hub}/health")
check("Hub /api/go-live/status", f"{hub}/api/go-live/status", {"x-z-role": "AUDITOR"})
check("Hub /api/zbot/status", f"{hub}/api/zbot/status", {"x-z-role": "AUDITOR"}, required=False)

for item in sorted(registry["containers"], key=lambda x: x["vmid"]):
    ip = item["ip"]
    path = item.get("primaryPath", "/")
    vmid = item["vmid"]
    name = item["name"]
    role = item["role"]
    label_prefix = f"VMID {vmid} {name}"

    if role == "hub":
        check(f"{label_prefix} portal /health", f"http://{ip}/health", required=False)
        check(f"{label_prefix} portal {path}", f"http://{ip}{path}", required=False)
        check(f"{label_prefix} api :4100/health", f"{hub}/health")
    elif role == "dashboard":
        check(f"{label_prefix} :3100{path}", f"http://{ip}:3100{path}")
        check(f"{label_prefix} :3100/ (root)", f"http://{ip}:3100/", required=False)
    elif role == "portal":
        check(f"{label_prefix} portal {path}", f"http://{ip}{path}")
        check(f"{label_prefix} /health via nginx", f"http://{ip}/health")
        check(f"{label_prefix} /api/go-live via nginx", f"http://{ip}/api/go-live/status", {"x-z-role": "AUDITOR"}, required=False)

print("")
if warnings:
    print(f"{len(warnings)} optional check(s) failed (hub portal nginx may not be wired yet)")
if failures:
    print(f"{len(failures)} required check(s) failed")
    sys.exit(1)
print("All required HTTP checks passed")
PY
