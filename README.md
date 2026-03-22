# ReconPlus

Automated Security Reconnaissance and Risk Assessment Framework for web and local host assessment, risk scoring, and remediation roadmap generation.

**Key Capabilities:**
- Domain reconnaissance (subfinder → httpx → nuclei for web vulnerabilities)
- Local privilege-escalation analysis
- Blended risk scoring (web + service posture)
- Actionable remediation recommendations with severity prioritization
- Multi-format reporting (JSON, HTML, PDF)

## 1. Architecture & Data Flow

### Components
| Component | Purpose |
|-----------|---------|
| `app.py` | Flask REST API (health, scan endpoint, report delivery) |
| `main.py` | Orchestration pipeline: `run_recon(domain)` orchestrates all phases |
| `core/scanner_engine.py` | Web scan pipeline: target normalization, subfinder, httpx, nuclei |
| `core/scoring/cvss_engine.py` | Risk calculation: blends web findings + service risks into 0–10 score |
| `core/remediation/remedy_engine.py` | Keyword-matching: maps nuclei finding names to specific remedies |
| `core/remediation/recommendations.py` | Generates prioritized roadmap (IMMEDIATE for HIGH/CRITICAL, MEDIUM for MEDIUM) |
| `core/reporting/` | HTML/PDF report renderers with styled tables and severity distributions |
| `frontend/` | React dashboard with Firebase auth; calls `/api/scan`, `/api/report/json`, `/api/report/pdf` |

### End-to-End Flow
1. User enters domain in React dashboard and clicks **Start Scan**.
2. `POST /api/scan` → Backend calls `run_recon(domain)`.
3. **Web scan phase:** Normalizes target, runs subfinder (subdomains), httpx (live hosts), nuclei (vulnerabilities).
4. **Local analysis phase:** Enumerates services, checks privilege-escalation, builds attack chains.
5. **Scoring phase:** Calculates service risks + web vulnerability risks → blended overall score.
6. **Remediation phase:** Maps findings to specific remedies and generates prioritized recommendations.
7. **Output:** JSON, HTML, PDF saved to `output/`.
8. Frontend fetches `GET /api/report/json` and renders dashboard charts.
9. User can download `/api/report/pdf` (cache-disabled, timestamped filename).

### Key Logic

**Risk Scoring:**
- Services scored 0–10 based on exposure + CVE data.
- Web vulnerabilities scored by severity: CRITICAL=9.5, HIGH=8.0, MEDIUM=5.5, LOW=3.0.
- Overall score = 55% service posture + 45% web posture (capped at 10.0).
- `risk_summary` tallies severities across both web and local findings.

**Remediation Matching:**
- Nuclei finding names are normalized (lowercase, spaces/hyphens retained) and matched against keyword rules.
- Examples: "SSH Weak MAC Algorithms" → "Disable weak MACs…", "Terrapin Attack" → "Upgrade OpenSSH…".
- Fallback: Generic hardening message if no match.

**Priority Assignment:**
- CRITICAL/HIGH web findings → IMMEDIATE
- MEDIUM web findings → MEDIUM
- Service/privesc findings → priority based on risk level
- Reports include all priorities in roadmap section.

## 2. System Requirements & Setup

### Prerequisites
- **OS:** Linux (recommended) or WSL2 on Windows; macOS has partial support for local analysis.
- **Python:** 3.10+
- **Node.js:** 18+ (frontend)
- **Go, Rust/Cargo, nmap** (external tools; see below)

### Install Python Environment
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows Git Bash/WSL: source .venv/Scripts/activate
pip install -r requirements.txt
```

**Key packages:** requests, flask, flask-cors, reportlab, python-nmap, networkx, etc.

### Install External Tools

#### Linux / WSL2
```bash
sudo apt update
sudo apt install -y golang-go nmap cargo

# Go tools
go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
go install github.com/projectdiscovery/httpx/cmd/httpx@latest
go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
go install github.com/owasp-amass/amass/v4/...@master

# Rust tool
cargo install feroxbuster

# Add to PATH
echo 'export PATH="$PATH:$HOME/go/bin:$HOME/.cargo/bin"' >> ~/.bashrc
source ~/.bashrc

# Verify
which subfinder httpx nuclei nmap feroxbuster
```

#### macOS
```bash
brew install go rust nmap

# Go tools (same as above)
go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
go install github.com/projectdiscovery/httpx/cmd/httpx@latest
go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
go install github.com/owasp-amass/amass/v4/...@master

# Rust
cargo install feroxbuster

# Add to PATH
echo 'export PATH="$PATH:$HOME/go/bin:$HOME/.cargo/bin"' >> ~/.zprofile
```

#### Windows
Use **WSL2** (recommended):
```powershell
wsl --install -d Ubuntu
```
Then follow Linux steps inside Ubuntu terminal.

### Setup Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
REACT_APP_API_BASE_URL=http://127.0.0.1:5000
REACT_APP_FIREBASE_API_KEY=<your-key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<your-domain>
REACT_APP_FIREBASE_PROJECT_ID=<your-project>
# ... (other Firebase env vars)
```

