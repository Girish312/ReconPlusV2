import subprocess


def analyze_sudo_rights():
    findings = []

    try:
        result = subprocess.run(
            ["sudo", "-l"],
            capture_output=True,
            text=True,
            timeout=10
        )
    except Exception:
        return findings

    output = result.stdout.lower()

    if "nopasswd" in output:
        findings.append({
            "type": "SUDO_MISCONFIG",
            "risk": "CRITICAL",
            "reason": "NOPASSWD sudo rules detected"
        })

    if "all" in output:
        findings.append({
            "type": "SUDO_FULL_ACCESS",
            "risk": "CRITICAL",
            "reason": "User may run all commands as root"
        })

    return findings
