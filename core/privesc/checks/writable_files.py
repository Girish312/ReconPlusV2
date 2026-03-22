import os

SENSITIVE_PATHS = [
    "/etc/passwd",
    "/etc/shadow",
    "/etc/sudoers",
    "/etc/crontab"
]

def check_writable_files():
    findings = []

    for path in SENSITIVE_PATHS:
        try:
            if os.path.exists(path) and os.access(path, os.W_OK):
                findings.append({
                    "type": "WRITABLE_SENSITIVE_FILE",
                    "path": path,
                    "risk": "CRITICAL",
                    "impact": "Privilege Escalation",
                    "confidence": "HIGH",
                    "reason": f"{path} is writable by current user"
                })
        except Exception:
            continue

    return findings
