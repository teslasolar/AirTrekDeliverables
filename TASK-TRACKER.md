# AIRTREK Business Plan Task Tracker

> **What is this?** This is the master list of everything that needs to get done to build
> and launch AirTrek. Each item is a "deliverable" — a document, design, or piece of work
> that moves the project forward. You don't need to be technical to use this tracker.

> **How to use it:** Check the status of each item. Pick up tasks marked "Not Started."
> When you begin work, change the status to "In Progress." When done, mark it "Complete"
> and note the date.

---

## Status Key

| Symbol | Meaning         | What it means for you                              |
|--------|-----------------|-----------------------------------------------------|
| :x:    | **Not Started** | Nobody has begun this yet — available to pick up     |
| :construction: | **In Progress** | Someone is actively working on this          |
| :white_check_mark: | **Complete** | Done and ready for review                   |
| :pause_button: | **On Hold**    | Waiting on something else before we can continue |
| :eyes: | **In Review**   | Finished draft, needs team review and approval       |

---

## Quick Summary

| Category                  | Total | Not Started | In Progress | Complete |
|---------------------------|-------|-------------|-------------|----------|
| 1. Business & Strategy    | 6     | 6           | 0           | 0        |
| 2. Product & Design       | 8     | 8           | 0           | 0        |
| 3. Technical Architecture | 8     | 6           | 1           | 1        |
| 4. Development            | 12    | 12          | 0           | 0        |
| 5. Content & Cultural     | 6     | 6           | 0           | 0        |
| 6. Operations             | 6     | 6           | 0           | 0        |
| 7. Legal & Compliance     | 5     | 5           | 0           | 0        |
| 8. Testing & Quality      | 5     | 5           | 0           | 0        |
| **TOTAL**                 | **56**| **54**      | **1**       | **1**    |

---

## 1. Business & Strategy

> These are the foundational documents that explain *what* AirTrek is, *who* it's for,
> and *how* it makes money.

| #   | Deliverable                  | Status | Owner | Target Date | Notes |
|-----|------------------------------|--------|-------|-------------|-------|
| 1.1 | Executive Summary            | :x: Not Started | — | — | One-page overview of AirTrek for investors and partners |
| 1.2 | Business Model Canvas        | :x: Not Started | — | — | Visual map of how AirTrek creates and delivers value |
| 1.3 | Revenue Model & Pricing Tiers| :x: Not Started | — | — | Free / Explorer / Voyager / Patron tier pricing and what each includes |
| 1.4 | Market Analysis              | :x: Not Started | — | — | Who are our competitors? What's the market size? |
| 1.5 | Go-to-Market Strategy        | :x: Not Started | — | — | How we launch: marketing channels, partnerships, timeline |
| 1.6 | Financial Projections        | :x: Not Started | — | — | Revenue, costs, and break-even estimates for Years 1-3 |

**Folder:** `deliverables/01-business-strategy/`

---

## 2. Product & Design

> These define *what the user experiences* — the screens they see, the flows they follow,
> and the brand they recognize.

| #   | Deliverable                  | Status | Owner | Target Date | Notes |
|-----|------------------------------|--------|-------|-------------|-------|
| 2.1 | Product Requirements Doc (PRD) | :x: Not Started | — | — | Full feature list with priorities (must-have vs. nice-to-have) |
| 2.2 | User Personas                | :x: Not Started | — | — | Profiles of our target users (travelers, educators, culture lovers) |
| 2.3 | User Journey Maps            | :x: Not Started | — | — | Step-by-step flows: sign up → first conversation → earning Trekcoin |
| 2.4 | Wireframes & Mockups         | :x: Not Started | — | — | Screen designs for web app, mobile views, admin dashboard |
| 2.5 | Brand Guidelines             | :x: Not Started | — | — | Logo, colors, fonts, tone of voice, visual style |
| 2.6 | Trekcoin Economy Design      | :x: Not Started | — | — | How users earn, spend, and value Trekcoin — the full loop |
| 2.7 | Empathy (Kappa) System Design| :x: Not Started | — | — | How we measure and reward empathetic engagement |
| 2.8 | Character & Persona Bible    | :x: Not Started | — | — | All AI characters: personalities, voices, backstories, behavior rules |

**Folder:** `deliverables/02-product-design/`

---

## 3. Technical Architecture

> These describe *how the system is built* — the services, databases, APIs, and how
> they all connect together. (Non-technical team members: these are the "blueprints.")

