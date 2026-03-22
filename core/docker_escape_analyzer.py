import subprocess
import json

def get_running_containers():
    r = subprocess.run(
        ["docker", "ps", "--format", "{{.Names}}"],
        capture_output=True,
        text=True
    )
    return [c.strip() for c in r.stdout.splitlines() if c.strip()]

def inspect_container(name):
    r = subprocess.run(
        ["docker", "inspect", name],
        capture_output=True,
        text=True
    )
    return json.loads(r.stdout)[0]

def analyze_container_escape():
    findings = []

    for container in get_running_containers():
        data = inspect_container(container)
        host_cfg = data.get("HostConfig", {})
        cfg = data.get("Config", {})

        issues = []

        # 1️⃣ Privileged container
        if host_cfg.get("Privileged"):
            issues.append({
                "type": "PRIVILEGED_CONTAINER",
                "severity": "CRITICAL",
                "reason": "Container runs with --privileged"
            })

        # 2️⃣ Docker socket mount
        for mount in data.get("Mounts", []):
            if mount.get("Source") == "/var/run/docker.sock":
                issues.append({
                    "type": "DOCKER_SOCKET_MOUNT",
                    "severity": "CRITICAL",
                    "reason": "Docker socket gives root access to host"
                })

        # 3️⃣ Host filesystem mounts
        for mount in data.get("Mounts", []):
            src = mount.get("Source", "")
            if src in ["/", "/etc", "/usr", "/boot"]:
                issues.append({
                    "type": "HOST_FS_MOUNT",
                    "severity": "HIGH",
                    "reason": f"Host path mounted: {src}"
                })

        # 4️⃣ Host network mode
        if host_cfg.get("NetworkMode") == "host":
            issues.append({
                "type": "HOST_NETWORK",
                "severity": "HIGH",
                "reason": "Container uses host networking"
            })

        # 5️⃣ Dangerous capabilities
        caps = host_cfg.get("CapAdd") or []
        dangerous_caps = {"SYS_ADMIN", "NET_ADMIN", "SYS_PTRACE"}
        for cap in caps:
            if cap in dangerous_caps:
                issues.append({
                    "type": "DANGEROUS_CAPABILITY",
                    "severity": "HIGH",
                    "reason": f"Capability added: {cap}"
                })

        findings.append({
            "container": container,
            "image": data.get("Config", {}).get("Image"),
            "issues": issues,
            "escape_risk": "CRITICAL" if any(i["severity"] == "CRITICAL" for i in issues)
                           else "HIGH" if issues else "LOW"
        })

    return findings
