## 🧩 Recent Integration Changes

This section summarizes what was integrated between frontend and backend in the latest iteration.

- Added stable frontend to backend flow:
	- Dashboard triggers scans using `POST /api/scan` (JSON body).
	- After scan completion, frontend refreshes data from `GET /api/report/json`.
- Updated dashboard data behavior:
	- Risk cards and chart now read correct severity counts from `risk_summary`.
	- Security scan progress bar now updates dynamically during scan execution.
- Updated backend scoring and summary behavior:
	- `risk_summary` includes web vulnerability severities.
	- Overall numeric score now reflects both service posture and web findings.
- Improved remediation mapping:
	- `core/remediation/remedy_engine.py` now uses keyword-based matching for nuclei finding names.
	- Findings such as Terrapin/weak SSH crypto now receive specific remedies instead of generic fallback text.
- Expanded roadmap recommendations:
	- Web findings priorities mapped as: `CRITICAL/HIGH -> IMMEDIATE`, `MEDIUM -> MEDIUM`.
- Report generation improvements:
	- HTML report now includes executive summary, risk summary, and website vulnerability findings.
	- PDF report layout improved for vulnerability and roadmap readability.
	- PDF download endpoint disables caching and serves timestamped filenames to avoid stale file downloads.
 