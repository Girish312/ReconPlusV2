import os

CRON_LOCATIONS = [
    "/etc/crontab",
    "/etc/cron.d",
    "/etc/cron.daily",
    "/etc/cron.hourly"
]

def check_cron_jobs():
    findings = []

    for location in CRON_LOCATIONS:
        try:
            if os.path.exists(location) and os.access(location, os.W_OK):
                findings.append({
                    "type": "WRITABLE_CRON_JOB",
                    "path": location,
                    "risk": "HIGH",
                    "impact": "Privilege Escalation",
                    "confidence": "MEDIUM",
                    "reason": "Writable cron job location may allow command injection"
                })
        except Exception:
            continue

    return findings
