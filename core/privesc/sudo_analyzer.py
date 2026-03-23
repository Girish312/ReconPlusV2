import subprocess


def analyze_sudo_rights():
    findings = []

    try:
        result = subprocess.run(
            ["sudo", "-n", "-l"],
            capture_output=True,
            text=True,
            timeout=10,
            stdin=subprocess.DEVNULL,
        )
    except Exception:
        return findings

    # If sudo requires a password, skip this check without blocking the pipeline.
    if result.returncode != 0:
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
