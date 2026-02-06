# SOP: Document Control Procedure

**Document:** SOP-PROC-001
**Version:** 1.0
**Date:** February 2026
**Status:** Active

---

## 1. Purpose

Defines how all AirTrek documents are created, reviewed,
approved, versioned, and archived.

---

## 2. Document Identification

Every document receives a unique ID:

```
[PREFIX]-AIRTREK-[NUMBER]

Prefixes:
  BS   = Business Strategy
  PD   = Product Design
  TA   = Technical Architecture
  CN   = Control Narrative
  DEV  = Development
  CC   = Content & Cultural
  OPS  = Operations
  LC   = Legal & Compliance
  QA   = Quality Assurance
  SOP  = Standard Operating Procedure
  ARCH = Architecture
```

---

## 3. Version Numbering

```
Major.Minor

Major: Significant content change or structural revision
Minor: Corrections, clarifications, small additions

Examples:
  0.1 = Initial draft
  0.2 = Revised draft
  1.0 = First approved release
  1.1 = Minor correction
  2.0 = Major revision
```

---

## 4. Document Header (Required)

Every document must include:

```
Title
Document ID
Version
Date
Status: Draft | In Review | Approved | Active | Archived
Owner (author)
Standard (if applicable): ISA-88, ISA-95, etc.
```

---

## 5. Review & Approval

| Document Type    | Reviewer       | Approver         |
|-----------------|----------------|------------------|
| Business (01)    | Leadership     | CEO/Founder      |
| Product (02)     | Product Lead   | Product Lead     |
| Technical (03)   | Tech Lead      | Engineering Lead |
| Development (04) | Tech Lead      | Engineering Lead |
| Content (05)     | Content Lead   | Product Lead     |
| Operations (06)  | Ops Lead       | Engineering Lead |
| Legal (07)       | Legal Counsel  | CEO/Founder      |
| Testing (08)     | QA Lead        | Engineering Lead |

---

## 6. Storage

```
AirTrekDeliverables/
├── deliverables/      # Completed deliverable documents
│   └── [category]/    # Organized by numbered category
├── sop/               # Standard operating procedures
│   ├── isa-88-batch/  # Batch management procedures
│   ├── isa-95-enterprise/ # Enterprise level definitions
│   ├── procedures/    # General SOPs
│   └── forms/         # Templates and forms
└── app/               # Task tracker application
```

---

## 7. Retention

| Status    | Retention            |
|-----------|----------------------|
| Active    | Indefinite           |
| Archived  | 2 years minimum      |
| Draft     | Until approved or abandoned |

---

## 8. Revision History

| Version | Date     | Author       | Changes       |
|---------|----------|--------------|---------------|
| 1.0     | Feb 2026 | AirTrek Team | Initial draft |
