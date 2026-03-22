# 🛡 ReconPlus
 
**Automated Security Reconnaissance & Risk Assessment Framework**
 
ReconPlus is an automated security reconnaissance and vulnerability assessment framework designed to identify system-level exposures, web application vulnerabilities, and potential attack paths.
 
The framework combines reconnaissance, network scanning, web vulnerability detection, privilege escalation analysis, and intelligent risk scoring to provide a complete security overview of a target environment.
 
ReconPlus helps administrators, developers, and security researchers detect security weaknesses before attackers can exploit them.
 
The system produces structured reports with actionable remediation recommendations, making it easier for both technical and non-technical users to understand and fix security issues.
 
---
 
## 🎯 Objectives
 
ReconPlus helps security teams understand:
 
- Attack surface exposure
- Potential compromise paths
- Security misconfigurations
- Service exposure risks
- Vulnerability prioritization
 
---
 
## 🚀 Key Features
 
| Feature | Description |
|---|---|
| 🔎 **Subdomain Enumeration** | Discover hidden subdomains and expand attack surface |
| 🌐 **Live Host Detection** | Identify active hosts and web services |
| 🧠 **Technology Fingerprinting** | Detect frameworks, servers, and technologies used |
| 📂 **Directory & Endpoint Discovery** | Find hidden paths, APIs, and resources |
| 🧨 **Web Vulnerability Scanning** | Detect common vulnerabilities like SQLi and XSS |
| 🖥 **Device Service Exposure Analysis** | Identify open ports and exposed services |
| 🔐 **Privilege Escalation Detection** | Analyze host system for escalation risks |
| 📊 **Risk Scoring Engine** | Prioritize vulnerabilities based on severity |
| 🛠 **Automated Remediation Suggestions** | Provide security fix recommendations |
| 📑 **Multi-Format Reports** | Generate reports in JSON, HTML, and PDF |
| 🌍 **Web Dashboard** | User-friendly interface to launch and monitor scans |
 
---
 
## 🔍 Security Assessment Modules
 
### 1️⃣ Device Security Scanning
 
ReconPlus analyzes the host system for exposed or insecure services.
 
**Example Services Detected:**
 
- Redis
- PostgreSQL
- DNS
- SSH
- FTP
 
**Security Checks:**
 
- Open ports
- Service exposure level
- Risk scoring
- Possible attack paths
 
### 2️⃣ Web Application Vulnerability Scanning
 
ReconPlus scans web applications for common security vulnerabilities.
 
**Example Vulnerabilities Detected:**
 
- SQL Injection (SQLi)
- Cross-Site Scripting (XSS)
- Directory Traversal
- Security Misconfigurations
- Hidden Endpoints / APIs
 
---
 
## 🧰 Integrated Security Tools
 
ReconPlus integrates several industry-standard open-source security tools to perform different stages of scanning.
 
| Tool | Purpose |
|---|---|
| **Amass** | Subdomain enumeration |
| **Subfinder** | Passive subdomain discovery |
| **HTTPX** | Live host and web service detection |
| **Wappalyzer** | Technology fingerprinting |
| **Nmap** | Network scanning and service detection |
| **Feroxbuster** | Directory and endpoint discovery |
| **Nuclei** | Template-based vulnerability scanning |
 
These tools work together to provide a comprehensive reconnaissance and vulnerability assessment pipeline.
 
---
 
## ⚙️ How ReconPlus Works
 
The workflow of ReconPlus follows a structured security scanning pipeline.
 
**1️⃣ Target Input**
The user enters a target domain through the web dashboard.
 
**2️⃣ Reconnaissance**
The system performs subdomain enumeration and identifies live hosts.
 
**3️⃣ Network Scanning**
ReconPlus performs port scanning to detect exposed services running on the target.
 
**4️⃣ Technology Analysis**
The system fingerprints web technologies and frameworks used by the target.
 
**5️⃣ Directory Discovery**
Hidden directories, APIs, and endpoints are discovered.
 
**6️⃣ Vulnerability Detection**
The framework scans for known vulnerabilities and security misconfigurations.
 
**7️⃣ Privilege Escalation Checks**
ReconPlus analyzes the local environment for potential privilege escalation risks.
 
**8️⃣ Risk Analysis**
A risk scoring engine evaluates:
 
- Severity
- Exploitability
- Potential impact
 
**9️⃣ Report Generation**
ReconPlus generates detailed reports containing:
 
- Vulnerability descriptions
- Severity levels
- Attack surface insights
- Recommended remediation steps
 
**Outputs:**
 
