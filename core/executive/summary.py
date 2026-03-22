def generate_executive_summary(recon_data):
    score = recon_data.get("overall_numeric_score", 0)
    probability = recon_data.get("compromise_probability_percent", 0)

    critical = recon_data.get("risk_summary", {}).get("CRITICAL", 0)
    high = recon_data.get("risk_summary", {}).get("HIGH", 0)

    if score >= 9:
        severity = "very high"
    elif score >= 7:
        severity = "high"
    elif score >= 5:
        severity = "moderate"
    else:
        severity = "low"

    if critical > 0:
        recommendation_line = (
            "Immediate remediation of critical findings is strongly recommended."
        )
    elif high > 0:
        recommendation_line = (
            "High-risk issues should be prioritized for remediation in the next cycle."
        )
    else:
        recommendation_line = (
            "Focus on resolving medium and low-risk findings to reduce future exposure."
        )

    summary = (
        f"This system currently presents a {severity} security risk. "
        f"The overall security score is {score}/10, indicating a {probability}% "
        f"modeled likelihood of compromise if exploited. "
        f"There are {critical} critical and {high} high-risk findings identified. "
        f"If left unaddressed, attackers could potentially gain elevated access "
        f"to the system. {recommendation_line}"
    )

    return summary