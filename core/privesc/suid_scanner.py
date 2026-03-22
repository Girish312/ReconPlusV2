import subprocess

# High-confidence exploitable SUID binaries
DANGEROUS_SUID_BINARIES = {
    "pkexec": "PolicyKit exploit / shell escape",
    "vim": "Shell escape via :!sh",
    "nmap": "Interactive mode shell",
    "bash": "Preserve privileges shell",
    "find": "Command execution via -exec",
    "perl": "Command execution",
    "python": "Shell escape",
    "tar": "Checkpoint action abuse",
    "netcat": "Reverse shell",
    "socat": "TTY / shell abuse"
}

def scan_suid_binaries():
    findings = []

    try:
        result = subprocess.run(
            ["find", "/", "-perm", "-4000", "-type", "f"],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
            text=True,
            timeout=20
        )
    except Exception:
        return findings

    for path in result.stdout.splitlines():
        binary_name = path.split("/")[-1]

        finding = {
            "type": "SUID_BINARY",
            "binary": binary_name,
            "path": path,
            "risk": "LOW",
            "severity": "LOW",
            "exploitability": False,
            "impact": "Privilege Escalation",
            "description": f"SUID binary found: {binary_name}",
            "confidence": "LOW"
        }

        if binary_name in DANGEROUS_SUID_BINARIES:
            finding.update({
                "risk": "CRITICAL",
                "severity": "CRITICAL",
                "exploitability": True,
                "confidence": "HIGH",
                "reason": DANGEROUS_SUID_BINARIES[binary_name]
            })

        findings.append(finding)

    return findings
