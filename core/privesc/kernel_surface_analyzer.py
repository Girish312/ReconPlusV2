import platform


def analyze_kernel_surface():
    findings = []

    kernel = platform.release()

    findings.append({
        "type": "KERNEL_INFO",
        "kernel_version": kernel,
        "risk": "INFO",
        "reason": "Kernel version collected for exploit surface analysis"
    })

    return findings
