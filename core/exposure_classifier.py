from core.docker_inspector import get_docker_port_bindings


def classify_exposure(service):
    port = service.get("port")
    process = service.get("process", "")

    docker_ports = get_docker_port_bindings()

    # Docker-based service detection
    if port in docker_ports:
        info = docker_ports[port]

        host_ip = info.get("host_ip")
        host_port = info.get("host_port")
        network_mode = info.get("network_mode")

        # Container-only (not exposed to host)
        if network_mode == "bridge" and host_port is None:
            return {
                "level": "CONTAINER",
                "reason": "Docker bridge network, port not published to host",
                "confidence": "HIGH"
            }

        # Bound only to localhost
        if host_ip in ["127.0.0.1", "localhost"]:
            return {
                "level": "LOCAL",
                "reason": "Docker port bound to localhost only",
                "confidence": "HIGH"
            }

        # Published to all interfaces
        if host_ip == "0.0.0.0":
            return {
                "level": "EXTERNAL_POTENTIAL",
                "reason": "Docker port published to all host interfaces",
                "confidence": "MEDIUM"
            }

    # Non-docker socket inspection
    if "127.0.0.1" in process or "localhost" in process:
        return {
            "level": "LOCAL",
            "reason": "Service bound to localhost",
            "confidence": "HIGH"
        }

    if "0.0.0.0" in process or "[::]" in process:
        return {
            "level": "EXTERNAL_CONFIRMED",
            "reason": "Service bound to all network interfaces",
            "confidence": "HIGH"
        }

    return {
        "level": "UNKNOWN",
        "reason": "Insufficient exposure data",
        "confidence": "LOW"
    }