## 3. Running the Project

### Terminal 1: Backend
```bash
source .venv/bin/activate
python3 app.py
# Runs on http://127.0.0.1:5000
```

### Terminal 2: Frontend
```bash
cd frontend
npm start
# Opens http://127.0.0.1:3000
```

### Test the System
```bash
# Health check
curl http://127.0.0.1:5000/api/health

# Run scan (example: scanme.nmap.org)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"domain":"scanme.nmap.org"}' \
  http://127.0.0.1:5000/api/scan

# Fetch latest report
curl http://127.0.0.1:5000/api/report/json | jq '.'

# Download PDF (timestamped filename)
curl -L http://127.0.0.1:5000/api/report/pdf -o report.pdf
```

Expected output for `scanme.nmap.org`: ~7 web vulnerabilities, risk_summary with MEDIUM=2 and LOW=5, overall_numeric_score ≈ 4.88.

## 4. API Endpoints

| Endpoint | Method | Purpose | Response Notes |
|----------|--------|---------|-----------------|
| `/api/health` | GET | Service health | `{"status":"ok","service":"reconplus-backend"}` |
| `/api/scan` | POST | Start scan | Request: `{"domain":"example.com"}` |
| `/api/report/json` | GET | Latest JSON report | No cache; returns `output/recon.json` |
| `/api/report/pdf` | GET | Latest PDF report | No cache; timestamped filename (e.g., `report-20260322-141110.pdf`) |

## 5. Report & Output

**`output/recon.json` structure:**
```json
{
  "metadata": { "scan_id", "timestamp", "scanner_version" },
  "system": { "os", "kernel", "hostname", ... },
  "network": { "interfaces": [...] },
  "risk_summary": { "CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN" },
  "overall_numeric_score": 0.0-10.0,
  "compromise_probability_percent": 0-100,
  "web_vulnerabilities": [
    { "host", "vulnerability", "severity", "remedy" }
  ],
  "privesc_findings": [ ... ],
  "recommendations": [
    { "priority": "IMMEDIATE|MEDIUM|LOW", "issue", "action" }
  ],
  "executive_summary": "...",
  ...
}
```

**Reports generated:**
- `output/report.html` — Formatted HTML with tables and charts
- `output/report.pdf` — Professional PDF with severity distribution pie chart, remediation roadmap

## 6. Troubleshooting

| Issue | Solution |
|-------|----------|
| Tools not found (subfinder, httpx, etc.) | Verify PATH includes `$HOME/go/bin` and `$HOME/.cargo/bin`. Run: `which subfinder` |
| Backend port 5000 in use | `lsof -i :5000` then `kill -9 <PID>` |
| Frontend can't reach backend | Verify `REACT_APP_API_BASE_URL=http://127.0.0.1:5000` in `frontend/.env.local` and backend is running |
| Empty scan results | Confirm target is reachable (ping, port 80/443). Test with `scanme.nmap.org` |
| `npm start` fails | Remove `frontend/node_modules` and re-run `npm install` |

## 7. Answering Examiner Questions

| Question | Answer |
|----------|--------|
| **How does the system work end-to-end?** | User submits domain → Flask API receives scan request → orchestration pipeline runs web scan (subfinder finds subdomains → httpx checks live hosts → nuclei finds vulnerabilities) and local analysis (privilege escalation, services) → risk engine blends web + service risks into 0–10 score → remediation engine maps findings to specific actions using keyword matching → JSON/HTML/PDF reports generated → frontend fetches JSON and renders dashboards with charts and tables. |
| **What is the risk score?** | Overall numeric score (0–10) = 55% service risk + 45% web vulnerability risk. Services scored by exposure + CVE data. Web vulnerabilities scored: CRITICAL=9.5, HIGH=8.0, MEDIUM=5.5, LOW=3.0. Compromise probability = score ÷ 10 × 100. |
| **How are remedies matched?** | Nuclei finding names are normalized (lowercase, spaces preserved) and matched against keyword-based rules. Example: "SSH Weak MAC Algorithms" matches "weak mac" rule → returns "Disable weak MACs…". Fallback: generic hardening message. |
| **What do priorities mean?** | **IMMEDIATE:** CRITICAL/HIGH findings (fix urgently). **MEDIUM:** MEDIUM findings like weak SSH algorithms (fix in next cycle). **LOW:** Low-severity findings (address in roadmap). |
| **How do I test it?** | Run backend and frontend. Submit `scanme.nmap.org` as domain. Expect ~7 web vulnerabilities with specific remedies, pie chart, summary cards in PDF report. |
| **What if tools fail?** | Verify: `which subfinder httpx nuclei nmap feroxbuster`. Ensure `$HOME/go/bin` and `$HOME/.cargo/bin` are in PATH. On Windows, use WSL2. |

---

**Version:** 1.2  
**Last Updated:** March 22, 2026  
**Ready for examiner demo** ✓