| #   | Deliverable                  | Status | Owner | Target Date | Notes |
|-----|------------------------------|--------|-------|-------------|-------|
| 3.1 | System Architecture Overview | :white_check_mark: Complete | AirTrek Team | Feb 2026 | Dev/Prod topology, component mapping, data flow |
| 3.2 | Control Narratives (CN-AIRTREK-001) | :construction: In Progress | AirTrek Team | Feb 2026 | ISA-88 compliant procedures for all system operations |
| 3.3 | API Specification            | :x: Not Started | — | — | Every endpoint: what it accepts, what it returns, error codes |
| 3.4 | Database Schema              | :x: Not Started | — | — | All tables, fields, and relationships |
| 3.5 | Security Architecture        | :x: Not Started | — | — | Authentication, encryption, access control, threat model |
| 3.6 | Infrastructure Plan          | :x: Not Started | — | — | Servers, containers, scaling rules, cost estimates |
| 3.7 | Integration Map              | :x: Not Started | — | — | How we connect to Mistral, ElevenLabs, Suno, Supabase |
| 3.8 | Tag Hierarchy (ISA-95)       | :x: Not Started | — | — | Complete tag structure for monitoring and control |

**Folder:** `deliverables/03-technical-architecture/`

---

## 4. Development

> These are the actual pieces of software to build. Each service is a building block
> of the platform.

| #   | Deliverable                  | Status | Owner | Target Date | Notes |
|-----|------------------------------|--------|-------|-------------|-------|
| 4.1 | Project Scaffolding          | :x: Not Started | — | — | Repo structure, build tools, CI/CD pipeline setup |
| 4.2 | Authentication Service       | :x: Not Started | — | — | Sign up, log in, sessions, password reset (see CN-AUTH-001/002) |
| 4.3 | Triad Engine                 | :x: Not Started | — | — | The core AI conversation system: Router (epsilon), Local (lambda), Guide (mu), Mirror (nu), Compositor (omega) |
| 4.4 | Voice Service                | :x: Not Started | — | — | Text-to-speech via ElevenLabs with character voices (see CN-VOICE-001) |
| 4.5 | Song Service                 | :x: Not Started | — | — | AI song generation from conversation emotions (see CN-SONG-001) |
| 4.6 | Passport Service             | :x: Not Started | — | — | User progress tracking, journeys, milestones (see CN-PASS-001/002) |
| 4.7 | Economy Service (Trekcoin)   | :x: Not Started | — | — | Credit/debit ledger, daily caps, tier discounts (see CN-ECON-001/002) |
| 4.8 | TrekCube (3D Spatial)        | :x: Not Started | — | — | 3D world map, VR-ready spatial experience |
| 4.9 | Compost (Wisdom DAO)         | :x: Not Started | — | — | Community wisdom artifacts and DAO feed |
| 4.10| Cultural Packs Service       | :x: Not Started | — | — | Loadable cultural content packs for destinations |
| 4.11| Web Application (Frontend)   | :x: Not Started | — | — | React app: chat interface, passport view, settings, voice player |
| 4.12| Admin Dashboard              | :x: Not Started | — | — | Perspective screens for monitoring, user management, content admin |

**Folder:** `deliverables/04-development/`

---

## 5. Content & Cultural

> The heart of AirTrek — the stories, characters, destinations, and cultural knowledge
> that make conversations meaningful.

| #   | Deliverable                  | Status | Owner | Target Date | Notes |
|-----|------------------------------|--------|-------|-------------|-------|
| 5.1 | Destination Library          | :x: Not Started | — | — | All travel destinations with history, culture, local knowledge |
| 5.2 | Character Catalog            | :x: Not Started | — | — | AI character profiles: who they are, how they speak, what they know |
| 5.3 | Cultural Pack: Japan         | :x: Not Started | — | — | First cultural pack — pilot for the content pipeline |
| 5.4 | Conversation Starters        | :x: Not Started | — | — | Pre-written prompts to help new users begin engaging |
| 5.5 | Educational Content          | :x: Not Started | — | — | Learning materials tied to empathy levels and destinations |
| 5.6 | Milestone Definitions        | :x: Not Started | — | — | All achievements: names, triggers, rewards, badge designs |

**Folder:** `deliverables/05-content-cultural/`

---

## 6. Operations

> How we keep the system running, handle problems, and deploy updates safely.

| #   | Deliverable                  | Status | Owner | Target Date | Notes |
|-----|------------------------------|--------|-------|-------------|-------|
| 6.1 | Deployment Runbook           | :x: Not Started | — | — | Step-by-step guide for deploying updates (see CN-OPS-003) |
| 6.2 | Monitoring & Alerting Setup  | :x: Not Started | — | — | What we watch, when we alert, who gets paged (see CN-OPS-001) |
| 6.3 | Maintenance Procedures       | :x: Not Started | — | — | Weekly maintenance: database cleanup, log rotation (see CN-OPS-002) |
| 6.4 | Backup & Recovery Plan       | :x: Not Started | — | — | How we back up data and restore it if something goes wrong |
| 6.5 | Incident Response Playbook   | :x: Not Started | — | — | What to do when things break: circuit breakers, retries (see CN-EXC-001/002) |
| 6.6 | On-Call Rotation             | :x: Not Started | — | — | Who is responsible when, escalation paths |

