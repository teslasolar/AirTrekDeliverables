# AIRTREK Architecture - Dev/Prod Topology

**Document:** ARCH-AIRTREK-001
**Version:** 1.0
**Date:** February 2026
**Status:** Complete

---

## Overview

```
DEVELOPMENT                              PRODUCTION
-----------                              ----------

GitHub Pages (static)                    Edge / CDN
Local Dev (Vite/Next)                    Ignition Gateway
Local Services (Docker)        →         Backend Services (containers)
Dev Gateway (localhost)                  Data Layer
```

AirTrek runs as a set of independent services that talk to each other through
a central gateway. In development, everything runs on your local machine. In
production, services are containerized and managed through the Ignition Gateway.

---

## Component Map

### Static Hosting (GitHub Pages)

| Path      | Content          | Updates        |
|-----------|------------------|----------------|
| `/`       | Landing page     | Manual deploy  |
| `/docs`   | Technical docs   | CI on merge    |
| `/demo`   | Static demo      | Nightly        |
| `/status` | System status    | Webhook        |

### Ignition Gateway (Primary Server)

| Module       | Function                        |
|-------------|---------------------------------|
| WebDev       | Hosts the React app, proxies API calls |
| Perspective  | Admin dashboards and metrics    |
| Tag Historian| Stores all metrics and events   |
| Alarming     | Alert routing and escalation    |
| Secrets      | API keys and tokens             |
| Gateway Net  | Multi-gateway sync              |
| ISA-88 Batch | Job control and state machines  |

### Backend Services (Containers)

| Service        | Port | What it does                          |
|---------------|------|---------------------------------------|
| Triad Engine   | 8001 | AI conversation (lambda/mu/nu/omega agents) |
| Voice Service  | 8002 | Text-to-speech via ElevenLabs         |
| Song Service   | 8003 | AI song generation via Suno           |
| Passport Svc   | 8004 | User progress and journey tracking    |
| TrekCube       | 8005 | 3D spatial map, VR-ready              |
| Compost        | 8006 | Wisdom artifacts and DAO feed         |
| Cultural Packs | 8007 | Destination content loader            |

### Data Layer

| Store         | Purpose                              |
|--------------|--------------------------------------|
| Supabase      | Auth, users, sessions                |
| Vector DB     | Embeddings, semantic search          |
| Blob Storage  | Media files (audio, images)          |
| Trekcoin Ledger| Credit/debit transaction log        |

---

## Data Flow

```
User Request
     |
     v
  CDN/Pages  <-- static content (HTML, CSS, images)
     |
     v (dynamic requests)
  Ignition Gateway
     |
     +-- Auth Check (JWT validation)
     +-- API Route (which service handles this?)
     +-- WebSocket Stream (real-time chat)
     |
     v
  Service Mesh
     |
     +-- Triad Engine (conversations)
     +-- Voice Service (text-to-speech)
     +-- Passport Service (progress)
     +-- Economy Service (trekcoin)
```

---

## Environment Matrix

| Component   | Development      | Staging         | Production      |
|-------------|------------------|-----------------|-----------------|
| Static Host | localhost:5173   | pages/staging   | pages/prod      |
| Gateway     | localhost:8088   | staging.gateway | prod.gateway    |
| AI Engine   | Ollama (local)   | Mistral API     | Mistral API     |
| Voice       | Mock responses   | 11Labs sandbox  | 11Labs prod     |
| Song        | Suno Bridge      | Suno Bridge     | Suno Bridge     |
| Auth        | Supabase dev     | Supabase staging| Supabase prod   |
| Database    | SQLite           | PostgreSQL      | PostgreSQL      |
| Secrets     | .env file        | Vault           | Vault           |

---

## Security Boundaries

```
PUBLIC ZONE
  GitHub Pages, CDN, rate-limited public API

DMZ (Demilitarized Zone)
  Ignition Gateway, Auth Layer (JWT validation)

PRIVATE ZONE
  Backend Services (internal network only)
  Secrets Server (gateway access only)
  Data Layer (service access only)
```

---

## Scaling Strategy

| User Load   | Pages | Gateway  | Services   | Database    |
|-------------|-------|----------|------------|-------------|
| < 1K DAU    | 1     | 1        | 1 each     | 1           |
| 1K - 10K    | 1     | 2 (HA)   | 2 each     | 1 + replica |
| 10K - 100K  | 1     | 3+ (LB)  | Auto-scale | Cluster     |
| > 100K      | 1     | Multi-region | Kubernetes | Sharded  |

---

## Project File Structure

```
airtrek/
├── .github/workflows/       # CI/CD pipelines
│   ├── pages.yml            # Static site deploy
│   └── services.yml         # Container builds
├── apps/
│   ├── web/                 # React frontend
│   ├── admin/               # Admin dashboards
│   └── docs/                # Documentation site
├── services/
│   ├── triad/               # AI conversation engine
│   ├── voice/               # Voice synthesis
│   ├── song/                # Song generation
│   ├── passport/            # User progress
│   ├── trekcube/            # 3D spatial
│   ├── compost/             # Wisdom DAO
│   └── cultural/            # Content packs
├── gateway/
│   ├── projects/            # Ignition projects
│   ├── modules/             # Custom modules
│   └── scripts/             # Gateway scripts
├── infra/
│   ├── docker-compose.yml   # Container orchestration
│   ├── k8s/                 # Kubernetes configs
│   └── terraform/           # Infrastructure as code
└── docs/
    ├── architecture.md
    └── runbooks/
```

---

## Revision History

| Version | Date     | Author       | Changes       |
|---------|----------|--------------|---------------|
| 1.0     | Feb 2026 | AirTrek Team | Initial draft |
