import subprocess


def check_docker_group_abuse():
    findings = []

    try:
        groups = subprocess.run(
            ["groups"],
            capture_output=True,
            text=True
        ).stdout
    except Exception:
        return findings

    if "docker" in groups:
        findings.append({
            "type": "DOCKER_GROUP_ABUSE",
            "risk": "CRITICAL",
            "reason": "User is in docker group → root access possible"
        })

    return findings
