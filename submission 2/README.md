# AutoTraQ — CS 490 Capstone Submission

**University of Northern Colorado · Spring 2026**

This folder contains every deliverable for the AutoTraQ capstone, organized for review. All documents are in PDF format.

The actual source code lives one level up in `../backend/` and `../frontend/`. The deployed application is at **https://cs490unco.org**.

---

## Folder Map

### `01-pitch/`
The sales / industry-facing pitch material.

| File | What it is |
|------|-----------|
| `AutoTraQ-Slide-Deck.pdf` | The 14-slide AutoTraQ pitch deck — problem, solution, market opportunity, pricing, roadmap, team. **(Primary)** |
| `AutoTraQ-Feature-Showcase.pdf` | Feature-focused walkthrough deck — every capability of AutoTraQ presented in a visual showcase format. |
| `AutoTraQ-Feature-List.pdf` | Comprehensive written feature list — one-sentence pitch, core selling points, and feature breakdown by category. |
| `AutoTrack-v1-Pitch-Deck.pdf` | The earlier "AutoTrack" version of the pitch deck (older branding, January 2026). Kept to show project evolution. |

### `02-project-plan/`
The original capstone scope and plan.

| File | What it is |
|------|-----------|
| `AutoTraQ-Project-Plan.pdf` | Original CS 490 project plan — what AutoTraQ is, core capabilities, modules, milestones. |

### `03-per-module-writeups/`
Narrative explanations of each subsystem, written for non-technical readers.

| File | What it is |
|------|-----------|
| `AutoTraQ-Frontend.pdf` | How the React + Vite + TypeScript frontend works. |
| `AutoTraQ-Backend.pdf` | How the Express + TypeScript + Prisma backend works. |
| `AutoTraQ-Database.pdf` | The MySQL schema, Prisma models, and data model decisions. |
| `AutoTraQ-Charts.pdf` | The Recharts-based dashboard and data visualizations. |

### `04-cheatsheets/`
Per-team-member quick-reference / talking-points sheets, used during demos.

| File | Owner |
|------|-------|
| `Frontend-Ben.pdf` | Ben Scarlett — frontend |
| `Backend-Gus.pdf` | Agustus Allred — backend |
| `Database-Dean.pdf` | Dean Carothers — database |
| `Charts-Fatima.pdf` | Fatima Cortez — charts / visualizations |

### `05-testing/`
QA artifacts — both the test plans and the actual completed reports.

#### `05-testing/plans/`
Per-module manual test checklists (the QA scripts each tester worked through).

| File | Owner | Tasks |
|------|-------|-------|
| `Frontend-Ben.pdf` | Ben | 103 |
| `Backend-Gus.pdf` | Gus | 95 |
| `Database-Dean.pdf` | Dean | 92 |
| `Charts-Fatima.pdf` | Fatima | 100 |

#### `05-testing/reports/`
The actual completed test results.

| File | What it is |
|------|-----------|
| `Backend-Test-Report-Gus.pdf` | Gus's backend API test report (76 tests, 60 pass / 15 fail / 1 warning). |
| `Database-Test-Suite-Dean.pdf` | Dean's full QA workbook — 10 test suites covering Parts, Vehicles, Inventory, Requests, Users, Relational, Querying, Persistence, Audits, and Edge Cases. |
| `Database-Test-Suite-Dean-Parts.pdf` | Print-friendly extract of the Parts test suite from Dean's workbook. |

### `06-development-process/`
Production-readiness analysis, incident reports, and the running progress tracker.

| File | What it is |
|------|-----------|
| `Production-Readiness-Analysis.pdf` | Pre-MVP audit (Feb 1, 2026) — issues found, fix priority, recommended phases. |
| `Development-Incident-Report.pdf` | Detailed log of dev incidents and how they were resolved (process retrospective). |
| `Backend-Incident-Report.pdf` | Backend-focused subset of the incident report. |
| `Phase-Tracker.pdf` | The phase-by-phase TODO/progress tracker — what was built, what's deferred. |

### `07-api-reference/`

| File | What it is |
|------|-----------|
| `API-Reference.pdf` | Full REST API reference — every endpoint, request/response shape, role requirements. |

### `08-deployment/`

| File | What it is |
|------|-----------|
| `Railway-Deployment-Guide.pdf` | Step-by-step Railway deployment guide — backend, frontend, MySQL, environment variables. |

### `09-client-onboarding/`

| File | What it is |
|------|-----------|
| `Client-Onboarding-Guide.pdf` | Step-by-step guide for introducing AutoTraQ to a new client as a hosted web application — production checks, admin account setup, user training, support handoff. |

---

## Source Code

The full source code is in the parent directory of this folder:

- `../backend/` — Express + TypeScript + Prisma API server
- `../frontend/` — React + Vite + TypeScript single-page app

Both are deployed to Railway and reachable at **https://cs490unco.org**.

To run locally, see the project root `README.md` and the deployment guide above.

---

## Team

- **Anson Cordeiro** — Lead developer & architect (full-stack)
- **Agustus Allred** — Backend developer
- **Ben Scarlett** — Frontend developer
- **Dean Carothers** — Database & DevOps
- **Fatima Cortez** — Frontend & data visualization
