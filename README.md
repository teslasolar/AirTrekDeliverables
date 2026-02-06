# AirTrek Deliverables

**Empathy Through Cultural Exploration**

Enterprise task tracker and deliverable management suite for the AirTrek platform.
ISA-88 / ISA-95 compliant. Built for investors, designers, developers, and operators.

---

## Quick Start

1. Open the task tracker app: `app/index.html`
2. Read the getting started guide: `GETTING-STARTED.md`
3. Browse the master task list: `TASK-TRACKER.md`
4. Review SOP procedures: `sop/SOP-INDEX.md`

---

## Repository Structure

```
AirTrekDeliverables/
├── README.md                  # This file
├── TASK-TRACKER.md            # Master deliverable tracker (markdown)
├── GETTING-STARTED.md         # Guide for non-technical contributors
│
├── app/                       # Enterprise task tracker web application
│   ├── index.html             # Main application entry point
│   ├── css/
│   │   ├── styles.css         # Core application styles
│   │   └── chat.css           # AI chat window styles
│   ├── js/
│   │   ├── app.js             # Dashboard, list, kanban, investor views
│   │   └── chat.js            # WebLLM AI assistant agent
│   └── data/
│       └── deliverables.json  # All deliverable data (56 items)
│
├── deliverables/              # Document library (by category)
│   ├── 01-business-strategy/
│   ├── 02-product-design/
│   ├── 03-technical-architecture/
│   │   ├── ARCHITECTURE.md
│   │   ├── control-narratives/
│   │   │   └── CN-AIRTREK-001.md
│   │   └── TEMPLATE-technical-document.md
│   ├── 04-development/
│   ├── 05-content-cultural/
│   ├── 06-operations/
│   ├── 07-legal-compliance/
│   └── 08-testing-quality/
│
└── sop/                       # Standard Operating Procedures
    ├── SOP-INDEX.md           # Master SOP registry
    ├── isa-88-batch/          # ISA-88 batch management
    │   └── BATCH-DOCUMENT-PRODUCTION.md
    ├── isa-95-enterprise/     # ISA-95 enterprise levels
    │   └── ENTERPRISE-LEVELS.md
    ├── procedures/            # General SOPs
    │   └── SOP-DOCUMENT-CONTROL.md
    └── forms/                 # Templates and checklists
        └── DOCUMENT-CHECKLIST.md
```

---

## Application Features

The web application (`app/index.html`) provides:

- **Dashboard** — Project overview with stats, phases, and category progress
- **List View** — Sortable, filterable table of all 56 deliverables
- **Kanban Board** — Visual board organized by status columns
- **Investor View** — Executive summary with roadmap and KPIs
- **AI Chat** — Project-aware assistant that answers questions about deliverables
- **Detail Panel** — Slide-over panel with full deliverable information

No build tools or dependencies required. Open `app/index.html` in any browser.

---

## Standards

- **ISA-88** (S88.01) — Procedural control model for all control narratives
- **ISA-95** (IEC 62264) — Enterprise integration levels for documentation hierarchy
- **SOP Governance** — All documents follow standard operating procedures

---

## 56 Deliverables Across 8 Categories

| #  | Category                | Items | ISA-95 Level |
|----|-------------------------|-------|-------------|
| 01 | Business & Strategy     | 6     | Level 4     |
| 02 | Product & Design        | 8     | Level 4/3   |
| 03 | Technical Architecture  | 8     | Level 2     |
| 04 | Development             | 12    | Level 3     |
| 05 | Content & Cultural      | 6     | Level 0     |
| 06 | Operations              | 6     | Level 3     |
| 07 | Legal & Compliance      | 5     | Cross-level |
| 08 | Testing & Quality       | 5     | Level 1     |

---

## 4 Project Phases

1. **Foundation** (target Q1 2026) — Business model, strategy, core architecture
2. **Core Build** (target Q2 2026) — Auth, Triad Engine, economy, passport
3. **Experience Layer** (target Q3 2026) — Voice, song, TrekCube, cultural content
4. **Launch Readiness** (target Q4 2026) — Testing, legal, operations, go-to-market
