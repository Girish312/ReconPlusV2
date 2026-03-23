# ReconPlus

**Automated Security Reconnaissance & Risk Assessment Framework**

ReconPlus is an automated security reconnaissance and vulnerability assessment framework designed to identify system-level exposures, web application vulnerabilities, and potential attack paths.

It combines reconnaissance, web scanning, privilege-escalation checks, risk scoring, and report generation to provide a complete security overview of a target environment.

---

## Objectives

ReconPlus helps security teams understand:

- Attack surface exposure
- Potential compromise paths
- Security misconfigurations
- Service exposure risks
- Vulnerability prioritization

---

## Key Features

| Feature | Description |
|---|---|
| **Subdomain Enumeration** | Discover subdomains and expand attack surface |
| **Live Host Detection** | Identify active hosts and web services |
| **Web Vulnerability Scanning** | Detect known vulnerabilities using templates |
| **Service Exposure Analysis** | Identify exposed services and risks |
| **Privilege Escalation Detection** | Analyze host for escalation weaknesses |
| **Risk Scoring Engine** | Compute severity distribution and overall score |
| **Automated Remediation Suggestions** | Provide fix recommendations |
| **Multi-Format Reports** | Generate JSON, HTML, and PDF reports |
| **Web Dashboard** | React dashboard for scanning and visualization |
| **Floating AI Assistant** | Scan-aware hybrid assistant (fine-tuned model + deterministic security guidance) |

---

## Security Assessment Modules

### 1. Device Security Scanning

ReconPlus analyzes the host system for exposed or insecure services.

**Security Checks:**

- Open ports and service exposure
- Risk scoring
- Attack path context

### 2. Web Application Vulnerability Scanning

ReconPlus scans web targets for common security vulnerabilities and misconfigurations.

---

## Integrated Security Tools

| Tool | Purpose |
|---|---|
| **Amass** | Subdomain enumeration |
| **Subfinder** | Passive subdomain discovery |
| **HTTPX** | Live host and web service detection |
| **Nmap** | Network/service scanning |
| **Feroxbuster** | Directory and endpoint discovery |
| **Nuclei** | Template-based vulnerability scanning |

---

## How ReconPlus Works

1. User submits a target domain.
2. Recon stages discover subdomains and live hosts.
3. Nuclei scans live targets for vulnerabilities.
4. Local checks run privilege-escalation and host risk logic.
5. Scoring engine computes `risk_summary` and overall risk score.
6. Report generators create `output/recon.json`, `output/report.html`, and `output/report.pdf`.
7. Dashboard fetches latest results from `GET /api/report/json` and renders risk cards/charts.
8. Floating AI assistant reads report context and routes query through hybrid response logic.
9. Assistant returns either rule-based security guidance (fast path) or model-generated answer (LLM path).

---

## Project Layout

```text
app.py          Flask server and API backend
main.py         Orchestrates the scan pipeline
core/           Scan, scoring, risk analysis, remediation, reporting, assistant
core/assistant/ Assistant engine + model-loading logic (ZIP/dir/LoRA support)
core/reporting/ HTML/PDF/JSON report generation modules
modules/        External tool wrappers (subfinder, httpx, nuclei, etc.)
templates/      Legacy Flask HTML page
output/         Generated reports (created at runtime)
frontend/       React + Firebase frontend app
frontend/src/components/FloatingAssistant.jsx  Floating assistant widget
frontend/src/services/reconApi.js              Frontend API integration client
```

---

## Requirements

### Python

- Python 3.10+
- `pip` and `venv`
- Install dependencies from `requirements.txt`
- `reportlab` is required for PDF generation (already included)

### System Tools

- `subfinder`
- `httpx`
- `nuclei`

### Linux Utilities (for full local host checks)

- `ss`
- `ip`

> For Windows, use WSL2 for best compatibility.

---

## Install Steps (Linux / WSL)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Go tools
go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
go install github.com/projectdiscovery/httpx/cmd/httpx@latest
go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

echo 'export PATH="$PATH:$HOME/go/bin:$HOME/.cargo/bin"' >> ~/.bashrc
source ~/.bashrc
```

---

## Install Steps (Windows)

Use WSL2 Ubuntu, then follow Linux steps inside Ubuntu:

```powershell
wsl --install -d Ubuntu
```

---

## NVD API Key

Set your NVD API key in `config.py`:

```python
NVD_API_KEY = "YOUR_NVD_API_KEY"
```

---

## Running the Project

### Backend API (Flask)

```bash
source .venv/bin/activate
python3 app.py
```

Backend: `http://127.0.0.1:5000`

### Frontend UI (React + Firebase)

```bash
cd frontend
npm install
npm start
```

Frontend: `http://127.0.0.1:3000`

Create `frontend/.env.local`:

