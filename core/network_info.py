import subprocess

def get_network_info():
    try:
        result = subprocess.run(
            ["ip", "-o", "-4", "addr", "show"],
            capture_output=True,
            text=True,
            timeout=20
        )
    except FileNotFoundError:
        print("[ReconGuard][WARN] 'ip' command not found. Skipping network interface discovery.")
        return {"interfaces": []}
    except subprocess.TimeoutExpired:
        print("[ReconGuard][WARN] network interface discovery timed out.")
        return {"interfaces": []}
    except Exception as exc:
        print(f"[ReconGuard][WARN] network interface discovery failed: {exc}")
        return {"interfaces": []}

    if result.returncode != 0:
        stderr = (result.stderr or "").strip()
        print(f"[ReconGuard][WARN] 'ip' exited with code {result.returncode}. {stderr}")
        return {"interfaces": []}

    interfaces = []
    for line in result.stdout.splitlines():
        parts = line.split()
        if len(parts) < 4:
            continue
        interfaces.append({
            "interface": parts[1],
            "ip_address": parts[3]
        })

    return {
        "interfaces": interfaces
    }
