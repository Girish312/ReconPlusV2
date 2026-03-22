import subprocess

def get_docker_port_bindings():
    """
    Returns a dict of container ports:
    {
        6379: {
            "container": "redis",
            "image": "redis:7",
            "host_ip": "",
            "host_port": None,
            "network_mode": "bridge"
        }
    }
    """
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}|{{.Image}}|{{.Ports}}"],
            capture_output=True,
            text=True,
            timeout=20
        )
    except FileNotFoundError:
        return {}
    except subprocess.TimeoutExpired:
        return {}
    except Exception:
        return {}

    if result.returncode != 0:
        return {}

    ports = {}

    for line in result.stdout.splitlines():
        parts = line.split("|")
        if len(parts) != 3:
            continue

        name, image, port_info = parts

        if not port_info:
            continue

        # Example formats:
        # "6379/tcp"
        # "0.0.0.0:6379->6379/tcp"
        entries = port_info.split(",")

        for entry in entries:
            entry = entry.strip()

            if "->" in entry:
                # Published port
                host, container = entry.split("->")
                if ":" in host:
                    host_ip, host_port = host.rsplit(":", 1)
                else:
                    host_ip = ""
                    host_port = host

                try:
                    container_port = int(container.split("/")[0])
                except Exception:
                    continue
                ports[container_port] = {
                    "container": name,
                    "image": image,
                    "host_ip": host_ip,
                    "host_port": int(host_port) if str(host_port).isdigit() else None,
                    "network_mode": "bridge"
                }
            else:
                # Container-only port
                try:
                    container_port = int(entry.split("/")[0])
                except Exception:
                    continue
                ports[container_port] = {
                    "container": name,
                    "image": image,
                    "host_ip": "",
                    "host_port": None,
                    "network_mode": "bridge"
                }

    return ports
