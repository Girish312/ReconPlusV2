import json
import uuid
from datetime import datetime



def generate_report(domain, findings):

    report = {}

    report["metadata"] = {
        "scan_id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "scanner_version": "ReconGuard v0.1"
    }

    report["target"] = {
        "domain": domain
    }

    report["findings"] = findings

    severity_count = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0
    }

    for f in findings:
        sev = f.get("severity", "LOW")
        if sev in severity_count:
            severity_count[sev] += 1

    report["risk_summary"] = severity_count

    report["recommendations"] = generate_recommendations(findings)

    report["executive_summary"] = generate_summary(severity_count)

    return report


def generate_summary(summary):

    critical = summary.get("CRITICAL", 0)
    high = summary.get("HIGH", 0)

    if critical > 0:
        return (
            "This target presents a critical security risk. "
            "Immediate remediation is strongly recommended."
        )

    if high > 0:
        return (
            "High severity vulnerabilities were identified. "
            "Timely remediation is recommended."
        )

    return "No critical vulnerabilities were discovered during this scan."


def save_report(report, filename="reconguard_report.json"):

    with open(filename, "w") as f:
        json.dump(report, f, indent=4)

    print(f"[ReconGuard] Report saved to {filename}")