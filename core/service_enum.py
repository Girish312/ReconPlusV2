import subprocess
from core.service_intel import SERVICE_MAP


def extract_port(address):
    try:
        return int(address.rsplit(":", 1)[-1])
    except Exception:
        return None


def get_running_services():
    try:
        result = subprocess.run(
            ["ss", "-tulnp"],
            capture_output=True,
            text=True,
            timeout=30
        )
    except FileNotFoundError:
        print("[ReconGuard][WARN] 'ss' command not found. Skipping local service enumeration.")
        return []
    except subprocess.TimeoutExpired:
        print("[ReconGuard][WARN] service enumeration timed out.")
        return []
    except Exception as exc:
        print(f"[ReconGuard][WARN] service enumeration failed: {exc}")
        return []

    if result.returncode != 0:
        stderr = (result.stderr or "").strip()
        print(f"[ReconGuard][WARN] 'ss' exited with code {result.returncode}. {stderr}")
        return []

    services = []

    for line in result.stdout.splitlines()[1:]:
        parts = line.split()
        if len(parts) < 6:
            continue

        port = extract_port(parts[4])
        if port is None:
            continue

        intel = SERVICE_MAP.get(
            port,
            {"name": "UNKNOWN", "risk": "UNKNOWN"}
        )

        services.append({
            "protocol": parts[0],
            "port": port,
            "service": intel["name"],
            "risk": intel["risk"],
            "process": parts[-1]
        })

    return services
