# Getting Started with the AirTrek Task Tracker

> **Who is this for?** Anyone on the team — business, design, content, or technical.
> You do NOT need to be a developer to contribute deliverables.

---

## What is AirTrek?

AirTrek is a platform where people have AI-powered conversations with cultural
characters from around the world. Users earn "Trekcoin" (virtual credits) and
build an "Empathy Passport" as they explore destinations and engage in meaningful
dialogue. The platform includes voice synthesis, AI-generated songs, and a 3D
spatial experience.

---

## What is a "Deliverable"?

A deliverable is any piece of work that moves the project forward. It could be:

- A **business document** (like a pricing plan or market analysis)
- A **design artifact** (like wireframes or brand guidelines)
- A **technical spec** (like an API design or database plan)
- A **content piece** (like character profiles or destination guides)
- A **process document** (like a deployment guide or test plan)

Each deliverable lives in a folder organized by category.

---

## Folder Structure

```
AirTrekDeliverables/
│
├── TASK-TRACKER.md            ← Start here! The master list of all tasks
├── GETTING-STARTED.md         ← You are here
│
└── deliverables/
    ├── 01-business-strategy/  ← Business plans, pricing, market analysis
    ├── 02-product-design/     ← User experience, wireframes, branding
    ├── 03-technical-architecture/  ← System blueprints and specs
    │   └── control-narratives/     ← Step-by-step system procedures
    ├── 04-development/        ← Code and service specifications
    ├── 05-content-cultural/   ← Characters, destinations, cultural packs
    ├── 06-operations/         ← How we run and maintain the system
    ├── 07-legal-compliance/   ← Terms of service, privacy, ethics
    └── 08-testing-quality/    ← How we verify everything works
```

---

## How to Contribute

### Step 1: Open the Task Tracker

Open `TASK-TRACKER.md` — this is the master list of everything that needs to be done.

### Step 2: Find a Task You Can Work On

Look for tasks marked **Not Started** that match your skills:

| If you're good at...         | Look at these categories          |
|------------------------------|-----------------------------------|
| Business planning            | 1. Business & Strategy            |
| User experience / design     | 2. Product & Design               |
| Writing / storytelling       | 5. Content & Cultural             |
| Legal / policy               | 7. Legal & Compliance             |
| Technical / engineering      | 3. Architecture, 4. Development   |
| QA / testing                 | 8. Testing & Quality              |
| Project management           | 6. Operations                     |

### Step 3: Check Dependencies

Some tasks need other tasks to be finished first. The "Dependencies Map" in the
Task Tracker shows what blocks what. If your task has unfinished dependencies,
pick a different one or help finish the dependency first.

### Step 4: Claim and Start

1. Put your name in the **Owner** column
2. Set a **Target Date**
3. Change the status to **In Progress**

### Step 5: Create Your Document

Create your deliverable in the matching folder. For example:

- Business Model Canvas → `deliverables/01-business-strategy/business-model-canvas.md`
- User Personas → `deliverables/02-product-design/user-personas.md`
- Character Bible → `deliverables/02-product-design/character-persona-bible.md`

### Step 6: Submit for Review

When your draft is done:
1. Change the status to **In Review**
2. Let the team know it's ready for feedback

### Step 7: Mark Complete

After the team approves your work:
1. Change the status to **Complete**
2. Note the completion date

---

## Tips for Non-Technical Contributors

### You Don't Need to Understand Code

Many deliverables are about *what* the system should do, not *how* it's built:

- **User Personas** describe who uses AirTrek and what they care about
- **User Journey Maps** describe the steps a user takes (click this, see that)
- **Brand Guidelines** define colors, fonts, and tone of voice
- **Character Bible** describes the AI characters' personalities and backstories
- **Market Analysis** researches competitors and market opportunity

### Understanding the Jargon

| Term            | What it means in plain English                              |
|-----------------|-------------------------------------------------------------|
| Triad Engine    | The AI brain that powers conversations                      |
| Trekcoin        | Virtual credits users earn and spend on the platform        |
| Kappa (k)       | A score measuring how empathetically a user engages         |
| Passport        | A user's progress record (like a travel passport with stamps)|
| Milestone       | An achievement badge (like "Had 10 conversations")          |
| Control Narrative| A step-by-step recipe for how a system process works       |
| ISA-88/95       | Industry standards for describing automated processes       |
| Gateway         | The front door of the system that routes all requests       |
| Service         | One piece of the system that does one specific job          |
| API             | The way different services talk to each other               |
| JWT             | A digital ID card that proves who the user is               |
| Lambda/Mu/Nu    | The three AI agents: Local guide, Teacher, Mirror           |
| Compositor      | The piece that combines the three agents' responses         |
| ElevenLabs      | External service we use for AI voice generation             |
| Suno            | External service we use for AI song generation              |
| Supabase        | External service we use for user accounts and database      |

---

## Good First Tasks (No Dependencies, No Technical Skills Needed)

1. **Executive Summary (1.1)** — Write a one-page overview of what AirTrek is
2. **Business Model Canvas (1.2)** — Map how AirTrek creates value
3. **Market Analysis (1.4)** — Research competitors and market size
4. **User Personas (2.2)** — Describe 3-4 types of target users
5. **Brand Guidelines (2.5)** — Define the visual identity
6. **Character & Persona Bible (2.8)** — Create the AI characters

---

## Questions?

If you're unsure where a task fits or need help getting started, ask the team.
Every contribution matters — the business strategy is just as important as the code.
