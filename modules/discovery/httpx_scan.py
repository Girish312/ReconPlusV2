import subprocess
import shutil
import os


def _is_projectdiscovery_httpx(binary_path):
    try:
        version_check = subprocess.run(
            [binary_path, "-version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        version_text = f"{version_check.stdout}\n{version_check.stderr}".lower()
        return "projectdiscovery" in version_text or "httpx" in version_text
    except Exception:
        return False


def resolve_httpx_binary():
    go_binary = os.path.join(os.path.expanduser("~"), "go", "bin", "httpx")
    path_binary = shutil.which("httpx")

    # Prefer the Go-installed ProjectDiscovery binary when available.
    if os.path.isfile(go_binary) and os.access(go_binary, os.X_OK):
        return go_binary

    if path_binary and _is_projectdiscovery_httpx(path_binary):
        return path_binary

    return go_binary if path_binary is None else path_binary

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