**Folder:** `deliverables/06-operations/`

---

## 7. Legal & Compliance

> The documents that protect us and our users.

| #   | Deliverable                  | Status | Owner | Target Date | Notes |
|-----|------------------------------|--------|-------|-------------|-------|
| 7.1 | Terms of Service             | :x: Not Started | — | — | User agreement for using AirTrek |
| 7.2 | Privacy Policy               | :x: Not Started | — | — | How we collect, use, and protect user data |
| 7.3 | Content Policy               | :x: Not Started | — | — | What's allowed in conversations, moderation rules |
| 7.4 | Data Handling & Retention    | :x: Not Started | — | — | How long we keep data, how we delete it, GDPR compliance |
| 7.5 | AI Ethics Guidelines         | :x: Not Started | — | — | Responsible AI use: bias prevention, transparency, user safety |

**Folder:** `deliverables/07-legal-compliance/`

---

## 8. Testing & Quality

> How we make sure everything works correctly before users see it.

| #   | Deliverable                  | Status | Owner | Target Date | Notes |
|-----|------------------------------|--------|-------|-------------|-------|
| 8.1 | Test Strategy                | :x: Not Started | — | — | What we test, how we test, what "good enough" looks like |
| 8.2 | API Test Suite               | :x: Not Started | — | — | Automated tests for every API endpoint |
| 8.3 | Load & Performance Tests     | :x: Not Started | — | — | Can the system handle 1K / 10K / 100K users? |
| 8.4 | User Acceptance Testing (UAT)| :x: Not Started | — | — | Real people testing real flows before launch |
| 8.5 | Security Audit Checklist     | :x: Not Started | — | — | OWASP top 10, penetration testing, vulnerability scanning |

**Folder:** `deliverables/08-testing-quality/`

---

## Dependencies Map

> Some tasks can't start until others finish. Here's what blocks what.

```
1.1 Executive Summary
 └──► 1.5 Go-to-Market (needs the summary to pitch)
 └──► 1.6 Financial Projections (needs the model)

1.3 Revenue Model
 └──► 2.6 Trekcoin Economy Design (pricing drives economy)
 └──► 4.7 Economy Service (can't build without the design)

2.1 PRD
 └──► 2.3 User Journey Maps (need features to map)
 └──► 2.4 Wireframes (need features to design)
 └──► 4.* All Development (need requirements to build)

2.8 Character Bible
 └──► 5.2 Character Catalog (characters drive content)
 └──► 4.3 Triad Engine (characters define AI behavior)

3.1 System Architecture ✓ (DONE)
 └──► 3.2 Control Narratives (IN PROGRESS)
 └──► 3.3 API Specification
 └──► 3.4 Database Schema
 └──► 4.1 Project Scaffolding

3.4 Database Schema
 └──► 4.2 Authentication Service
 └──► 4.6 Passport Service
 └──► 4.7 Economy Service

4.1 Project Scaffolding
 └──► 4.2-4.12 All Services (need the foundation first)

4.2 Auth Service
 └──► 4.3-4.10 All Other Services (everything needs auth)
```

---

## How to Pick Up a Task

1. **Find a task** marked `:x: Not Started` that doesn't have unfinished dependencies
2. **Assign yourself** — put your name in the Owner column
3. **Set a target date** — when do you think you can finish?
4. **Change the status** to `:construction: In Progress`
5. **Create your document** in the matching folder (e.g., `deliverables/01-business-strategy/`)
6. **When done**, change status to `:eyes: In Review` for team feedback
7. **After approval**, change to `:white_check_mark: Complete`

### Good First Tasks (No Dependencies)

These can be started right now by anyone:

- **1.1 Executive Summary** — Write a one-page overview of AirTrek
- **1.2 Business Model Canvas** — Map out the business model visually
- **1.4 Market Analysis** — Research competitors and market size
- **2.2 User Personas** — Describe our target users
- **2.5 Brand Guidelines** — Define the visual identity
- **2.8 Character & Persona Bible** — Define the AI characters

---

## Revision History

| Version | Date       | Author       | Changes          |
|---------|------------|--------------|------------------|
| 1.0     | Feb 2026   | AirTrek Team | Initial tracker  |
