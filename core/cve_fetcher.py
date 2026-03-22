import requests
import time

NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"


def fetch_cves(service_name, api_key, max_results=5):
    headers = {
        "apiKey": api_key
    }

    # smarter keyword mapping
    keyword_map = {
        "Redis": "redis-server",
        "PostgreSQL": "postgresql",
        "MySQL": "mysql"
    }

    keyword = keyword_map.get(service_name, service_name.lower())

    params = {
        "keywordSearch": keyword,
        "resultsPerPage": max_results
    }

    try:
        response = requests.get(
            NVD_API_URL,
            headers=headers,
            params=params,
            timeout=20
        )

        if response.status_code != 200:
            return []

        data = response.json()
        cves = []

        for item in data.get("vulnerabilities", []):
            cve = item.get("cve", {})
            metrics = cve.get("metrics", {})

            cvss = None
            severity = "UNKNOWN"

            # CVSS v3.1
            if "cvssMetricV31" in metrics:
                cvss_data = metrics["cvssMetricV31"][0]["cvssData"]
                cvss = cvss_data["baseScore"]
                severity = cvss_data["baseSeverity"]

            # CVSS v3.0
            elif "cvssMetricV30" in metrics:
                cvss_data = metrics["cvssMetricV30"][0]["cvssData"]
                cvss = cvss_data["baseScore"]
                severity = cvss_data["baseSeverity"]

            # CVSS v2 fallback
            elif "cvssMetricV2" in metrics:
                cvss_data = metrics["cvssMetricV2"][0]["cvssData"]
                cvss = cvss_data["baseScore"]
                severity = "MEDIUM"

            cves.append({
                "cve_id": cve.get("id"),
                "severity": severity,
                "cvss": cvss,
                "description": cve.get("descriptions", [{}])[0].get("value", "")
            })

        time.sleep(1)  # NVD rate-limit safety
        return cves

    except Exception:
        return []
