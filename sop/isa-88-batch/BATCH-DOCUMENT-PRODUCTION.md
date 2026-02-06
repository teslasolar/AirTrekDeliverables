# ISA-88 Batch Procedure: Document Production

**Document:** SOP-BATCH-001
**Standard:** ISA-88 S88.01
**Version:** 1.0
**Date:** February 2026

---

## 1. Scope

This procedure defines the batch production model for all AirTrek
deliverables. Every document follows this lifecycle.

---

## 2. State Model

```
             ┌─────────┐
             │  IDLE    │ Document exists in tracker, not started
             └────┬─────┘
                  │ Author claims task
                  ▼
             ┌─────────┐         ┌─────────┐
             │ RUNNING  │◄───────│  HELD    │
             └────┬─────┘        └────┬─────┘
                  │                    ▲
                  │ Blocked ──────────┘
                  │
                  │ Draft complete
                  ▼
             ┌─────────┐
             │ REVIEW   │ Team reviews and provides feedback
             └────┬─────┘
                  │
          ┌───────┼───────┐
          │               │
          ▼               ▼
   ┌──────────┐    ┌──────────┐
   │ REVISE   │    │ APPROVED │
   │ (back to │    │          │
   │  RUNNING)│    └────┬─────┘
   └──────────┘         │
                        ▼
                  ┌──────────┐
                  │ COMPLETE │ Published and active
                  └────┬─────┘
                       │ New version created
                       ▼
                  ┌──────────┐
                  │ ARCHIVED │ Superseded
                  └──────────┘
```

---

## 3. Batch Procedure

```
PROCEDURE: Produce Document
TRIGGER:   Author claims deliverable from Task Tracker
OWNER:     Document Author
TIMEOUT:   Per target date in tracker

UNIT PROCEDURE 1: Initiation
├── OPERATION 1.1: Claim Task
│   ├── [A] Set owner in TASK-TRACKER.md
│   ├── [A] Set target date
│   ├── [S] Status → In Progress
│   └── [T] Continue
│
├── OPERATION 1.2: Check Dependencies
│   ├── [C] All dependencies complete?
│   ├── [E] Not complete → Status → On Hold, wait
│   └── [T] Continue
│
└── OPERATION 1.3: Create Document
    ├── [A] Copy template from category folder
    ├── [A] Fill in document header (ID, version, date)
    ├── [A] Set document status → Draft
    └── [T] Continue

UNIT PROCEDURE 2: Production
├── OPERATION 2.1: Research
│   ├── [A] Gather information from related docs
│   ├── [A] Review control narratives (if applicable)
│   ├── [A] Consult subject matter experts
│   └── [T] Continue
│
├── OPERATION 2.2: Draft
│   ├── [A] Write content following template structure
│   ├── [A] Include plain language summary
│   ├── [A] Add technical details where applicable
│   ├── [A] Reference related documents by SOP ID
│   └── [T] Continue
│
└── OPERATION 2.3: Self-Review
    ├── [C] All template sections completed?
    ├── [C] Plain language summary included?
    ├── [C] References and dependencies correct?
    ├── [E] Missing sections → Complete them
    └── [T] Continue

UNIT PROCEDURE 3: Review
├── OPERATION 3.1: Submit for Review
│   ├── [A] Status → In Review
│   ├── [A] Notify reviewers
│   └── [T] Continue
│
├── OPERATION 3.2: Team Review
│   ├── [A] Reviewers read document
│   ├── [A] Reviewers provide feedback
│   ├── [C] Approved with no changes?
│   │   [T] Yes → Continue to 3.3
│   │   [T] No → Back to UNIT PROCEDURE 2
│   └── [T] Continue
│
└── OPERATION 3.3: Approval
    ├── [A] Approver signs off
    ├── [A] Update revision history
    ├── [S] Document status → Approved
    └── [T] Continue

UNIT PROCEDURE 4: Publication
├── OPERATION 4.1: Finalize
│   ├── [A] Set version number
│   ├── [A] Update SOP-INDEX.md
│   ├── [A] Update TASK-TRACKER.md → Complete
│   └── [T] Continue
│
└── OPERATION 4.2: Notify
    ├── [A] Inform team of new/updated document
    └── [S] Done
```

---

## 4. Quality Checks

Every document must pass these checks before approval:

| Check                          | Required For | Verified By |
|--------------------------------|-------------|-------------|
| Template structure followed    | All         | Author      |
| Plain language summary present | All         | Reviewer    |
| Document ID assigned           | All         | Author      |
| Version and date set           | All         | Author      |
| Dependencies referenced        | All         | Reviewer    |
| Revision history updated       | All         | Author      |
| ISA-88 notation used (if tech) | Technical   | Tech Lead   |
| Control narratives referenced  | Development | Tech Lead   |

---

## 5. Revision History

| Version | Date     | Author       | Changes       |
|---------|----------|--------------|---------------|
| 1.0     | Feb 2026 | AirTrek Team | Initial draft |
