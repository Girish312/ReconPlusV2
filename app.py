from flask import Flask, render_template, request, send_file, jsonify
from flask_cors import CORS
from main import run_recon
from datetime import datetime, timezone
import os

app = Flask(__name__)
CORS(app)

last_scan = None
last_report = None
scan_time = None


@app.route("/")
def home():
    return render_template("index.html", scan=last_scan, report=last_report, scan_time=scan_time)


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "service": "reconplus-backend"}), 200


@app.route("/api/scan", methods=["POST"])
def api_scan():
    global last_scan
    global last_report
    global scan_time

    payload = request.get_json(silent=True) or {}
    domain = (payload.get("domain") or request.form.get("domain") or "").strip()

    if not domain:
        return jsonify({"error": "Missing required field: domain"}), 400

    try:
        run_recon(domain)
    except Exception as exc:
        return jsonify({"error": "Scan failed", "details": str(exc)}), 500

    last_scan = domain
    last_report = "output/report.pdf"
    scan_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    return jsonify({
        "message": "Scan completed",
        "domain": domain,
        "scan_time": scan_time,
        "artifacts": {
            "json": "output/recon.json",
            "html": "output/report.html",
            "pdf": "output/report.pdf"
        },
        "download_url": "/api/report/pdf"
    }), 200


@app.route("/api/report/pdf", methods=["GET"])
def download_pdf_report():
    report_path = "output/report.pdf"
    if not os.path.exists(report_path):
        return jsonify({"error": "Report not found. Run a scan first."}), 404

    response = send_file(
        report_path,
        as_attachment=True,
        download_name=f"report-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.pdf",
        max_age=0,
        conditional=False
    )
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.route("/api/report/json", methods=["GET"])
def get_json_report():
    report_path = "output/recon.json"
    if not os.path.exists(report_path):
        return jsonify({"error": "JSON report not found. Run a scan first."}), 404

    return send_file(report_path, as_attachment=False)


@app.route("/scan", methods=["POST"])
def scan():

    global last_scan
    global last_report
    global scan_time

    domain = request.form["domain"]

    run_recon(domain)

    last_scan = domain
    last_report = "output/report.pdf"
    scan_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    return send_file(last_report, as_attachment=True)


if __name__ == "__main__":
    app.run(debug=True)