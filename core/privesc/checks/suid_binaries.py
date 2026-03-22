import subprocess

DANGEROUS_SUID_BINARIES = [
    "pkexec", "vim", "nmap", "bash", "find",
    "perl", "python", "tar", "cp", "mv",
    "ln", "nc", "netcat", "socat"
]

def check_suid_binaries():
    findings = []

    try:
        result = subprocess.run(
            ["find", "/", "-perm", "-4000", "-type", "f"],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=20
        )
    except Exception:
        return findings

    for path in result.stdout.splitlines():
        name = path.split("/")[-1]

        if name in DANGEROUS_SUID_BINARIES:
            findings.append({
                "type": "SUID_BINARY",
                "binary": name,
                "path": path,
                "risk": "HIGH",
                "impact": "Privilege Escalation",
                "confidence": "HIGH",
                "reason": f"SUID {name} can be abused for root escalation"
            })

    return findings
