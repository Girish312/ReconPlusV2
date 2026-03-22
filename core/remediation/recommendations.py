def generate_recommendations(services, privesc_findings, vulnerabilities):

    recommendations = []
    seen = set()

    # SERVICE-SPECIFIC ACTIONS
    service_actions = {
        "Redis": "Bind Redis to localhost, enable authentication, and disable external access.",
        "PostgreSQL": "Restrict PostgreSQL access to trusted IPs and enforce strong authentication.",
        "DNS": "Restrict DNS recursion and limit queries to internal networks.",
        "MongoDB": "Enable authentication and restrict network exposure.",
        "MySQL": "Disable remote root login and restrict database access using firewall rules.",
        "FTP": "Disable anonymous login and enforce secure FTP (SFTP).",
        "SSH": "Disable root login and enforce key-based authentication.",
        "SMB": "Disable SMBv1 and restrict SMB access to internal networks."
    }

    # SERVICE EXPOSURE
    for svc in services:

        service = svc.get("service", "UNKNOWN")
        port = svc.get("port")

        # Only flag high risk services
        if svc.get("numeric_score", 0) >= 7:

            issue = f"{service} exposed on port {port}"

            action = service_actions.get(
                service,
                "Restrict public exposure using firewall rules or disable if not required."
            )

            key = (issue, action)

            if key not in seen:
                seen.add(key)

                recommendations.append({
                    "priority": "IMMEDIATE",
                    "issue": issue,
                    "action": action
                })

    # PRIVILEGE ESCALATION
    for finding in privesc_findings:

        if finding.get("type") == "SUDO_FULL_ACCESS":

            issue = "Unrestricted sudo access"
            action = "Restrict sudo permissions using least privilege principle."

        elif finding.get("type") == "DOCKER_GROUP_ABUSE":

            issue = "User in docker group"
            action = "Remove user from docker group or enforce rootless containers."

        elif finding.get("type") == "PATH_HIJACK":

            issue = "Writable directory in PATH"
            action = "Remove write permissions or reorder PATH to prevent hijacking."

        else:
            continue

        key = (issue, action)

        if key not in seen:
            seen.add(key)

            recommendations.append({
                "priority": "HIGH",
                "issue": issue,
                "action": action
            })

    # WEB VULNERABILITIES
    for vuln in vulnerabilities:

        severity = vuln.get("severity", "LOW")

        priority_map = {
            "CRITICAL": "IMMEDIATE",
            "HIGH": "IMMEDIATE",
            "MEDIUM": "MEDIUM",
        }

        recommendation_priority = priority_map.get(severity)

        if recommendation_priority:

            issue = f"{vuln.get('vulnerability')} on {vuln.get('host')}"
            action = vuln.get("remedy", "Apply appropriate security patch.")

            key = (issue, action)

            if key not in seen:
                seen.add(key)

                recommendations.append({
                    "priority": recommendation_priority,
                    "issue": issue,
                    "action": action
                })

    return recommendations