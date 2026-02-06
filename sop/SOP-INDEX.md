# AirTrek SOP Master Index

**Document:** SOP-AIRTREK-000
**Standard:** ISA-88 / ISA-95 Compliant
**Version:** 1.0
**Date:** February 2026
**Status:** Active

---

## Purpose

All AirTrek documentation is managed under Standard Operating Procedure (SOP)
governance. This index catalogs every SOP and maps it to the ISA-88 procedural
control model and ISA-95 enterprise integration levels.

---

## ISA-88 Document Hierarchy

Documents follow the ISA-88 procedural model:

```
PROGRAM (AirTrek Platform)
  └── PROCEDURE (Category — e.g., Business Strategy)
       └── UNIT PROCEDURE (Deliverable — e.g., Revenue Model)
            └── OPERATION (Section within deliverable)
                 └── PHASE (Step within section)
```

---

## ISA-95 Enterprise Levels

Each SOP maps to an ISA-95 functional level:

| Level | Name                  | AirTrek Mapping              |
|-------|-----------------------|------------------------------|
| 4     | Business Planning     | Business & Strategy (01)     |
| 3     | Manufacturing Ops     | Operations & Development (04, 06) |
| 2     | Control Systems       | Technical Architecture (03)  |
| 1     | Sensing & Actuation   | Testing & Quality (08)       |
| 0     | Physical Process      | Content & Cultural (05)      |

Cross-level: Product Design (02), Legal (07)

---

## SOP Registry

### Level 4 — Business Planning

| SOP ID         | Title                       | Status    | Version |
|----------------|-----------------------------|-----------|---------|
| SOP-BS-001     | Executive Summary           | Pending   | —       |
| SOP-BS-002     | Business Model Canvas       | Pending   | —       |
| SOP-BS-003     | Revenue Model & Pricing     | Pending   | —       |
| SOP-BS-004     | Market Analysis             | Pending   | —       |
| SOP-BS-005     | Go-to-Market Strategy       | Pending   | —       |
| SOP-BS-006     | Financial Projections       | Pending   | —       |

### Level 4/3 — Product Design

| SOP ID         | Title                       | Status    | Version |
|----------------|-----------------------------|-----------|---------|
| SOP-PD-001     | Product Requirements        | Pending   | —       |
| SOP-PD-002     | User Personas               | Pending   | —       |
| SOP-PD-003     | User Journey Maps           | Pending   | —       |
| SOP-PD-004     | Wireframes & Mockups        | Pending   | —       |
| SOP-PD-005     | Brand Guidelines            | Pending   | —       |
| SOP-PD-006     | Trekcoin Economy Design     | Pending   | —       |
| SOP-PD-007     | Empathy (Kappa) System      | Pending   | —       |
| SOP-PD-008     | Character & Persona Bible   | Pending   | —       |

### Level 2 — Technical Architecture

| SOP ID         | Title                       | Status    | Version |
|----------------|-----------------------------|-----------|---------|
| SOP-TA-001     | System Architecture         | Complete  | 1.0     |
| SOP-TA-002     | Control Narratives          | In Progress | 1.0   |
| SOP-TA-003     | API Specification           | Pending   | —       |
| SOP-TA-004     | Database Schema             | Pending   | —       |
| SOP-TA-005     | Security Architecture       | Pending   | —       |
| SOP-TA-006     | Infrastructure Plan         | Pending   | —       |
| SOP-TA-007     | Integration Map             | Pending   | —       |
| SOP-TA-008     | Tag Hierarchy (ISA-95)      | Pending   | —       |

### Level 3 — Development

| SOP ID         | Title                       | Status    | Version |
|----------------|-----------------------------|-----------|---------|
| SOP-DEV-001    | Project Scaffolding         | Pending   | —       |
| SOP-DEV-002    | Authentication Service      | Pending   | —       |
| SOP-DEV-003    | Triad Engine                | Pending   | —       |
| SOP-DEV-004    | Voice Service               | Pending   | —       |
| SOP-DEV-005    | Song Service                | Pending   | —       |
| SOP-DEV-006    | Passport Service            | Pending   | —       |
| SOP-DEV-007    | Economy Service             | Pending   | —       |
| SOP-DEV-008    | TrekCube                    | Pending   | —       |
| SOP-DEV-009    | Compost (Wisdom DAO)        | Pending   | —       |
| SOP-DEV-010    | Cultural Packs Service      | Pending   | —       |
| SOP-DEV-011    | Web Application             | Pending   | —       |
| SOP-DEV-012    | Admin Dashboard             | Pending   | —       |

### Level 0 — Content & Cultural

| SOP ID         | Title                       | Status    | Version |
|----------------|-----------------------------|-----------|---------|
| SOP-CC-001     | Destination Library         | Pending   | —       |
| SOP-CC-002     | Character Catalog           | Pending   | —       |
| SOP-CC-003     | Cultural Pack: Japan        | Pending   | —       |
| SOP-CC-004     | Conversation Starters       | Pending   | —       |
| SOP-CC-005     | Educational Content         | Pending   | —       |
| SOP-CC-006     | Milestone Definitions       | Pending   | —       |

### Level 3 — Operations

| SOP ID         | Title                       | Status    | Version |
|----------------|-----------------------------|-----------|---------|
| SOP-OPS-001    | Deployment Runbook          | Pending   | —       |
| SOP-OPS-002    | Monitoring & Alerting       | Pending   | —       |
| SOP-OPS-003    | Maintenance Procedures      | Pending   | —       |
| SOP-OPS-004    | Backup & Recovery           | Pending   | —       |
| SOP-OPS-005    | Incident Response           | Pending   | —       |
| SOP-OPS-006    | On-Call Rotation            | Pending   | —       |

### Cross-Level — Legal & Compliance

| SOP ID         | Title                       | Status    | Version |
|----------------|-----------------------------|-----------|---------|
| SOP-LC-001     | Terms of Service            | Pending   | —       |
| SOP-LC-002     | Privacy Policy              | Pending   | —       |
| SOP-LC-003     | Content Policy              | Pending   | —       |
| SOP-LC-004     | Data Handling & Retention   | Pending   | —       |
| SOP-LC-005     | AI Ethics Guidelines        | Pending   | —       |

### Level 1 — Testing & Quality

| SOP ID         | Title                       | Status    | Version |
|----------------|-----------------------------|-----------|---------|
| SOP-QA-001     | Test Strategy               | Pending   | —       |
| SOP-QA-002     | API Test Suite              | Pending   | —       |
| SOP-QA-003     | Load & Performance Tests    | Pending   | —       |
| SOP-QA-004     | User Acceptance Testing     | Pending   | —       |
| SOP-QA-005     | Security Audit Checklist    | Pending   | —       |

---

## Batch Management (ISA-88)

All documentation creation follows a batch production model:

```
BATCH: Document Production
STATE MODEL:
  IDLE → RUNNING → COMPLETE → ARCHIVED

TRANSITIONS:
  IDLE → RUNNING:     Author claims deliverable, begins draft
  RUNNING → HELD:     Blocked by dependency or question
  HELD → RUNNING:     Blocker resolved, work resumes
  RUNNING → COMPLETE: Draft finished, passes review
  COMPLETE → ARCHIVED: Superseded by newer version
```

See `sop/isa-88-batch/` for batch management procedures.
See `sop/isa-95-enterprise/` for enterprise integration specs.

---

## Revision History

| Version | Date     | Author       | Changes       |
|---------|----------|--------------|---------------|
| 1.0     | Feb 2026 | AirTrek Team | Initial index |
