RISK_BASE_SCORES = {
    "LOW": 3.0,
    "MEDIUM": 5.0,
    "HIGH": 7.5,
    "CRITICAL": 9.0,
    "CRITICAL_CHAINED": 9.8
}


def calculate_service_score(service):
    base = RISK_BASE_SCORES.get(service.get("base_risk"), 1.0)

    # Small boost if externally confirmed
    if service.get("exposure", {}).get("level") == "EXTERNAL_CONFIRMED":
        base += 0.3

    # Cap at 10
    return min(round(base, 1), 10.0)


def score_services(services):
    for svc in services:
        svc["numeric_score"] = calculate_service_score(svc)
        svc["risk_label"] = risk_label_from_score(svc["numeric_score"])
    return services


def calculate_web_vulnerability_score(web_vulnerabilities):
    if not web_vulnerabilities:
        return 0.0

    severity_scores = {
        "LOW": 3.0,
        "MEDIUM": 5.5,
        "HIGH": 8.0,
        "CRITICAL": 9.5
    }

    scores = [
        severity_scores.get(vuln.get("severity", "LOW"), 3.0)
        for vuln in web_vulnerabilities
    ]

    highest = max(scores)
    avg = sum(scores) / len(scores)

    # Prioritize highest-impact finding while preserving overall distribution.
    return round((highest * 0.65) + (avg * 0.35), 2)


def calculate_overall_risk(services, web_vulnerabilities=None):
    service_score = 0.0
    web_score = calculate_web_vulnerability_score(web_vulnerabilities or [])

    if services:
        highest = max(svc.get("numeric_score", 0) for svc in services)
        avg = sum(svc.get("numeric_score", 0) for svc in services) / len(services)

        # Blend highest impact + overall exposure for host/service posture.
        service_score = round((highest * 0.6) + (avg * 0.4), 2)

    if service_score == 0 and web_score == 0:
        return 0.0

    if service_score == 0:
        return min(web_score, 10.0)

    if web_score == 0:
        return min(service_score, 10.0)

    # Blend infrastructure and web posture when both are present.
    return min(round((service_score * 0.55) + (web_score * 0.45), 2), 10.0)


def compromise_probability(score):
    """
    Convert 0-10 score into % probability model.
    """
    return round((score / 10) * 100, 1)

def risk_label_from_score(score):
    if score >= 9:
        return "CRITICAL"
    elif score >= 7:
        return "HIGH"
    elif score >= 4:
        return "MEDIUM"
    elif score > 0:
        return "LOW"
    return "INFO"