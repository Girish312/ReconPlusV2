# ReconPlus Architecture Diagram Source

This file contains a Mermaid diagram that matches the current codebase structure and runtime flow.

## Legend

- Solid arrow: primary data flow
- Dashed arrow: optional or external dependency
- Output nodes: generated artifacts in `output/`

## Mermaid

```mermaid
flowchart LR
  %% =========================
  %% LAYER 1: UI
  %% =========================
  subgraph L1[1. User Interface Layer - React + Firebase Frontend]
    U[User / Security Analyst]
    DASH[User Dashboard<br/>(overview, tools, history)]
    FORM[Target Input Form<br/>(domain submission)]
    ASSISTW[Floating AI Assistant Widget]
    FIRE[Firebase Auth + Firestore<br/>(user accounts + scan history)]
  end

  %% =========================
  %% LAYER 2: API + ORCHESTRATION
  %% =========================
  subgraph L2[2. Backend API and Orchestration Layer - Flask]
    API[Flask API - app.py<br/>/api/scan<br/>/api/scan/status<br/>/api/report/json<br/>/api/report/pdf<br/>/api/assistant/chat<br/>/api/assistant/status]
    STAT[Scan Status Manager<br/>(in-memory state + progress)]
    WORKER[Background Scan Worker Thread]
    MAIN[Pipeline Orchestrator - main.py]
  end

  %% =========================
  %% LAYER 3: RECON + VULN ENGINE
  %% =========================
  subgraph L3[3. Recon and Vulnerability Engine Layer]
    NORM[Target Normalization]
    SUB[Subdomain Enumeration<br/>(Subfinder + Amass)]
    LIVE[Live Host Detection<br/>(HTTPX)]
    WEB[Web Vulnerability Scanning<br/>(Nuclei)]
    DIR[Directory Discovery<br/>(Feroxbuster)]
    SVC[Local Service Enumeration<br/>(core/service_enum.py + ss)]
    CLEAN[Service Deduplication<br/>(core/data_cleaner.py)]
    CVE[CVE Enrichment<br/>(core/cve_enricher.py + core/cve_fetcher.py)]
    EXP[Exposure Classification<br/>(core/exposure_classifier.py)]
    DOCK[Docker Port Binding Inspection<br/>(core/docker_inspector.py)]
    ADJ[Risk Adjustment<br/>(core/risk_adjuster.py)]
    PR[Privilege Escalation Analysis<br/>(core/privesc/privesc_engine.py)]
    PRCHECKS[Sudo, SUID, Writable Paths, Docker Group,<br/>Cron, Env Hijack, Kernel Surface]
    CHAIN[Attack Chain Builder<br/>(core/attack_chain/chain_builder.py)]
    MITRE[MITRE ATT&CK Mapping<br/>(core/mitre/attack_mapper.py)]
    ESC[Chain-Based Risk Escalation<br/>(core/risk/chain_escalator.py)]
  end

  %% =========================
  %% LAYER 4: RISK + REPORTING
  %% =========================
  subgraph L4[4. Risk Intelligence and Reporting Layer]
    SCORE[Risk Scoring Engine<br/>(core/scoring/cvss_engine.py)]
    ANA[Risk Summary<br/>(core/risk_analyzer.py)]
    REC[Automated Remediation<br/>(core/remediation/recommendations.py)]
    SUM[Executive Summary<br/>(core/executive/summary.py)]
    HTML[HTML Report Generator<br/>(core/reporting/html_report.py)]
    PDF[PDF Report Generator<br/>(core/reporting/pdf_report.py)]
  end

  %% =========================
  %% LAYER 5: STORAGE + EXTERNAL SERVICES
  %% =========================
  subgraph L5[5. Storage and External Services]
    OUT[(output/recon.json)]
    OUTHTML[(output/report.html)]
    OUTPDF[(output/report.pdf)]
    MODEL[Assistant Model Storage<br/>(local dir or ZIP via env vars)]
    NVD[(NVD API<br/>CVE data)]
    WSL[Linux / WSL Tool Runtime<br/>ss, ip, sudo, docker, nuclei, httpx, subfinder, amass, feroxbuster]
  end

  %% =========================
  %% FRONTEND FLOW
  %% =========================
  U --> DASH
  DASH --> FORM
  DASH --> ASSISTW
  DASH -->|scan history| FIRE
  FORM -->|POST /api/scan| API
  DASH -->|GET /api/scan/status| API
  DASH -->|GET /api/report/json| API
  DASH -->|GET /api/report/pdf| API
  ASSISTW -->|POST /api/assistant/chat| API

  %% =========================
  %% API FLOW
  %% =========================
  API --> STAT
  API --> WORKER
  WORKER --> MAIN
  API -->|GET /api/assistant/status| ASSIST_ENGINE

  %% =========================
  %% PIPELINE FLOW
  %% =========================
  MAIN --> NORM
  NORM --> SUB --> LIVE --> WEB --> DIR
  MAIN --> SVC --> CLEAN --> CVE --> EXP --> ADJ
  EXP --> DOCK
  ADJ --> PR --> PRCHECKS --> CHAIN --> MITRE --> ESC

  MAIN --> SCORE
  MAIN --> ANA
  MAIN --> REC
  MAIN --> SUM
  MAIN --> HTML
  MAIN --> PDF

  WEB --> REC
  PR --> REC
  CHAIN --> REC

  %% =========================
  %% OUTPUTS
  %% =========================
  MAIN --> OUT
  HTML --> OUTHTML
  PDF --> OUTPDF
  OUT --> API
  OUTHTML --> API
  OUTPDF --> API
  OUT --> ASSIST_ENGINE

  %% =========================
  %% ASSISTANT
  %% =========================
  subgraph ASSIST_LAYER[AI Assistant Layer - Hybrid]
    ASSIST_ENGINE[core/assistant/assistant_engine.py<br/>Rule-based router + optional model generation]
  end
  ASSIST_ENGINE --> MODEL
  ASSIST_ENGINE --> OUT

  %% =========================
  %% EXTERNAL DEPENDENCIES
  %% =========================
  CVE -.-> NVD
  MODEL -.-> ASSIST_ENGINE
  WSL -.-> SUB
  WSL -.-> LIVE
  WSL -.-> WEB
  WSL -.-> DIR
  WSL -.-> SVC
  WSL -.-> PR
  FIRE -.-> DASH
```

## Notes for Designers

- Keep the recon engine as a sequential pipeline, not a single opaque box.
- The assistant should be shown as reading the latest report context from `output/recon.json`, not from the NVD API directly.
- Firestore is only for frontend user/account and scan-history persistence.
- The main generated artifacts are `output/recon.json`, `output/report.html`, and `output/report.pdf`.
- If using an image generator, prefer a 16:9 canvas with a layered, executive-style security theme.