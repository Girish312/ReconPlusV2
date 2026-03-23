from modules.osint.subfinder_scan import run_subfinder
from modules.discovery.httpx_scan import check_live_hosts
from modules.vulnerability.nuclei_scan import run_nuclei
from urllib.parse import urlparse
import socket

from core.remediation.remedy_engine import get_remedy


def normalize_target(target):
    if not target:
        return ""

    raw = target.strip()
    parsed = urlparse(raw if "://" in raw else f"http://{raw}")
    host = (parsed.netloc or parsed.path).strip()
    return host.split("/")[0]


def is_target_reachable(host, timeout=4):
    for port in (443, 80):
        try:
            with socket.create_connection((host, port), timeout=timeout):
                return True, port
        except Exception:
            continue
    return False, None


def run_scan(domain, progress_callback=None):

    def emit_progress(progress, stage, message):
        if callable(progress_callback):
            try:
                progress_callback(progress, stage, message)
            except Exception:
                pass

    normalized_domain = normalize_target(domain)

    if not normalized_domain:
        print("[ReconGuard][WARN] Empty target received. Skipping web scan.")
        return []

    if normalized_domain != domain:
        print(f"[ReconGuard] Normalized target '{domain}' -> '{normalized_domain}'")

    print(f"[ReconGuard] Starting scan for {normalized_domain}")

    reachable, port = is_target_reachable(normalized_domain)
    if reachable:
        print(f"[ReconGuard] Reachability check passed on port {port}.")
    else:
        print("[ReconGuard][WARN] Target appears unreachable on ports 80/443 from this host. Results may be empty.")

    print("[ReconGuard] Running subfinder...")
    subdomains = run_subfinder(normalized_domain)

    if not subdomains:
        # Fall back to the original input so downstream stages can still run.
        subdomains = [normalized_domain]
        print("[ReconGuard][WARN] No subdomains discovered. Falling back to input domain.")

    print(f"[ReconGuard] {len(subdomains)} subdomains discovered")

    print("[ReconGuard] Checking live hosts...")
    live_hosts = check_live_hosts(subdomains)

    if not live_hosts:
        live_hosts = [normalized_domain]
        print("[ReconGuard][WARN] No live hosts discovered via httpx. Falling back to input domain for nuclei scan.")

    print(f"[ReconGuard] {len(live_hosts)} live hosts found")

    findings = []
    host_count = len(live_hosts)

    for idx, host in enumerate(live_hosts):

        current_progress = 12 + ((idx / max(host_count, 1)) * 10)
        emit_progress(current_progress, "web_scan", f"Scanning {host} ({idx + 1}/{host_count})")
        print(f"[ReconGuard] Running nuclei scan on {host}")

        vulns = run_nuclei(host)

        for v in vulns:

            vuln_name = v.get("info", {}).get("name", "Unknown")
            severity = v.get("info", {}).get("severity", "low")

            remedy = get_remedy(vuln_name)

            findings.append({

                "host": host,
                "vulnerability": vuln_name,
                "severity": severity.upper(),
                "remedy": remedy

            })

    print(f"[ReconGuard] Scan finished. {len(findings)} findings discovered.")
    
    emit_progress(22, "web_scan", f"Web scan completed. Found {len(findings)} vulnerabilities")

    return findings