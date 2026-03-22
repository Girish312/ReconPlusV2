import os

CRITICAL_PATHS = [
    "/etc/passwd",
    "/etc/shadow",
    "/etc/sudoers"
]


def check_writable_critical_paths():
    findings = []

    for path in CRITICAL_PATHS:
        try:
            if os.access(path, os.W_OK):
                findings.append({
                    "type": "WRITABLE_SYSTEM_FILE",
                    "path": path,
                    "risk": "CRITICAL",
                    "reason": "Critical system file is writable"
                })
        except Exception:
            continue

    return findings
