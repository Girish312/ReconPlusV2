import os
import stat

DANGEROUS_ENV_VARS = [
    "LD_PRELOAD",
    "LD_LIBRARY_PATH",
    "PYTHONPATH"
]

def check_env_hijacking():
    findings = []

    # ---------- PATH hijacking ----------
    path = os.environ.get("PATH", "")
    path_dirs = path.split(":")

    for directory in path_dirs:
        if not directory:
            continue

        try:
            if os.path.exists(directory):
                st = os.stat(directory)

                # World-writable directory in PATH
                if st.st_mode & stat.S_IWOTH:
                    findings.append({
                        "type": "PATH_HIJACK",
                        "path": directory,
                        "risk": "HIGH",
                        "impact": "Privilege Escalation",
                        "confidence": "HIGH",
                        "reason": "World-writable directory present in PATH"
                    })

                # User-writable directory in PATH
                elif os.access(directory, os.W_OK):
                    findings.append({
                        "type": "PATH_HIJACK",
                        "path": directory,
                        "risk": "MEDIUM",
                        "impact": "Privilege Escalation",
                        "confidence": "MEDIUM",
                        "reason": "Writable directory present in PATH"
                    })
        except Exception:
            continue

    # ---------- Dangerous environment variables ----------
    for var in DANGEROUS_ENV_VARS:
        value = os.environ.get(var)
        if value:
            findings.append({
                "type": "ENV_VARIABLE_HIJACK",
                "variable": var,
                "value": value,
                "risk": "HIGH",
                "impact": "Privilege Escalation",
                "confidence": "MEDIUM",
                "reason": f"{var} is set and may allow shared library injection"
            })

    return findings
