def escalate_service_risk(services, attack_chains):
    escalated_services = []

    # Identify high-confidence root chains
    high_risk_services = {
        (chain["entry_service"], chain["port"])
        for chain in attack_chains
        if chain.get("final_impact") == "ROOT_COMPROMISE"
        and chain.get("confidence") == "HIGH"
    }

    for svc in services:
        key = (svc["service"], svc["port"])

        if key in high_risk_services:
            svc["base_risk"] = "CRITICAL_CHAINED"
            svc["chain_escalated"] = True
        else:
            svc["chain_escalated"] = False

        escalated_services.append(svc)

    return escalated_services