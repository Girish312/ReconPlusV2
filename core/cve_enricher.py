from core.cve_fetcher import fetch_cves
from config import NVD_API_KEY


def enrich_services_with_cves(services):
    enriched = []

    for service in services:
        if service["service"] not in ["UNKNOWN", "DNS"]:
            cves = fetch_cves(service["service"], NVD_API_KEY)
            service["cves"] = cves
        else:
            service["cves"] = []

        enriched.append(service)

    return enriched
