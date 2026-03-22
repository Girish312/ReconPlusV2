import json
from pathlib import Path
from html import escape


def generate_html_report(recon_data, output_path="output/report.html"):
    Path("output").mkdir(exist_ok=True)

    metadata = recon_data.get("metadata", {})
    target = recon_data.get("target", {})
    risk_summary = recon_data.get("risk_summary", {})

    services_rows = ""
    for svc in recon_data.get("services", []):
        services_rows += f"""
        <tr>
            <td>{escape(str(svc.get('service', 'Unknown')))}</td>
            <td>{escape(str(svc.get('port', '')))}</td>
            <td>{escape(str(svc.get('base_risk', 'UNKNOWN')))}</td>
            <td>{escape(str(svc.get('numeric_score', '0')))}</td>
            <td>{escape(str(svc.get('exposure', {}).get('level', 'UNKNOWN')))}</td>
        </tr>
        """

    if not services_rows:
        services_rows = """
        <tr>
            <td colspan=\"5\">No service-level findings available.</td>
        </tr>
        """

    privesc_rows = ""
    for f in recon_data.get("privesc_findings", []):
        privesc_rows += f"""
        <tr>
            <td>{escape(str(f.get('type', 'Unknown')))}</td>
            <td>{escape(str(f.get('risk', 'INFO')))}</td>
            <td>{escape(str(f.get('reason', 'No reason provided')))}</td>
        </tr>
        """

    if not privesc_rows:
        privesc_rows = """
        <tr>
            <td colspan=\"3\">No privilege escalation findings detected.</td>
        </tr>
        """

    web_vuln_rows = ""
    for v in recon_data.get("web_vulnerabilities", []):
        web_vuln_rows += f"""
        <tr>
            <td>{escape(str(v.get('host', 'Unknown')))}</td>
            <td>{escape(str(v.get('vulnerability', 'Unknown')))}</td>
            <td>{escape(str(v.get('severity', 'INFO')))}</td>
            <td>{escape(str(v.get('remedy', 'No recommendation provided')))}</td>
        </tr>
        """

    if not web_vuln_rows:
        web_vuln_rows = """
        <tr>
            <td colspan=\"4\">No web vulnerabilities detected.</td>
        </tr>
        """
    
    recommendation_rows = ""
    for r in recon_data.get("recommendations", []):
        recommendation_rows += f"""
        <tr>
            <td>{escape(str(r.get('priority', 'INFO')))}</td>
            <td>{escape(str(r.get('issue', 'General hardening')))}</td>
            <td>{escape(str(r.get('action', 'Review and apply relevant fixes.')))}</td>
        </tr>
        """

    if not recommendation_rows:
        recommendation_rows = """
        <tr>
            <td colspan=\"3\">No remediation actions generated.</td>
        </tr>
        """

    risk_summary_rows = f"""
        <tr><td>Critical</td><td>{risk_summary.get('CRITICAL', 0)}</td></tr>
        <tr><td>High</td><td>{risk_summary.get('HIGH', 0)}</td></tr>
        <tr><td>Medium</td><td>{risk_summary.get('MEDIUM', 0)}</td></tr>
        <tr><td>Low</td><td>{risk_summary.get('LOW', 0)}</td></tr>
        <tr><td>Unknown</td><td>{risk_summary.get('UNKNOWN', 0)}</td></tr>
    """

    chains_section = ""
    for chain in recon_data.get("attack_chains", []):
        steps = "<br>".join(chain.get("attack_steps", []))
        mitre = "<br>".join(
            f"{m['id']} - {m['technique']}" for m in chain.get("mitre_attack", [])
        )

        chains_section += f"""
        <div class="chain">
            <h4>{chain.get('entry_service')} (Port {chain.get('port')})</h4>
            <p><strong>Impact:</strong> {chain.get('final_impact')}</p>
            <p><strong>Steps:</strong><br>{steps}</p>
            <p><strong>MITRE Mapping:</strong><br>{mitre}</p>
        </div>
        """

    html_content = f"""
    <html>
    <head>
        <title>ReconGuard Security Report</title>
        <style>
            body {{ font-family: Arial; margin: 40px; background: #f4f6f8; }}
            h1, h2 {{ color: #1a1a1a; }}
            table {{ border-collapse: collapse; width: 100%; margin-bottom: 30px; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #2c3e50; color: white; }}
            .meta {{ margin-bottom: 20px; color: #444; }}
            .score-box {{
                padding: 20px;
                background: #ffffff;
                border-left: 6px solid #e74c3c;
                margin-bottom: 30px;
                font-size: 18px;
            }}
            .summary-box {{
                padding: 16px;
                background: #ffffff;
                border-left: 6px solid #3498db;
                margin-bottom: 30px;
                line-height: 1.6;
            }}
            .chain {{
                background: white;
                padding: 15px;
                margin-bottom: 15px;
                border-left: 4px solid #2980b9;
            }}
        </style>
    </head>
    <body>

        <h1>ReconGuard Executive Security Report</h1>

        <div class="meta">
            <div><strong>Scan ID:</strong> {escape(str(metadata.get('scan_id', 'N/A')))}</div>
            <div><strong>Timestamp:</strong> {escape(str(metadata.get('timestamp', 'N/A')))}</div>
            <div><strong>Target:</strong> {escape(str(target.get('domain', recon_data.get('system', {}).get('hostname', 'N/A'))))}</div>
        </div>

        <div class="score-box">
            <strong>Overall Numeric Risk Score:</strong> {recon_data.get('overall_numeric_score')} / 10<br>
            <strong>Compromise Probability:</strong> {recon_data.get('compromise_probability_percent')}%
        </div>

        <h2>Executive Summary</h2>
        <div class="summary-box">
            {escape(str(recon_data.get('executive_summary', 'No executive summary available.')))}
        </div>

        <h2>Risk Summary</h2>
        <table>
            <tr>
                <th>Severity</th>
                <th>Count</th>
            </tr>
            {risk_summary_rows}
        </table>

        <h2>Services</h2>
        <table>
            <tr>
                <th>Service</th>
                <th>Port</th>
                <th>Risk</th>
                <th>Score</th>
                <th>Exposure</th>
            </tr>
            {services_rows}
        </table>

        <h2>Privilege Escalation Findings</h2>
        <table>
            <tr>
                <th>Type</th>
                <th>Risk</th>
                <th>Reason</th>
            </tr>
            {privesc_rows}
        </table>

        <h2>Website Vulnerability Findings</h2>
        <table>
            <tr>
                <th>Host</th>
                <th>Vulnerability</th>
                <th>Severity</th>
                <th>Remedy</th>
            </tr>
            {web_vuln_rows}
        </table>

        <h2>Attack Chains</h2>
        {chains_section if chains_section else '<p>No attack chains generated.</p>'}

        <div class="card">
        <h2>Recommended Actions</h2>
        <table>
        <tr>
            <th>Priority</th>
            <th>Issue</th>
            <th>Recommended Action</th>
        </tr>
            {recommendation_rows}
        </table>
        </div>
    </body>
    </html>
    """

    with open(output_path, "w") as f:
        f.write(html_content)

    return output_path