from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.piecharts import Pie
from reportlab.lib.pagesizes import A4
import os


# Deduplication Utilities
def unique_services(services):
    seen = set()
    unique = []
    for svc in services:
        key = (svc.get("service"), svc.get("port"))
        if key not in seen:
            seen.add(key)
            unique.append(svc)
    return unique


def unique_privesc(findings):
    seen = set()
    unique = []
    for f in findings:
        key = (f.get("type"), f.get("reason"))
        if key not in seen:
            seen.add(key)
            unique.append(f)
    return unique


def unique_recommendations(recommendations):
    seen = set()
    unique = []
    for r in recommendations:
        key = (r.get("issue"), r.get("action"))
        if key not in seen:
            seen.add(key)
            unique.append(r)
    return unique


# Severity Color Helper
def severity_color(level):
    colors_map = {
        "CRITICAL": colors.red,
        "HIGH": colors.orange,
        "MEDIUM": colors.gold,
        "LOW": colors.green,
        "INFO": colors.blue
    }
    return colors_map.get(level, colors.black)


# Pie Chart Builder
def build_risk_pie(risk_summary):

    total = sum(risk_summary.values())
    if total == 0:
        return Spacer(1, 0.1 * inch)

    drawing = Drawing(400, 200)

    pie = Pie()
    pie.x = 150
    pie.y = 15
    pie.width = 150
    pie.height = 150

    pie.data = [
        risk_summary.get("CRITICAL", 0),
        risk_summary.get("HIGH", 0),
        risk_summary.get("MEDIUM", 0),
        risk_summary.get("LOW", 0),
    ]

    pie.labels = [
        f"Critical ({risk_summary.get('CRITICAL', 0)})",
        f"High ({risk_summary.get('HIGH', 0)})",
        f"Medium ({risk_summary.get('MEDIUM', 0)})",
        f"Low ({risk_summary.get('LOW', 0)})",
    ]

    pie.slices[0].fillColor = colors.red
    pie.slices[1].fillColor = colors.orange
    pie.slices[2].fillColor = colors.gold
    pie.slices[3].fillColor = colors.green

    drawing.add(pie)
    return drawing

