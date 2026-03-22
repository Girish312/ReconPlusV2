def build_attack_chains(services, privesc_findings):
    chains = []

    # Identify external entry points
    external_services = [
        s for s in services
        if s.get("exposure", {}).get("level") in ["EXTERNAL_CONFIRMED", "EXTERNAL_POTENTIAL"]
    ]

    has_docker_privesc = any(
        f["type"] == "DOCKER_GROUP_ABUSE" for f in privesc_findings
    )

    has_sudo_privesc = any(
        f["type"] == "SUDO_FULL_ACCESS" for f in privesc_findings
    )

    for svc in external_services:
        chain = {
            "entry_service": svc["service"],
            "port": svc["port"],
            "exposure": svc["exposure"]["level"],
            "base_risk": svc["base_risk"],
            "attack_steps": [],
            "final_impact": None,
            "confidence": "MEDIUM"
        }

        chain["attack_steps"].append(
            f"Exploit exposed {svc['service']} service on port {svc['port']}"
        )

        if has_docker_privesc:
            chain["attack_steps"].append(
                "Abuse docker group membership to escape container"
            )
            chain["final_impact"] = "ROOT_COMPROMISE"
            chain["confidence"] = "HIGH"

        elif has_sudo_privesc:
            chain["attack_steps"].append(
                "Leverage unrestricted sudo access"
            )
            chain["final_impact"] = "ROOT_COMPROMISE"
            chain["confidence"] = "HIGH"

        else:
            chain["final_impact"] = "LIMITED_COMPROMISE"

        chains.append(chain)

    return chains