```env
REACT_APP_API_BASE_URL=http://127.0.0.1:5000
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

## Frontend Integration Notes

Core routes used by dashboard:

- `GET /api/health`
- `POST /api/scan`
- `GET /api/report/json`
- `GET /api/report/pdf`
- `POST /api/assistant/chat`
- `GET /api/assistant/status`

`POST /api/scan` request body:

```json
{"domain": "scanme.nmap.org"}
```

---

## Floating AI Assistant Integration

Added floating AI assistant to User Dashboard for scan-aware Q&A.

How assistant works (runtime flow):

1. User asks a question in floating widget.
2. Frontend sends request to `POST /api/assistant/chat`.
3. Backend loads latest `output/recon.json` and builds scan context.
4. Assistant engine applies intent routing:
	- Rule path: risk/finding/remediation FAQs answered quickly.
	- Model path: fine-tuned LoRA/full model generates contextual response.
5. If model is unavailable or still loading, backend returns safe fallback response.
6. Frontend shows response along with assistant state/model metadata.

Assistant response pipeline uses a hybrid approach:

- Fine-tuned model path (LoRA/full model) for natural language interaction
- Report-grounded context injection from latest `output/recon.json`
- Deterministic rule layer for fast and reliable answers to common security questions (risk, findings, remediation)

- Frontend widget: `frontend/src/components/FloatingAssistant.jsx`
- Frontend API client: `frontend/src/services/reconApi.js` (`askAssistant`)
- Backend endpoint: `POST /api/assistant/chat`
- Backend engine: `core/assistant/assistant_engine.py`

### Model setup (Colab ZIP)

By default, assistant runs in fallback mode using latest `output/recon.json` context.

To use your fine-tuned model:

```bash
pip install transformers torch peft
```

Set one env variable before running backend:

```bash
export ASSISTANT_MODEL_ZIP="/absolute/path/to/model.zip"
# or
export ASSISTANT_MODEL_DIR="/absolute/path/to/extracted_model"
```

If your ZIP is a LoRA adapter, also set base model:

```bash
export ASSISTANT_BASE_MODEL="TinyLlama/TinyLlama-1.1B-Chat-v1.0"
```

Notes:

- First model warm-up can take time (download + load); this is expected on first run.
- After warm-up, common questions are answered quickly through the hybrid path.
- Very large local models on CPU are slower than hosted GPU inference.

If model load fails, assistant automatically uses fallback response mode.

---

## Quick Start
Quick start backend:
```
girish@DESKTOP-TO88QAR:~$ cd /mnt/c/Users/IMxGIRISH/Desktop/Projects/reconplus-main
girish@DESKTOP-TO88QAR:/mnt/c/Users/IMxGIRISH/Desktop/Projects/reconplus-main$ source .venv/bin/activate
(.venv) girish@DESKTOP-TO88QAR:/mnt/c/Users/IMxGIRISH/Desktop/Projects/reconplus-main$ export ASSISTANT_MODEL_ZIP="/mnt/c/Users/IMxGIRISH/Desktop/Projects/reconplus-main/core/assistant/recon-model/tinyllama-cyber-lora.zip"
(.venv) girish@DESKTOP-TO88QAR:/mnt/c/Users/IMxGIRISH/Desktop/Projects/reconplus-main$ export ASSISTANT_BASE_MODEL="TinyLlama/TinyLlama-1.1B-Chat-v1.0"
(.venv) girish@DESKTOP-TO88QAR:/mnt/c/Users/IMxGIRISH/Desktop/Projects/reconplus-main$ python3 app.py
```
Then quick start frontend:
PS C:\Users\IMxGIRISH\Desktop\Projects\reconplus-main> cd frontend
PS C:\Users\IMxGIRISH\Desktop\Projects\reconplus-main\frontend> npm install
PS C:\Users\IMxGIRISH\Desktop\Projects\reconplus-main\frontend> npm start

---
## Recent Backend/Frontend Integration Changes

- Dashboard vulnerability charts now reflect backend `risk_summary` correctly.
- Risk score now includes web vulnerability posture.
- Dynamic scan progress added in User Dashboard.
- Remedy engine upgraded from exact-name mapping to keyword-based matching.
- Recommendations include MEDIUM web findings (`MEDIUM` priority).
- PDF download is cache-disabled and timestamped to avoid stale files.
- Assistant now uses a hybrid response flow to improve reliability and response latency.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| `subfinder/httpx/nuclei` not found | Add `$HOME/go/bin` to PATH |
| PDF generation fails | Ensure `reportlab` is installed |
| `ss` / `ip` missing | Use Linux/WSL2 |
| Frontend cannot reach backend | Verify `REACT_APP_API_BASE_URL` |
| Assistant model not loading | Check `ASSISTANT_MODEL_ZIP`/`ASSISTANT_MODEL_DIR` and install `transformers` + `torch` + `peft` |
| Assistant responses are slow | Use `ASSISTANT_BASE_MODEL` + `HF_TOKEN`, keep model warm, and use hybrid rule path for frequent queries |

---

## Report Output

ReconPlus generates:

- `output/recon.json` (machine-readable)
- `output/report.html` (web report)
- `output/report.pdf` (printable report)

---

## Disclaimer

ReconPlus is intended strictly for **educational purposes** and **authorized security testing**.

Unauthorized scanning of systems without proper permission may violate legal and ethical guidelines.