- `output/recon.json` — full machine-readable results
- `output/report.html` — HTML report
- `output/report.pdf` — PDF report
 
---
 
## 📁 Project Layout
 
```
app.py          Flask server and API backend
main.py         Orchestrates the scan pipeline
core/           Scan, scoring, risk analysis, reporting
modules/        External tool wrappers (subfinder, httpx, nuclei)
templates/      Legacy Flask HTML page
output/         Generated reports (created at runtime)
frontend/       React + Firebase frontend app
```
 
---
 
## 📋 Requirements
 
### Python
 
- Python 3.10+ recommended
- `pip` and `venv`
- Python packages: install from `requirements.txt`
- `reportlab` is required for PDF generation (already listed in `requirements.txt`)
 
### System Tools (external binaries)
 
- `subfinder` — subdomain discovery
- `httpx` — live host checking
- `nuclei` — vulnerability scanning
 
### Linux-only Utilities
 
- `ss` — service enumeration
- `ip` — network interface discovery
 
> If you are on macOS or Windows, use WSL2 or a Linux VM to avoid missing `ss` and `ip`.
 
---
 
## 🐧 Install Steps (Linux / WSL)
 
**1. Create a virtual environment and install Python deps:**
 
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
 
**2. Install external recon tools (Go required):**
 
```bash
go version
go env GOPATH
go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
go install github.com/projectdiscovery/httpx/cmd/httpx@latest
go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
echo 'export PATH="$PATH:$HOME/go/bin"' >> ~/.bashrc
source ~/.bashrc
which subfinder
which httpx
which nuclei
```
 
**3. Ensure the Go bin path is on `PATH`:**
 
```bash
export PATH="$PATH:$HOME/go/bin"
```
 
---
 
## 🍎 Install Steps (macOS)
 
macOS is not fully supported for local service enumeration because the code uses `ss` and `ip`. For a smooth setup:
 
- Use WSL2 or a Linux VM, then follow the Linux steps above.
 
If you still want to run on macOS, you can run the web recon parts, but the local service enumeration and network info may fail.
 
---
 
## 🪟 Install Steps (Windows)
 
Windows is not fully supported for local service enumeration in native PowerShell or CMD. The easiest path is WSL2 (Windows Subsystem for Linux) with Ubuntu.
 
**Step-by-step (Windows 10/11):**
 
1. Open PowerShell as Administrator and run:
 
```powershell
wsl --install
```
OR
```powershell
wsl --list --online
wsl --install -d Ubuntu
```

2. Restart your PC when prompted.
 
3. Open the new "Ubuntu" app from the Start menu and create a username and password.
 
4. In the Ubuntu window, run:
 
```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip git golang-go
```
 
5. Go to the project folder (example):
 
```bash
cd /mnt/c/Users/YourWindowsUsername/path/to/reconplus-main
```
 
6. Follow the Linux steps above inside the Ubuntu window.
 
---
 
## 🔑 NVD API Key
 
This project uses the NVD API to enrich services with CVE data. The API key is stored in `config.py` as `NVD_API_KEY`.
 
Update this value before running scans:
 
```python
NVD_API_KEY = "YOUR_NVD_API_KEY"
```
 
---
 
## ▶️ Running the Project
 
### Backend API (Flask)
 
Start the Flask server:
 
```bash
python3 app.py
```
 
Then open: `http://127.0.0.1:5000`
 
The web UI accepts a domain and triggers a full scan. The server returns `output/report.pdf` as a download.

### Frontend UI (React + Firebase)

In a second terminal, run the frontend from the integrated folder:

```bash
cd frontend
npm install
npm start
```

The React app starts at `http://127.0.0.1:3000` and calls backend APIs on `http://127.0.0.1:5000`.

Create `frontend/.env.local` with your Firebase keys and backend URL:

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
 
## 🔧 Configuration and Behavior
 
- Output folder is `output/` and is created automatically.
- Scans are blocking and can take time depending on target size.
- The scanner depends on external binaries; if those tools are missing, the scan will return empty results for that phase.
 
---
 
## 📊 Report Output
 
ReconPlus generates reports in multiple formats:
 
- **JSON** — Machine-readable data
- **HTML** — Interactive web report
- **PDF** — Printable security report
 
**Reports include:**
 
- Detected vulnerabilities
- Risk severity levels
- Attack surface analysis
- Security recommendations
 
---
 
## ⚠️ Disclaimer
 
ReconPlus is intended strictly for **educational purposes** and **authorized security testing**.
 
Unauthorized scanning of systems without proper permission may violate legal and ethical guidelines.
 
Users are responsible for ensuring they have explicit authorization before performing any security assessments.
