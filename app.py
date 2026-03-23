from flask import Flask, render_template, request, send_file, jsonify
from flask_cors import CORS
from main import run_recon
from datetime import datetime, timezone
from core.assistant.assistant_engine import assistant_engine
from threading import Thread, Lock
import json
import os
import logging

app = Flask(__name__)
CORS(app)


class StatusEndpointFilter(logging.Filter):
    def filter(self, record):
        message = record.getMessage()
        return (
            '"GET /api/scan/status' not in message
            and '"OPTIONS /api/scan/status' not in message
            and '"GET /api/assistant/status' not in message
        )


_werkzeug_logger = logging.getLogger("werkzeug")
_werkzeug_logger.addFilter(StatusEndpointFilter())
for _handler in _werkzeug_logger.handlers:
    _handler.addFilter(StatusEndpointFilter())

last_scan = None
last_report = None
scan_time = None
scan_status_lock = Lock()
scan_status = {
    "state": "idle",
    "status": "Not Started",
    "progress": 0,
    "stage": "idle",
    "message": "No scan running",
    "domain": None,
    "error": None,
    "scan_time": None,
    "updated_at": None,
}


def _update_scan_status(**kwargs):
    with scan_status_lock:
        scan_status.update(kwargs)
        scan_status["updated_at"] = datetime.now(timezone.utc).isoformat()


def _get_scan_status_snapshot():
    with scan_status_lock:
        return dict(scan_status)


def _run_scan_in_background(domain: str):
    global last_scan
    global last_report
    global scan_time

    def progress_callback(progress, stage, message):
        _update_scan_status(
            state="running",
            status="In Progress",
            progress=max(0, min(99, int(progress))),
            stage=stage,
            message=message,
            domain=domain,
            error=None,
        )

    try:
        _update_scan_status(
            state="running",
            status="In Progress",
            progress=2,
            stage="initializing",
            message="Initializing scan",
            domain=domain,
            error=None,
            scan_time=None,
        )

        run_recon(domain, progress_callback=progress_callback)

        last_scan = domain
        last_report = "output/report.pdf"
        scan_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        _update_scan_status(
            state="completed",
            status="Completed",
            progress=100,
            stage="completed",
            message="Scan completed",
            domain=domain,
            error=None,
            scan_time=scan_time,
            artifacts={
                "json": "output/recon.json",
                "html": "output/report.html",
                "pdf": "output/report.pdf",
            },
        )
    except Exception as exc:
        _update_scan_status(
            state="error",
            status="Failed",
            progress=0,
            stage="error",
            message="Scan failed",
            domain=domain,
            error=str(exc),
        )


def _warm_assistant_model():
    try:
        assistant_engine._init_model()
    except Exception:
        # Keep backend resilient even if optional model warm-up fails.
        pass

def _should_warm_model() -> bool:
    # In Flask debug mode, the reloader spawns a parent + child process.
    # Only warm in the serving child to avoid duplicate model loading.
    if not app.debug:
        return True
    return os.environ.get("WERKZEUG_RUN_MAIN") == "true"


if _should_warm_model():
    Thread(target=_warm_assistant_model, daemon=True).start()


@app.route("/")
def home():
    return render_template("index.html", scan=last_scan, report=last_report, scan_time=scan_time)


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "service": "reconplus-backend"}), 200


@app.route("/api/scan", methods=["POST"])
def api_scan():
    payload = request.get_json(silent=True) or {}
    domain = (payload.get("domain") or request.form.get("domain") or "").strip()

    if not domain:
        return jsonify({"error": "Missing required field: domain"}), 400

    current_state = _get_scan_status_snapshot()
    if current_state.get("state") == "running":
        return jsonify({"error": "A scan is already running. Please wait for it to finish."}), 409

    worker = Thread(target=_run_scan_in_background, args=(domain,), daemon=True)
    worker.start()

    return jsonify({
        "message": "Scan started",
        "domain": domain,
        "state": "running",
    }), 202


@app.route("/api/scan/status", methods=["GET"])
def api_scan_status():
    return jsonify(_get_scan_status_snapshot()), 200


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


@app.route("/api/assistant/chat", methods=["POST"])
def assistant_chat():
    payload = request.get_json(silent=True) or {}
    message = (payload.get("message") or "").strip()

    if not message:
        return jsonify({"error": "Missing required field: message"}), 400

    report_data = {}
    report_path = "output/recon.json"
    if os.path.exists(report_path):
        try:
            with open(report_path, "r", encoding="utf-8") as report_file:
                report_data = json.load(report_file)
        except Exception:
            report_data = {}

    result = assistant_engine.ask(message, report_data)
    return jsonify({
        "reply": result.get("answer", "No response generated."),
        "source": result.get("source", "fallback"),
        "model": result.get("model", "fallback"),
        "model_error": result.get("model_error"),
    }), 200


@app.route("/api/assistant/status", methods=["GET"])
def assistant_status():
    status = assistant_engine.status()
    return jsonify(status), 200


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