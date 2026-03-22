import subprocess
import shutil
import os


def resolve_subfinder_binary():
    return shutil.which("subfinder") or os.path.join(os.path.expanduser("~"), "go", "bin", "subfinder")

def run_subfinder(domain):

    binary = resolve_subfinder_binary()
    cmd = [binary, "-d", domain, "-silent"]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    except FileNotFoundError:
        print("[ReconGuard][WARN] subfinder is not installed or not in PATH. Skipping subdomain enumeration.")
        return []
    except subprocess.TimeoutExpired:
        print("[ReconGuard][WARN] subfinder timed out. Skipping subdomain enumeration.")
        return []
    except Exception as exc:
        print(f"[ReconGuard][WARN] subfinder failed: {exc}")
        return []

    if result.returncode != 0:
        stderr = (result.stderr or "").strip()
        print(f"[ReconGuard][WARN] subfinder exited with code {result.returncode}. {stderr}")
        return []

    return [line.strip() for line in result.stdout.splitlines() if line.strip()]