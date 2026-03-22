import subprocess
import shutil
import os


def resolve_httpx_binary():
    return shutil.which("httpx") or os.path.join(os.path.expanduser("~"), "go", "bin", "httpx")

def check_live_hosts(subdomains):

    if not subdomains:
        return []

    try:
        binary = resolve_httpx_binary()
        process = subprocess.Popen(
            [binary, "-silent"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        input_data = "\n".join(subdomains)
        output, stderr = process.communicate(input_data, timeout=120)
    except FileNotFoundError:
        print("[ReconGuard][WARN] httpx is not installed or not in PATH. Skipping live host probing.")
        return []
    except subprocess.TimeoutExpired:
        print("[ReconGuard][WARN] httpx timed out. Skipping live host probing.")
        return []
    except Exception as exc:
        print(f"[ReconGuard][WARN] httpx failed: {exc}")
        return []

    if process.returncode not in (0, None):
        print(f"[ReconGuard][WARN] httpx exited with code {process.returncode}. {(stderr or '').strip()}")

    live_hosts = [line.strip() for line in output.splitlines() if line.strip()]

    if not live_hosts and stderr:
        print(f"[ReconGuard][WARN] httpx produced no live hosts. Details: {stderr.strip()}")

    return live_hosts