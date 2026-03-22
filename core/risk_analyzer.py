def analyze_risk(services):
   
    summary = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
        "UNKNOWN": 0
    }

    for svc in services:
        risk = svc.get("adjusted_risk") or svc.get("risk", "UNKNOWN")

        if risk not in summary:
            risk = "UNKNOWN"

        summary[risk] += 1

    return summary
