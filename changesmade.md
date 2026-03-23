## 🧩 Recent Integration Changes

This section summarizes what was integrated between frontend and backend in the latest iteration.

- Added stable frontend to backend flow:
	- Dashboard triggers scans using `POST /api/scan` (JSON body).
	- After scan completion, frontend refreshes data from `GET /api/report/json`.
- Improved scan pipeline reliability:
	- Nuclei wrapper behavior was stabilized to avoid empty-result runs caused by timeout/exec handling issues.
	- End-to-end scan output now consistently surfaces real findings in generated reports.
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
	- Empty-state handling was improved so missing sections are explicit instead of silently blank.
- Added floating AI assistant integration (frontend + backend):
	- Frontend widget integrated into User Dashboard for interactive scan-aware Q&A.
	- API client extended with `POST /api/assistant/chat` and `GET /api/assistant/status`.
	- Backend assistant engine added to process prompts using latest `output/recon.json` context.
- Added fine-tuned model support in assistant engine:
	- Supports loading from `ASSISTANT_MODEL_DIR` or `ASSISTANT_MODEL_ZIP`.
	- Supports LoRA adapters with base-model flow via `ASSISTANT_BASE_MODEL`.
	- Added backend model warm-up and explicit assistant status states (`loading`, `ready`, `fallback`).
- Assistant responsiveness and UX hardening:
	- Added deterministic fast responses for common user intents (greeting, risk score, top findings, remediation).
	- Added response post-processing to reduce noisy/incomplete outputs.
	- Status polling tuned in frontend to reduce noisy repeated backend calls.
	- GET header behavior adjusted to reduce unnecessary preflight overhead on status/report fetches.
 