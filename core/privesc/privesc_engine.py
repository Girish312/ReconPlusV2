from core.privesc.suid_scanner import scan_suid_binaries
from core.privesc.sudo_analyzer import analyze_sudo_rights
from core.privesc.writable_path_checker import check_writable_critical_paths
from core.privesc.docker_group_checker import check_docker_group_abuse
from core.privesc.kernel_surface_analyzer import analyze_kernel_surface
from core.privesc.checks.writable_files import check_writable_files
from core.privesc.checks.cron_jobs import check_cron_jobs
from core.privesc.checks.suid_binaries import check_suid_binaries
from core.privesc.checks.env_hijack import check_env_hijacking


def run_privesc_analysis():
    findings = []

    findings.extend(scan_suid_binaries())
    findings.extend(analyze_sudo_rights())
    findings.extend(check_writable_critical_paths())
    findings.extend(check_docker_group_abuse())
    findings.extend(analyze_kernel_surface())
    suid_findings = scan_suid_binaries()
    findings.extend(suid_findings)
    findings.extend(check_writable_files())
    findings.extend(check_cron_jobs())
    findings.extend(check_suid_binaries())
    findings.extend(check_env_hijacking())

    return findings
