def map_to_mitre(chain):
    techniques = []

    # Initial access
    if chain["exposure"].startswith("EXTERNAL"):
        techniques.append({
            "tactic": "Initial Access",
            "technique": "Exploit Public-Facing Application",
            "id": "T1190"
        })

    # Service specific mappings
    if chain["entry_service"].lower() == "redis":
        techniques.append({
            "tactic": "Execution",
            "technique": "Command and Scripting Interpreter",
            "id": "T1059"
        })

    # Privilege escalation paths
    for step in chain["attack_steps"]:
        if "docker" in step.lower():
            techniques.append({
                "tactic": "Privilege Escalation",
                "technique": "Escape to Host",
                "id": "T1611"
            })

        if "sudo" in step.lower():
            techniques.append({
                "tactic": "Privilege Escalation",
                "technique": "Sudo and Sudo Caching",
                "id": "T1548.003"
            })

    # Final impact
    if chain["final_impact"] == "ROOT_COMPROMISE":
        techniques.append({
            "tactic": "Impact",
            "technique": "Privilege Account Abuse",
            "id": "T1078"
        })

    return techniques


def enrich_chains_with_mitre(attack_chains):
    for chain in attack_chains:
        chain["mitre_attack"] = map_to_mitre(chain)
    return attack_chains
