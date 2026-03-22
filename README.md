# ReconPlus

Automated Security Reconnaissance and Risk Assessment Framework.

ReconPlus performs domain reconnaissance, web vulnerability scanning, local privilege-escalation checks, risk scoring, and report generation (JSON/HTML/PDF). It includes a Flask backend API and a React dashboard.

## 1. What ReconPlus Does

Automated security reconnaissance and vulnerability assessment framework. Performs web reconnaissance, vulnerability scanning, local privilege-escalation analysis, risk scoring, and generates comprehensive reports.
- Discover externally reachable web targets
**Key Capabilities:**
- Web target discovery and vulnerability scanning (nuclei)
- Local host privilege-escalation risk analysis
- Risk scoring and prioritized remediation roadmaps
- Multi-format reports (JSON/HTML/PDF)
- Analyze local host privilege-escalation risks
## Architecture & Workflow
- Produce examiner-friendly reports in multiple formats
### System Components
## 2. How Components Connect
**Backend (Python/Flask):**
- `app.py`: REST API and report endpoints
- `main.py`: Orchestration pipeline
- `core/scanner_engine.py`: Web scan workflow (subfinder → httpx → nuclei)
- `core/remediation/remedy_engine.py`: Finding-to-remedy mapping
- `core/remediation/recommendations.py`: Roadmap generation
- `core/reporting/`: Report renderers (HTML, PDF)
- `core/scanner_engine.py`: web scan pipeline (subfinder -> httpx -> nuclei)
**Frontend (React/Firebase):**
- `frontend/`: Dashboard UI with authentication
- Calls `POST /api/scan`, `GET /api/report/json`, `GET /api/report/pdf`
- `core/remediation/recommendations.py`: roadmap generation with priority
### Data Flow
  - `GET /api/report/pdf` to download latest PDF report
1. User submits domain from dashboard → `POST /api/scan`
2. Backend runs web scan + local analysis + risk scoring
3. Results saved to `output/recon.json`
4. Reports rendered to HTML/PDF
5. Frontend loads JSON and updates charts/cards
5. Frontend reloads report JSON and updates charts/cards.
## System Requirements
- Nuclei timeout is tuned to long scans: `NUCLEI_TIMEOUT_SECONDS = 900`.
- **OS:** Linux (recommended), WSL2 (Windows), or macOS
- **Python:** 3.10+
- **Node.js:** 18+
- **Go, Rust/Cargo, nmap** (external tools)
- Remedies are now keyword-matched against nuclei finding names (not only exact names).
**Local host analysis (services, privilege-escalation) requires Linux/WSL2 utilities.**
- **Node.js:** 18+ (frontend)
## Installation

### Step 1: Python & Dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate  # Windows Git Bash/WSL: source .venv/Scripts/activate
pip install -r requirements.txt
```

### Step 2: External Tools (Linux/WSL2)

```bash
sudo apt update && sudo apt install -y golang-go nmap cargo

# Go tools (subfinder, httpx, nuclei, amass)
go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
go install github.com/projectdiscovery/httpx/cmd/httpx@latest
go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
go install github.com/owasp-amass/amass/v4/...@master

# Rust tool
cargo install feroxbuster

# Update PATH
echo 'export PATH="$PATH:$HOME/go/bin:$HOME/.cargo/bin"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
which subfinder httpx nuclei amass nmap feroxbuster
```

### Step 3: External Tools (macOS)

```bash
brew install golang rust nmap

# Follow Go/Rust tool installation from Step 2 above
# Then add to ~/.zprofile:
echo 'export PATH="$PATH:$HOME/go/bin:$HOME/.cargo/bin"' >> ~/.zprofile
```

### Step 4: External Tools (Windows)

**Use WSL2 for best results:**
echo 'export PATH="$PATH:$HOME/go/bin:$HOME/.cargo/bin"' >> ~/.bashrc
wsl --install -d Ubuntu
which subfinder httpx nuclei nmap feroxbuster
Then follow Linux steps inside the Ubuntu terminal.
```
### Step 5: Frontend Setup
#### macOS
brew install go rust nmap
cd frontend
npm install

