# ISA-95 Enterprise Integration Levels

**Document:** SOP-ISA95-001
**Standard:** ISA-95 / IEC 62264
**Version:** 1.0
**Date:** February 2026

---

## 1. Overview

AirTrek maps its documentation and operational hierarchy to
ISA-95 enterprise integration levels. This ensures consistent
organization from business strategy down to testing.

---

## 2. Level Mapping

```
LEVEL 4: Business Planning & Logistics
┌─────────────────────────────────────────┐
│  Business Strategy (01)                 │
│  Financial Projections                  │
│  Market Analysis                        │
│  Revenue Model                          │
│                                         │
│  Decisions: What to build, for whom,    │
│  how to fund it                         │
└─────────────────────┬───────────────────┘
                      │
LEVEL 3: Manufacturing Operations Management
┌─────────────────────┴───────────────────┐
│  Product Design (02)                    │
│  Development (04)                       │
│  Operations (06)                        │
│                                         │
│  Decisions: How to build it, how to     │
│  run it, how to maintain it             │
└─────────────────────┬───────────────────┘
                      │
LEVEL 2: Control Systems
┌─────────────────────┴───────────────────┐
│  Technical Architecture (03)            │
│  Control Narratives (ISA-88)            │
│  API Specifications                     │
│  Database Schema                        │
│                                         │
│  Decisions: System structure, data      │
│  flow, automated procedures             │
└─────────────────────┬───────────────────┘
                      │
LEVEL 1: Sensing & Actuation
┌─────────────────────┴───────────────────┐
│  Testing & Quality (08)                 │
│  Monitoring & Alerting                  │
│  Performance Benchmarks                 │
│                                         │
│  Decisions: Is it working? How well?    │
│  What needs attention?                  │
└─────────────────────┬───────────────────┘
                      │
LEVEL 0: Physical Process
┌─────────────────────┴───────────────────┐
│  Content & Cultural (05)                │
│  Characters, Destinations               │
│  Cultural Packs                         │
│                                         │
│  The actual "product" — the content     │
│  users interact with                    │
└─────────────────────────────────────────┘

CROSS-LEVEL:
  Legal & Compliance (07) — Governs all levels
```

---

## 3. Data Exchange Between Levels

| From    | To      | Data Exchanged                    |
|---------|---------|-----------------------------------|
| Level 4 | Level 3 | Requirements, priorities, budget  |
| Level 3 | Level 2 | Feature specs, service designs    |
| Level 2 | Level 1 | Test criteria, monitoring config  |
| Level 1 | Level 0 | Quality gates, content standards  |
| Level 0 | Level 1 | Content metrics, usage data       |
| Level 1 | Level 2 | Test results, alerts              |
| Level 2 | Level 3 | System state, performance data    |
| Level 3 | Level 4 | Progress reports, KPIs            |

---

## 4. Tag Namespace by Level

```
AirTrek/
├── L4_Business/
│   ├── Revenue/
│   ├── Users/
│   └── Growth/
├── L3_Operations/
│   ├── Services/
│   ├── Jobs/
│   └── Deployments/
├── L2_Control/
│   ├── Gateway/
│   ├── Routing/
│   └── BatchControl/
├── L1_Monitoring/
│   ├── Metrics/
│   ├── Alarms/
│   └── Tests/
└── L0_Content/
    ├── Destinations/
    ├── Characters/
    └── CulturalPacks/
```

---

## 5. Revision History

| Version | Date     | Author       | Changes       |
|---------|----------|--------------|---------------|
| 1.0     | Feb 2026 | AirTrek Team | Initial draft |