# Main PDF Generator
def generate_pdf_report(data):

    os.makedirs("output", exist_ok=True)
    file_path = "output/report.pdf"

    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    elements = []
    styles = getSampleStyleSheet()

    normal = styles["BodyText"]
    heading = styles["Heading2"]
    title_style = styles["Heading1"]

    # Small font for table content
    table_style = ParagraphStyle(
        "TableText",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        alignment=TA_LEFT,
        wordWrap="CJK",
        splitLongWords=1
    )

    # Title
    elements.append(Paragraph("<b>ReconGuard Security Assessment Report</b>", title_style))
    elements.append(Spacer(1, 0.3 * inch))

    metadata = data.get("metadata", {})
    target = data.get("target", {})
    system = data.get("system", {})
    display_target = target.get("domain") or system.get("hostname") or "N/A"

    elements.append(Paragraph(f"<b>Scan ID:</b> {metadata.get('scan_id', 'N/A')}", normal))
    elements.append(Paragraph(f"<b>Timestamp:</b> {metadata.get('timestamp', 'N/A')}", normal))
    elements.append(Paragraph(f"<b>Target:</b> {display_target}", normal))
    elements.append(Spacer(1, 0.25 * inch))

    # Executive Summary
    elements.append(Paragraph("Executive Summary", heading))
    elements.append(Spacer(1, 0.15 * inch))

    summary_text = data.get("executive_summary", "No executive summary available.")
    elements.append(Paragraph(summary_text, normal))
    elements.append(Spacer(1, 0.4 * inch))

    # Overall Risk Overview
    elements.append(Paragraph("Overall Risk Overview", heading))
    elements.append(Spacer(1, 0.15 * inch))

    score = round(data.get("overall_numeric_score", 0), 2)
    prob = round(data.get("compromise_probability_percent", 0), 2)
    risk_summary = data.get("risk_summary", {})
    web_vulns = data.get("web_vulnerabilities", [])
    privesc = unique_privesc(data.get("privesc_findings", []))

    elements.append(Paragraph(f"<b>Risk Score:</b> {score} / 10", normal))
    elements.append(Paragraph(f"<b>Estimated Compromise Probability:</b> {prob}%", normal))
    elements.append(Paragraph(f"<b>Web Vulnerabilities:</b> {len(web_vulns)}", normal))
    elements.append(Paragraph(f"<b>Privilege Escalation Findings:</b> {len(privesc)}", normal))
    elements.append(Spacer(1, 0.4 * inch))

    # Risk Distribution

    elements.append(Paragraph("Risk Distribution", heading))
    elements.append(Spacer(1, 0.2 * inch))

    risk_table_data = [
        ["Severity", "Count"],
        ["CRITICAL", risk_summary.get("CRITICAL", 0)],
        ["HIGH", risk_summary.get("HIGH", 0)],
        ["MEDIUM", risk_summary.get("MEDIUM", 0)],
        ["LOW", risk_summary.get("LOW", 0)],
    ]

    risk_table = Table(risk_table_data, colWidths=[2.5 * inch, 1 * inch])

    risk_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    elements.append(risk_table)
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(build_risk_pie(risk_summary))
    elements.append(Spacer(1, 0.5 * inch))

    # High-Risk Services

    elements.append(Paragraph("Top High-Risk Services", heading))
    elements.append(Spacer(1, 0.2 * inch))

    services = unique_services(data.get("services", []))
    services = [s for s in services if s.get("numeric_score", 0) >= 7]

    services = sorted(
        services,
        key=lambda x: x.get("numeric_score", 0),
        reverse=True
    )[:5]

    if services:

        service_table_data = [["Service", "Port", "Risk", "Score", "Exposure"]]

        for svc in services:
            service_table_data.append([
                svc.get("service", "Unknown"),
                str(svc.get("port", "")),
                svc.get("risk_label", "UNKNOWN"),
                str(round(svc.get("numeric_score", 0), 2)),
                svc.get("exposure", {}).get("level", "UNKNOWN").replace("_", " ").title()
            ])

        service_table = Table(service_table_data, repeatRows=1)

        service_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ALIGN", (1, 1), (-1, -1), "CENTER"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))

        elements.append(service_table)

    else:
        elements.append(Paragraph("No high-risk services identified.", normal))

    elements.append(Spacer(1, 0.5 * inch))

    # Privilege Escalation
    elements.append(Paragraph("Privilege Escalation Findings", heading))
    elements.append(Spacer(1, 0.2 * inch))

    if privesc:
        for finding in privesc:
            elements.append(
                Paragraph(
                    f"<b>{finding.get('type')}</b> "
                    f"({finding.get('risk')}): "
                    f"{finding.get('reason')}",
                    normal
                )
            )
            elements.append(Spacer(1, 0.1 * inch))
    else:
        elements.append(Paragraph("No privilege escalation findings detected.", normal))

    elements.append(Spacer(1, 0.5 * inch))

    # Website Vulnerabilities
    elements.append(Paragraph("Website Vulnerability Findings", heading))
    elements.append(Spacer(1, 0.2 * inch))

    if web_vulns:
        vuln_table_data = [["Host", "Vulnerability", "Severity", "Remedy"]]

        for v in web_vulns:
            vuln_table_data.append([
                Paragraph(v.get("host", "Unknown"), table_style),
                Paragraph(v.get("vulnerability", "Unknown"), table_style),
                Paragraph(v.get("severity", "INFO"), table_style),
                Paragraph(v.get("remedy", "No recommendation provided"), table_style)
            ])

        vuln_table = Table(
            vuln_table_data,
            colWidths=[1.35 * inch, 1.95 * inch, 0.75 * inch, 2.45 * inch],
            repeatRows=1
        )

        vuln_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (2, 1), (2, -1), "CENTER"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("MINHEIGHT", (0, 1), (-1, -1), 0.65 * inch),
        ]))

        elements.append(vuln_table)
        elements.append(Spacer(1, 0.15 * inch))
        elements.append(Paragraph(f"<b>Total Website Vulnerabilities:</b> {len(web_vulns)}", normal))

    else:
        elements.append(Paragraph("No web vulnerabilities detected.", normal))

    elements.append(Spacer(1, 0.5 * inch))

    # Remediation Roadmap

    elements.append(Paragraph("Remediation Roadmap", heading))
    elements.append(Spacer(1, 0.2 * inch))

    recommendations = unique_recommendations(data.get("recommendations", []))

    immediate = [r for r in recommendations if r.get("priority") == "IMMEDIATE"]
    high = [r for r in recommendations if r.get("priority") == "HIGH"]
    medium = [r for r in recommendations if r.get("priority") == "MEDIUM"]
    low = [r for r in recommendations if r.get("priority") == "LOW"]

    if immediate:
        elements.append(Paragraph("<b>Immediate Actions</b>", styles["Heading3"]))
        elements.append(Spacer(1, 0.15 * inch))

        for r in immediate:
            elements.append(Paragraph(f"<b>{r.get('issue')}</b>", normal))
            elements.append(Paragraph(f"Recommended Action: {r.get('action')}", normal))
            elements.append(Spacer(1, 0.2 * inch))

    if high:
        elements.append(Paragraph("<b>High Priority Actions</b>", styles["Heading3"]))
        elements.append(Spacer(1, 0.15 * inch))

        for r in high:
            elements.append(Paragraph(f"<u>{r.get('issue', 'General')}</u>", normal))
            elements.append(Paragraph(f"Action: {r.get('action', 'Apply relevant fixes.')}", normal))
            elements.append(Spacer(1, 0.15 * inch))

    if medium:
        elements.append(Paragraph("<b>Medium Priority Actions</b>", styles["Heading3"]))
        elements.append(Spacer(1, 0.15 * inch))

        for r in medium:
            elements.append(Paragraph(f"<u>{r.get('issue', 'General')}</u>", normal))
            elements.append(Paragraph(f"Action: {r.get('action', 'Apply relevant fixes.')}", normal))
            elements.append(Spacer(1, 0.15 * inch))

    if low:
        elements.append(Paragraph("<b>Low Priority Actions</b>", styles["Heading3"]))
        elements.append(Spacer(1, 0.15 * inch))

        for r in low:
            elements.append(Paragraph(f"<u>{r.get('issue', 'General')}</u>", normal))
            elements.append(Paragraph(f"Action: {r.get('action', 'Apply relevant fixes.')}", normal))
            elements.append(Spacer(1, 0.15 * inch))

    if not immediate and not high and not medium and not low:
        elements.append(Paragraph("No remediation actions required.", normal))

    doc.build(elements)

    return file_path