#### Windows
Create `frontend/.env.local`:
```powershell
REACT_APP_API_BASE_URL=http://127.0.0.1:5000
REACT_APP_FIREBASE_API_KEY=<your-key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<your-domain>
REACT_APP_FIREBASE_PROJECT_ID=<your-project>
REACT_APP_FIREBASE_STORAGE_BUCKET=<your-bucket>
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<your-id>
REACT_APP_FIREBASE_APP_ID=<your-app-id>
REACT_APP_FIREBASE_MEASUREMENT_ID=<your-measurement-id>
npm install
```
## Running the Project

### Terminal 1: Backend
```bash
source .venv/bin/activate
python3 app.py
# Runs on http://127.0.0.1:5000
REACT_APP_FIREBASE_API_KEY=<your-key>
REACT_APP_FIREBASE_PROJECT_ID=<your-project>
### Terminal 2: Frontend
```bash
cd frontend && npm start
# Opens http://127.0.0.1:3000
```
```
## API Reference

### Health Check
```bash
GET /api/health
```

### Run Scan
```bash
POST /api/scan
Content-Type: application/json

{"domain":"scanme.nmap.org"}

Response:

{
  "message": "Scan completed",
  "domain": "scanme.nmap.org",
  "scan_time": "2026-03-22 14:11:10 UTC",
  "artifacts": {
    "json": "output/recon.json",
    "html": "output/report.html",
    "pdf": "output/report.pdf"
  }
}
### Terminal 1: Backend
```bash
### Get JSON Report
```bash
GET /api/report/json
```
python3 app.py
### Download PDF Report
```bash
GET /api/report/pdf
# Returns timestamped filename; no caching
## 6. API Reference (Current)

## Report Output
`GET /api/health`
**output/recon.json** contains:
- metadata (scan ID, timestamp)
- risk_summary (Critical/High/Medium/Low counts)
- overall_numeric_score and compromise_probability_percent
- web_vulnerabilities (with specific remedies)
- privesc_findings (privilege-escalation paths)
- recommendations (priority + action items)
- executive_summary

**output/report.html** and **output/report.pdf** render the same data for human review.

## Key Features

- **Smart Target Handling:** Accepts domain or URL; falls back gracefully if discovery tools return empty
- **Keyword-Based Remedies:** Maps nuclei findings to specific, actionable remediation steps
- **Blended Risk Scoring:** Combines web vulnerability and local host posture into single overall score
- **Prioritized Recommendations:** Web findings flagged as IMMEDIATE (CRITICAL/HIGH) or MEDIUM
- **Multi-Format Reports:** JSON for automation, HTML for browsers, PDF for distribution
- **Caching-Free Downloads:** PDF endpoint returns timestamped files to avoid stale reports

## Troubleshooting

### Tools not found
```bash
which subfinder httpx nuclei amass nmap feroxbuster
# If missing, ensure $HOME/go/bin and $HOME/.cargo/bin are in PATH
```

### Backend port 5000 already in use
`POST /api/scan`
lsof -i :5000 && kill -9 <PID>
```json
{"domain":"scanme.nmap.org"}
### Frontend cannot reach backend
- Verify `REACT_APP_API_BASE_URL=http://127.0.0.1:5000` in `frontend/.env.local`
- Ensure backend is running on port 5000
Success response shape:
### Empty scan results
- Confirm target is reachable from your network
- Verify nuclei/httpx are installed: `which nuclei httpx`
- Test with known-vulnerable domain: `scanme.nmap.org`
{
### npm start fails
```bash
cd frontend && rm -rf node_modules && npm install
```
  "scan_time": "2026-03-22 14:11:10 UTC",
## Testing the Setup

```bash
# Backend health check
curl http://127.0.0.1:5000/api/health

# Run a scan
curl -X POST -H "Content-Type: application/json" \
  -d '{"domain":"scanme.nmap.org"}' \
  http://127.0.0.1:5000/api/scan

# Download report
curl -L http://127.0.0.1:5000/api/report/pdf -o report.pdf
    "pdf": "output/report.pdf"
  },
**Expected for `scanme.nmap.org`:**
- 7 web vulnerabilities (low, medium, high mix)
- Risk summary: 2 medium, 5 low
- Overall score: ~4.88/10
```
## Legal & Security

Only scan systems you own or have explicit authorization to test. Unauthorized scanning may violate laws and policies.

### Download Latest PDF Report
---
**Version:** 1.1 (Production scan, scoring, remediation & reporting)
```

*** End Patch
- web_vulnerabilities (with remedy)
- privesc_findings
- recommendations (priority + issue + action)
- executive_summary

`output/report.html` and `output/report.pdf` render the same core data for human review.
