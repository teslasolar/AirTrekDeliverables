# CONTROL NARRATIVES

**Document:** CN-AIRTREK-001
**Version:** 1.0
**Date:** February 2026
**Status:** Draft
**Standard:** ISA-88 / ISA-95 Compliant

---

## 1. Introduction

### 1.1 Purpose

This document defines control narratives for all automated and semi-automated
procedures in the AirTrek platform. Control narratives describe the sequence,
conditions, and actions for each operational procedure in a standardized format.

### 1.2 Scope

Covers all procedural controls: user workflows, system operations, batch
processes, and exception handling.

### 1.3 Narrative Structure

Each control narrative follows the ISA-88 procedural control model:

```
PROCEDURE
  └── UNIT PROCEDURE
       └── OPERATION
            └── PHASE
                 └── STEP
```

### 1.4 Notation

| Symbol | Meaning              |
|--------|----------------------|
| [C]    | Condition/check      |
| [A]    | Action               |
| [W]    | Wait/delay           |
| [E]    | Exception/error      |
| [T]    | Transition           |
| [S]    | State change         |
| →      | Then/next            |
| ‖      | Parallel             |
| ⟳      | Loop/retry           |

---

## 2. User Authentication Narratives

### CN-AUTH-001: User Registration

```
PROCEDURE: User Registration
TRIGGER:   User submits registration form
OWNER:     Auth Service
TIMEOUT:   30 seconds

UNIT PROCEDURE 1: Validate Input
├── OPERATION 1.1: Email Validation
│   ├── PHASE 1.1.1: Format Check
│   │   ├── [C] Email matches RFC 5322 pattern
│   │   ├── [E] INVALID_EMAIL → Return 400, display error
│   │   └── [T] Valid → Continue
│   │
│   └── PHASE 1.1.2: Uniqueness Check
│       ├── [A] Query users table WHERE email = input
│       ├── [C] Result count = 0
│       ├── [E] Count > 0 → Return 409 EMAIL_EXISTS
│       └── [T] Unique → Continue
│
├── OPERATION 1.2: Password Validation
│   ├── PHASE 1.2.1: Strength Check
│   │   ├── [C] Length >= 8 characters
│   │   ├── [C] Contains uppercase letter
│   │   ├── [C] Contains lowercase letter
│   │   ├── [C] Contains number
│   │   ├── [E] Any fail → Return 400 INVALID_PASSWORD
│   │   └── [T] All pass → Continue
│   │
│   └── PHASE 1.2.2: Hash Password
│       ├── [A] Generate bcrypt hash (cost=12)
│       ├── [S] password_hash = hash result
│       └── [T] Continue

UNIT PROCEDURE 2: Create Account
├── OPERATION 2.1: Database Transaction
│   ├── PHASE 2.1.1: Begin Transaction
│   │   ├── [A] BEGIN TRANSACTION ISOLATION SERIALIZABLE
│   │   └── [T] Continue
│   │
│   ├── PHASE 2.1.2: Insert User
│   │   ├── [A] INSERT INTO users (email, password_hash, tier_id)
│   │   ├── [S] user_id = generated UUID
│   │   ├── [E] Insert fails → ROLLBACK, Return 500
│   │   └── [T] Continue
│   │
│   ├── PHASE 2.1.3: Insert Profile
│   │   ├── [A] INSERT INTO profiles (user_id, display_name)
│   │   ├── [E] Insert fails → ROLLBACK, Return 500
│   │   └── [T] Continue
│   │
│   ├── PHASE 2.1.4: Initialize Passport
│   │   ├── [A] INSERT INTO passports (user_id, current_kappa=0.3)
│   │   ├── [E] Insert fails → ROLLBACK, Return 500
│   │   └── [T] Continue
│   │
│   ├── PHASE 2.1.5: Initialize Trekcoin
│   │   ├── [A] INSERT INTO trekcoin_balances (user_id, balance=10)
│   │   ├── [A] INSERT INTO trekcoin_ledger (user_id, type='credit',
│   │   │       amount=10, action='welcome_bonus')
│   │   ├── [E] Insert fails → ROLLBACK, Return 500
│   │   └── [T] Continue
│   │
│   └── PHASE 2.1.6: Commit
│       ├── [A] COMMIT TRANSACTION
│       └── [T] Continue

UNIT PROCEDURE 3: Post-Registration
├── OPERATION 3.1: Create Session
│   ├── [A] Generate JWT token (exp=24h)
│   ├── [A] INSERT INTO sessions (user_id, token_hash)
│   └── [T] Continue
│
├── OPERATION 3.2: Send Verification Email (parallel)
│   ├── [A] Generate verification token
│   ├── [A] Queue email job
│   └── [T] Continue (non-blocking)
│
└── OPERATION 3.3: Return Response
    ├── [A] Build response { user_id, session_token, trekcoin_balance }
    └── [S] Return 201 Created

EXCEPTIONS:
├── Database unavailable → Return 503, log error
├── Timeout exceeded → Return 504, cleanup partial state
└── Unknown error → Return 500, log full stack
```

### CN-AUTH-002: User Login

```
PROCEDURE: User Login
TRIGGER:   User submits login form
OWNER:     Auth Service
TIMEOUT:   10 seconds

UNIT PROCEDURE 1: Validate Credentials
├── OPERATION 1.1: Lookup User
│   ├── [A] SELECT * FROM users WHERE email = input AND status = 'active'
│   ├── [C] User found
│   ├── [E] Not found → Return 401 INVALID_CREDENTIALS
│   └── [T] Continue
│
├── OPERATION 1.2: Check Lockout
│   ├── [C] locked_until IS NULL OR locked_until < NOW()
│   ├── [E] Locked → Return 423 ACCOUNT_LOCKED
│   └── [T] Continue
│
└── OPERATION 1.3: Verify Password
    ├── [A] bcrypt.compare(input_password, password_hash)
    ├── [C] Match = true
    ├── [E] No match → Increment failed_logins, check lockout threshold
    │   ├── [C] failed_logins >= 5
    │   ├── [A] SET locked_until = NOW() + 15 minutes
    │   └── [A] Return 401 INVALID_CREDENTIALS
    └── [T] Match → Continue

UNIT PROCEDURE 2: Create Session
├── OPERATION 2.1: Reset Failed Logins
│   ├── [A] UPDATE users SET failed_logins = 0, last_login = NOW()
│   └── [T] Continue
│
├── OPERATION 2.2: Generate Tokens
│   ├── [A] Generate JWT access token (exp=1h)
│   ├── [A] Generate refresh token (exp=7d)
│   ├── [A] INSERT INTO sessions (user_id, token_hash, refresh_token_hash)
│   └── [T] Continue
│
└── OPERATION 2.3: Return Response
    ├── [A] Load user profile
    ├── [A] Build response { user_id, session_token, profile }
    └── [S] Return 200 OK

EXCEPTIONS:
├── Database unavailable → Return 503
└── Timeout → Return 504
```

---

## 3. Conversation Narratives

### CN-CHAT-001: Process Chat Message

```
PROCEDURE: Process Chat Message
TRIGGER:   POST /triad/query received
OWNER:     Triad Engine
TIMEOUT:   30 seconds
COST:      Variable (1-8 trekcoin based on level)

UNIT PROCEDURE 1: Pre-Processing
├── OPERATION 1.1: Authenticate
│   ├── [A] Validate JWT from Authorization header
│   ├── [C] Token valid and not expired
│   ├── [E] Invalid → Return 401 UNAUTHORIZED
│   └── [T] Continue
│
├── OPERATION 1.2: Load Context
│   ├── PHASE 1.2.1: Get User
│   │   ├── [A] SELECT * FROM users WHERE id = token.sub
│   │   ├── [S] user = result
│   │   └── [T] Continue
│   │
│   ├── PHASE 1.2.2: Get/Create Conversation
│   │   ├── [C] conversation_id provided?
│   │   ├── [A] Yes → SELECT * FROM conversations WHERE id = input
│   │   ├── [A] No → INSERT INTO conversations, get new ID
│   │   ├── [S] conversation = result
│   │   └── [T] Continue
│   │
│   └── PHASE 1.2.3: Load Character
│       ├── [A] SELECT * FROM characters WHERE id = character_id
│       ├── [A] SELECT * FROM personas WHERE character_id = character_id
│       ├── [S] character = merged result
│       └── [T] Continue
│
├── OPERATION 1.3: Check Balance
│   ├── [A] SELECT balance FROM trekcoin_balances WHERE user_id = user.id
│   ├── [A] Calculate cost based on level (auto or specified)
│   ├── [C] balance >= cost
│   ├── [E] Insufficient → Return 402 INSUFFICIENT_BALANCE
│   └── [T] Continue
│
└── OPERATION 1.4: Input Processing
    ├── [A] Sanitize input (strip dangerous chars)
    ├── [A] Detect language
    ├── [A] Classify intent (simple/edu/deep)
    ├── [S] processed_input = result
    └── [T] Continue

UNIT PROCEDURE 2: Triad Processing
├── OPERATION 2.1: Route Query
│   ├── [A] Router (epsilon) determines level
│   ├── [S] level = 1|2|3|4|5
│   └── [T] Branch by level
│
│   BRANCH: Level 1 (Simple)
│   ├── [A] Invoke lambda (Local) agent only
│   └── [T] → Composition
│
│   BRANCH: Level 2 (Educational)
│   ├── [A] Invoke lambda (Local) agent (parallel)
│   ├── [A] Invoke mu (Guide) agent (parallel)
│   └── [T] → Composition
│
│   BRANCH: Level 3+ (Deep)
│   ├── [A] Invoke lambda (Local) agent (parallel)
│   ├── [A] Invoke mu (Guide) agent (parallel)
│   ├── [A] Invoke nu (Mirror) agent (parallel)
│   └── [T] → Composition
│
├── OPERATION 2.2: Agent Invocation (per agent)
│   ├── PHASE 2.2.1: Build Prompt
│   │   ├── [A] Load system prompt for agent type
│   │   ├── [A] Inject character persona (for lambda)
│   │   ├── [A] Inject conversation history (last 10 messages)
│   │   ├── [A] Inject user message
│   │   └── [T] Continue
│   │
│   ├── PHASE 2.2.2: Call AI API
│   │   ├── [A] POST to Mistral/Claude API
│   │   ├── [W] Await response (timeout: 20s)
│   │   ├── [E] Timeout → Use fallback or partial response
│   │   ├── [E] API error → Retry once, then fail gracefully
│   │   ├── [S] agent_response = result
│   │   └── [T] Continue
│   │
│   └── PHASE 2.2.3: Extract Metadata
│       ├── [A] Detect emotion from response
│       ├── [A] Extract any reciprocal questions
│       └── [T] Continue
│
└── OPERATION 2.3: Composition (omega)
    ├── PHASE 2.3.1: Merge Responses
    │   ├── [A] Compositor merges agent outputs
    │   ├── [A] Resolve tensions between agents
    │   ├── [A] Apply character voice consistency
    │   └── [T] Continue
    │
    └── PHASE 2.3.2: Sand Spreader
        ├── [A] Check coherence
        ├── [A] Optimize truth alignment
        ├── [S] final_response = result
        └── [T] Continue

UNIT PROCEDURE 3: Empathy Calculation
├── OPERATION 3.1: Extract Signals
│   ├── [A] Analyze question_depth from user message
│   ├── [A] Analyze perspective_adoption
│   ├── [A] Analyze assumption_surfacing
│   ├── [A] Calculate engagement_duration
│   ├── [A] Calculate topic_exploration
│   ├── [A] Calculate emotional_resonance
│   ├── [S] signals = { S1..S6 }
│   └── [T] Continue
│
├── OPERATION 3.2: Calculate Kappa
│   ├── [A] kappa_raw = SUM(Si * Wi)
│   ├── [A] kappa = smooth(kappa_raw, kappa_prev, alpha=0.3)
│   ├── [S] kappa = result
│   └── [T] Continue
│
└── OPERATION 3.3: Update Progression
    ├── [A] Check level thresholds
    ├── [C] kappa crosses threshold?
    ├── [A] Yes → Update current_level in passport
    ├── [A] Check milestone triggers
    └── [T] Continue

UNIT PROCEDURE 4: Persistence
├── OPERATION 4.1: Save Message (parallel)
│   ├── [A] INSERT INTO messages (conversation_id, role='user', content)
│   ├── [A] INSERT INTO messages (conversation_id, role='character',
│   │       content, emotion)
│   └── [T] Continue
│
├── OPERATION 4.2: Save Empathy Score
│   ├── [A] INSERT INTO empathy_scores (message_id, kappa, signals)
│   └── [T] Continue
│
├── OPERATION 4.3: Debit Trekcoin
│   ├── [A] BEGIN TRANSACTION
│   ├── [A] UPDATE trekcoin_balances SET balance = balance - cost
│   ├── [A] INSERT INTO trekcoin_ledger (type='debit', amount=cost,
│   │       action='query_lv{n}')
│   ├── [A] COMMIT
│   └── [T] Continue
│
├── OPERATION 4.4: Update Conversation
│   ├── [A] UPDATE conversations SET message_count++, kappa_end=kappa,
│   │       last_message_at=NOW()
│   └── [T] Continue
│
└── OPERATION 4.5: Update Passport
    ├── [A] UPDATE passports SET current_kappa=kappa,
    │       total_conversations++
    └── [T] Continue

UNIT PROCEDURE 5: Response
└── OPERATION 5.1: Build Response
    ├── [A] Construct response JSON
    │   {
    │     conversation_id,
    │     message_id,
    │     response: { text, emotion, sources },
    │     empathy: { kappa, kappa_delta, signals },
    │     trekcoin: { cost, balance },
    │     metadata: { level, latency_ms, tokens_used }
    │   }
    └── [S] Return 200 OK

EXCEPTIONS:
├── Auth failure → Return 401
├── Insufficient balance → Return 402
├── Character not found → Return 404
├── AI API failure → Return partial response with warning
├── Database failure → Return 503
└── Timeout → Return 504, save partial state
```

---

## 4. Voice Synthesis Narratives

### CN-VOICE-001: Synthesize Voice

```
PROCEDURE: Voice Synthesis
TRIGGER:   POST /voice/synthesize received
OWNER:     Voice Service
TIMEOUT:   15 seconds
COST:      2 trekcoin

UNIT PROCEDURE 1: Validation
├── OPERATION 1.1: Authenticate & Authorize
│   ├── [A] Validate JWT
│   ├── [C] User tier allows voice (explorer+)
│   ├── [E] Free tier → Return 403 INSUFFICIENT_TIER
│   └── [T] Continue
│
├── OPERATION 1.2: Check Balance
│   ├── [A] Get balance
│   ├── [C] balance >= 2
│   ├── [E] Insufficient → Return 402
│   └── [T] Continue
│
└── OPERATION 1.3: Validate Input
    ├── [C] text.length <= 5000
    ├── [C] character_id exists
    ├── [E] Invalid → Return 400
    └── [T] Continue

UNIT PROCEDURE 2: Synthesis
├── OPERATION 2.1: Prepare Request
│   ├── [A] Load character voice_id from database
│   ├── [A] Map emotion to voice parameters
│   │   ├── stability = EMOTION_MAP[emotion].stability
│   │   ├── similarity = EMOTION_MAP[emotion].similarity
│   │   ├── style = EMOTION_MAP[emotion].style
│   │   └── speed = EMOTION_MAP[emotion].speed
│   └── [T] Continue
│
├── OPERATION 2.2: Call ElevenLabs
│   ├── [A] POST /v1/text-to-speech/{voice_id}
│   │   { text, voice_settings: { stability, similarity, style, speed } }
│   ├── [W] Await response (timeout: 12s)
│   ├── [E] Timeout → Return 504
│   ├── [E] Rate limited → Return 429 with Retry-After
│   ├── [E] API error → Retry once, then Return 503
│   ├── [S] audio_data = binary response
│   └── [T] Continue
│
└── OPERATION 2.3: Store Audio
    ├── [A] Generate unique filename
    ├── [A] Upload to blob storage
    ├── [A] Generate signed URL (exp=1h)
    ├── [S] audio_url = signed URL
    └── [T] Continue

UNIT PROCEDURE 3: Finalize
├── OPERATION 3.1: Debit Trekcoin
│   ├── [A] Debit 2 trekcoin
│   ├── [A] Log transaction
│   └── [T] Continue
│
└── OPERATION 3.2: Return Response
    ├── [A] Build response
    │   { audio_url, duration_ms, expires_at, trekcoin: { cost: 2, balance } }
    └── [S] Return 200 OK
```

---

## 5. Song Generation Narratives

### CN-SONG-001: Generate Song

```
PROCEDURE: Song Generation
TRIGGER:   POST /song/generate received
OWNER:     Song Service
TIMEOUT:   5 minutes (async)
COST:      8 trekcoin

UNIT PROCEDURE 1: Job Creation
├── OPERATION 1.1: Validate & Authorize
│   ├── [A] Validate JWT
│   ├── [C] User tier allows songs (explorer+)
│   ├── [C] Balance >= 8
│   ├── [E] Fail → Return appropriate error
│   └── [T] Continue
│
├── OPERATION 1.2: Debit Immediately
│   ├── [A] Debit 8 trekcoin (prevents double-submit)
│   └── [T] Continue
│
├── OPERATION 1.3: Create Job Record
│   ├── [A] INSERT INTO song_jobs (user_id, conversation_id, status='queued')
│   ├── [S] job_id = generated UUID
│   └── [T] Continue
│
└── OPERATION 1.4: Return Accepted
    ├── [A] Return 202 { job_id, status: 'queued', estimated_seconds: 180 }
    └── [S] Continue async

UNIT PROCEDURE 2: Async Processing (Background)
├── OPERATION 2.1: Extract Emotional Arc
│   ├── [A] Load conversation messages
│   ├── [A] Segment into emotional phases
│   ├── [A] Score each segment for emotion
│   ├── [A] Identify peaks and transitions
│   ├── [S] emotional_arc = result
│   └── [T] Continue
│
├── OPERATION 2.2: Map to Music Style
│   ├── [A] Map arc pattern to genre
│   ├── [A] Map emotions to tempo
│   ├── [A] Map era to instruments
│   ├── [S] style_config = result
│   └── [T] Continue
│
├── OPERATION 2.3: Build Prompt
│   ├── [A] Merge style_config with user overrides
│   ├── [A] Construct Suno prompt
│   ├── [S] prompt = result
│   └── [T] Continue
│
├── OPERATION 2.4: Submit to Suno
│   ├── [A] POST to Suno Bridge /generate
│   ├── [A] UPDATE song_jobs SET status='processing', suno_job_id=result
│   └── [T] Continue
│
├── OPERATION 2.5: Poll Status
│   ├── LOOP every 5 seconds, max 60 iterations
│   │   ├── [A] GET Suno Bridge /job/{suno_job_id}
│   │   ├── [C] status = 'complete' → EXIT LOOP
│   │   ├── [C] status = 'failed' → HANDLE ERROR
│   │   ├── [A] UPDATE song_jobs SET progress = response.progress
│   │   └── [W] Wait 5 seconds
│   └── [E] Max iterations → Mark failed, refund
│
├── OPERATION 2.6: Store Result
│   ├── [A] Download audio from Suno
│   ├── [A] Upload to blob storage
│   ├── [A] INSERT INTO songs (user_id, job_id, audio_url, title,
│   │       lyrics, style)
│   └── [T] Continue
│
└── OPERATION 2.7: Finalize Job
    ├── [A] UPDATE song_jobs SET status='complete', completed_at=NOW()
    └── [S] Done

EXCEPTIONS:
├── Suno unavailable → Mark failed, refund trekcoin, notify user
├── Timeout → Mark failed, refund trekcoin
└── Storage failure → Retry 3x, then fail
```

---

## 6. Economy Narratives

### CN-ECON-001: Credit Trekcoin

```
PROCEDURE: Credit Trekcoin
TRIGGER:   System event (milestone, daily login, etc.)
OWNER:     Economy Service
TIMEOUT:   5 seconds

UNIT PROCEDURE 1: Validate Credit
├── OPERATION 1.1: Check Daily Cap
│   ├── [A] SELECT daily_earned, daily_reset_at FROM trekcoin_balances
│   ├── [C] daily_reset_at < TODAY?
│   ├── [A] Yes → Reset daily_earned = 0, daily_reset_at = TODAY
│   ├── [A] Get user tier daily_cap
│   ├── [C] daily_earned + amount <= daily_cap (or cap is NULL)
│   ├── [E] Exceeds cap → Credit only up to cap, log
│   └── [T] Continue
│
└── OPERATION 1.2: Check Duplicate
    ├── [C] action = 'daily_login'?
    ├── [A] Yes → Check if already credited today
    ├── [E] Duplicate → Return without action
    └── [T] Continue

UNIT PROCEDURE 2: Apply Credit
├── OPERATION 2.1: Transaction
│   ├── [A] BEGIN TRANSACTION
│   ├── [A] SELECT balance FROM trekcoin_balances FOR UPDATE
│   ├── [A] new_balance = balance + amount
│   ├── [A] UPDATE trekcoin_balances SET balance = new_balance,
│   │       daily_earned += amount
│   ├── [A] INSERT INTO trekcoin_ledger (type='credit', amount,
│   │       balance_after=new_balance, action)
│   ├── [A] COMMIT
│   └── [T] Continue
│
└── OPERATION 2.2: Emit Event
    ├── [A] Emit 'trekcoin.credited' event
    └── [S] Done
```

### CN-ECON-002: Debit Trekcoin

```
PROCEDURE: Debit Trekcoin
TRIGGER:   Service request (query, voice, song)
OWNER:     Economy Service
TIMEOUT:   5 seconds

UNIT PROCEDURE 1: Pre-Check
├── OPERATION 1.1: Calculate Cost
│   ├── [A] Get base cost for action
│   ├── [A] Get user tier discount
│   ├── [A] final_cost = base_cost * (1 - discount)
│   ├── [S] cost = ceil(final_cost)
│   └── [T] Continue
│
└── OPERATION 1.2: Check Balance
    ├── [A] SELECT balance FROM trekcoin_balances WHERE user_id = ?
    ├── [C] balance >= cost
    ├── [E] Insufficient → Return error, DO NOT proceed
    └── [T] Continue

UNIT PROCEDURE 2: Apply Debit
├── OPERATION 2.1: Transaction
│   ├── [A] BEGIN TRANSACTION ISOLATION SERIALIZABLE
│   ├── [A] SELECT balance FROM trekcoin_balances FOR UPDATE
│   ├── [C] balance >= cost (re-check under lock)
│   ├── [E] Insufficient → ROLLBACK, Return error
│   ├── [A] new_balance = balance - cost
│   ├── [A] UPDATE trekcoin_balances SET balance = new_balance
│   ├── [A] INSERT INTO trekcoin_ledger (type='debit', amount=cost,
│   │       balance_after=new_balance, action)
│   ├── [A] COMMIT
│   └── [T] Continue
│
└── OPERATION 2.2: Return Result
    ├── [S] Return { cost, new_balance }
    └── [S] Done
```

---

## 7. Passport Narratives

### CN-PASS-001: Record Journey

```
PROCEDURE: Record Journey
TRIGGER:   User enters/exits destination
OWNER:     Passport Service

UNIT PROCEDURE 1: Enter Destination
├── OPERATION 1.1: Create Journey
│   ├── [A] INSERT INTO journeys (user_id, destination_id, entered_at,
│   │       kappa_start)
│   ├── [S] journey_id = result
│   └── [T] Continue
│
└── OPERATION 1.2: Update Passport
    ├── [A] Check if first visit to this destination
    ├── [C] First visit?
    ├── [A] Yes → UPDATE passports SET destinations_visited++
    ├── [A] Check milestone M002 (Time Traveler)
    └── [T] Continue

UNIT PROCEDURE 2: Exit Destination
├── OPERATION 2.1: Complete Journey
│   ├── [A] UPDATE journeys SET
│   │       exited_at = NOW(),
│   │       duration_seconds = NOW() - entered_at,
│   │       kappa_end = current_kappa,
│   │       conversations = count
│   └── [T] Continue
│
└── OPERATION 2.2: Update Stats
    ├── [A] UPDATE passports SET total_time_seconds += duration
    └── [S] Done
```

### CN-PASS-002: Trigger Milestone

```
PROCEDURE: Trigger Milestone
TRIGGER:   Various user actions
OWNER:     Passport Service

UNIT PROCEDURE 1: Check Eligibility
├── OPERATION 1.1: Load Definition
│   ├── [A] SELECT * FROM milestone_definitions WHERE id = milestone_id
│   ├── [S] definition = result
│   └── [T] Continue
│
├── OPERATION 1.2: Check Not Already Achieved
│   ├── [A] SELECT * FROM milestones WHERE user_id = ? AND milestone_id = ?
│   ├── [C] Result is empty
│   ├── [E] Already achieved → Return, no action
│   └── [T] Continue
│
└── OPERATION 1.3: Evaluate Trigger
    ├── [A] Parse trigger_config
    │
    ├── BRANCH: type = 'count'
    │   ├── [A] Count user's entity (conversations, etc.)
    │   ├── [C] count >= trigger_value
    │   └── [T] Met → Continue, Not met → Return
    │
    ├── BRANCH: type = 'threshold'
    │   ├── [A] Get user's metric (kappa, etc.)
    │   ├── [C] metric >= trigger_value
    │   └── [T] Met → Continue, Not met → Return
    │
    └── BRANCH: type = 'streak'
        ├── [A] Get user's current_streak
        ├── [C] streak >= trigger_value
        └── [T] Met → Continue, Not met → Return

UNIT PROCEDURE 2: Award Milestone
├── OPERATION 2.1: Record Achievement
│   ├── [A] INSERT INTO milestones (user_id, milestone_id, achieved_at)
│   └── [T] Continue
│
├── OPERATION 2.2: Grant Reward
│   ├── [C] reward_type = 'trekcoin'?
│   ├── [A] Yes → Credit trekcoin (CN-ECON-001)
│   └── [T] Continue
│
└── OPERATION 2.3: Notify User
    ├── [A] Emit 'milestone.achieved' event
    └── [S] Done
```

---

## 8. System Operations Narratives

### CN-OPS-001: Health Check

```
PROCEDURE: Health Check
TRIGGER:   GET /health or scheduled (every 30s)
OWNER:     Gateway
TIMEOUT:   10 seconds

UNIT PROCEDURE 1: Check Services
├── OPERATION 1.1: Check Each Service (parallel)
│   ├── [A] GET http://triad:8001/health → triad_status
│   ├── [A] GET http://voice:8002/health → voice_status
│   ├── [A] GET http://song:8003/health → song_status
│   ├── [A] GET http://passport:8004/health → passport_status
│   ├── [A] GET http://economy:8005/health → economy_status
│   ├── [A] GET http://trekcube:8006/health → trekcube_status
│   ├── [A] GET http://content:8007/health → content_status
│   └── [W] Wait for all (timeout: 5s each)
│
└── OPERATION 1.2: Check Dependencies
    ├── [A] Ping PostgreSQL → db_status
    ├── [A] Ping Redis → redis_status
    └── [T] Continue

UNIT PROCEDURE 2: Aggregate Status
├── OPERATION 2.1: Calculate Overall
│   ├── [C] All services healthy?
│   ├── [A] Yes → overall = 'healthy'
│   ├── [C] Any critical service unhealthy?
│   ├── [A] Yes → overall = 'unhealthy'
│   ├── [A] Otherwise → overall = 'degraded'
│   └── [T] Continue
│
└── OPERATION 2.2: Return Response
    ├── [A] Build response
    │   { status: overall, version, timestamp, services: {...} }
    └── [S] Return 200 (healthy/degraded) or 503 (unhealthy)
```

### CN-OPS-002: Scheduled Maintenance

```
PROCEDURE: Scheduled Maintenance
TRIGGER:   Cron: Sunday 02:00 UTC
OWNER:     Platform
TIMEOUT:   4 hours

UNIT PROCEDURE 1: Pre-Maintenance
├── OPERATION 1.1: Enable Maintenance Mode
│   ├── [A] SET Redis maintenance:enabled = true
│   ├── [A] SET Redis maintenance:message = "Scheduled maintenance"
│   └── [T] Continue
│
├── OPERATION 1.2: Drain Connections
│   ├── [A] Stop accepting new requests
│   ├── [W] Wait for in-flight requests (max 60s)
│   └── [T] Continue
│
└── OPERATION 1.3: Pause Non-Critical Services
    ├── [A] Stop song generation workers
    ├── [A] Stop background jobs
    └── [T] Continue

UNIT PROCEDURE 2: Maintenance Tasks
├── OPERATION 2.1: Database Maintenance
│   ├── [A] VACUUM ANALYZE
│   ├── [A] REINDEX if fragmentation > 20%
│   ├── [A] Update statistics
│   └── [T] Continue
│
├── OPERATION 2.2: Log Rotation
│   ├── [A] Rotate application logs
│   ├── [A] Compress old logs
│   ├── [A] Delete logs > 14 days
│   └── [T] Continue
│
├── OPERATION 2.3: Cleanup
│   ├── [A] Delete expired sessions
│   ├── [A] Delete orphaned jobs
│   ├── [A] Clean temp files
│   └── [T] Continue
│
└── OPERATION 2.4: Backup Verification
    ├── [A] Verify latest backup integrity
    ├── [A] Test restore to staging
    └── [T] Continue

UNIT PROCEDURE 3: Post-Maintenance
├── OPERATION 3.1: Resume Services
│   ├── [A] Start background jobs
│   ├── [A] Start song generation workers
│   └── [T] Continue
│
├── OPERATION 3.2: Health Check
│   ├── [A] Run CN-OPS-001 Health Check
│   ├── [C] All healthy?
│   ├── [E] Not healthy → Alert on-call, investigate
│   └── [T] Continue
│
└── OPERATION 3.3: Disable Maintenance Mode
    ├── [A] DEL Redis maintenance:enabled
    ├── [A] DEL Redis maintenance:message
    └── [S] Done
```

### CN-OPS-003: Deployment

```
PROCEDURE: Production Deployment
TRIGGER:   Manual approval after staging success
OWNER:     Platform
TIMEOUT:   30 minutes

UNIT PROCEDURE 1: Pre-Deployment
├── OPERATION 1.1: Verify Prerequisites
│   ├── [C] CI pipeline passed
│   ├── [C] Staging tests passed
│   ├── [C] Approval received
│   ├── [C] On-call notified
│   ├── [C] Rollback plan documented
│   ├── [E] Any fail → Abort deployment
│   └── [T] Continue
│
├── OPERATION 1.2: Create Checkpoint
│   ├── [A] Tag current images as 'rollback'
│   ├── [A] Record current config hashes
│   ├── [A] Create database snapshot (if migration)
│   └── [T] Continue
│
└── OPERATION 1.3: Notify
    ├── [A] Post to #deployments channel
    └── [T] Continue

UNIT PROCEDURE 2: Deploy
├── OPERATION 2.1: Pull Images
│   ├── [A] docker-compose pull
│   ├── [E] Pull fails → Abort, notify
│   └── [T] Continue
│
├── OPERATION 2.2: Rolling Update
│   ├── FOR EACH service in deployment order
│   │   ├── [A] Scale up new instance
│   │   ├── [W] Wait for health check pass (60s)
│   │   ├── [C] Health check passed?
│   │   ├── [E] Failed → Rollback, abort
│   │   ├── [A] Scale down old instance
│   │   └── [T] Next service
│   └── [T] Continue
│
└── OPERATION 2.3: Run Migrations (if any)
    ├── [A] Apply database migrations
    ├── [E] Migration fails → Rollback, abort
    └── [T] Continue

UNIT PROCEDURE 3: Verify
├── OPERATION 3.1: Health Check
│   ├── [A] Run CN-OPS-001
│   ├── [C] All healthy?
│   ├── [E] Not healthy → Rollback
│   └── [T] Continue
│
├── OPERATION 3.2: Smoke Tests
│   ├── [A] Run critical path tests
│   ├── [C] All pass?
│   ├── [E] Fail → Rollback
│   └── [T] Continue
│
├── OPERATION 3.3: Monitor
│   ├── [A] Watch error rate for 10 minutes
│   ├── [C] Error rate < 1%?
│   ├── [E] High errors → Rollback
│   └── [T] Continue
│
└── OPERATION 3.4: Complete
    ├── [A] Post success to #deployments
    ├── [A] Update deployment log
    └── [S] Done

ROLLBACK PROCEDURE:
├── [A] docker tag rollback:latest
├── [A] docker-compose up -d
├── [A] Revert migrations (if applied)
├── [A] Verify health
├── [A] Notify team
└── [S] Investigate failure
```

---

## 9. Exception Handling Narratives

### CN-EXC-001: Circuit Breaker

```
PROCEDURE: Circuit Breaker
TRIGGER:   Failure threshold exceeded
OWNER:     All Services

STATES:
├── CLOSED:    Normal operation, requests pass through
├── OPEN:      Failing, requests rejected immediately
└── HALF-OPEN: Testing if service recovered

TRANSITIONS:

CLOSED → OPEN
├── [C] Failure count > threshold (5) in window (60s)
├── [A] Set state = OPEN
├── [A] Set open_until = NOW() + 30s
├── [A] Log circuit opened
└── [T] Reject all requests with 503

OPEN → HALF-OPEN
├── [C] NOW() > open_until
├── [A] Set state = HALF-OPEN
├── [A] Allow 1 test request
└── [T] Await result

HALF-OPEN → CLOSED
├── [C] Test request succeeded
├── [A] Set state = CLOSED
├── [A] Reset failure count
├── [A] Log circuit closed
└── [T] Resume normal operation

HALF-OPEN → OPEN
├── [C] Test request failed
├── [A] Set state = OPEN
├── [A] Set open_until = NOW() + 60s (backoff)
└── [T] Continue rejecting
```

### CN-EXC-002: Retry with Backoff

```
PROCEDURE: Retry with Exponential Backoff
TRIGGER:   Transient failure detected
OWNER:     All Services

UNIT PROCEDURE 1: Initial Attempt
├── [A] Execute operation
├── [C] Success?
├── [T] Yes → Return result
└── [T] No → Enter retry loop

UNIT PROCEDURE 2: Retry Loop
├── FOR attempt = 1 to max_retries (3)
│   ├── OPERATION: Calculate Delay
│   │   ├── [A] base_delay = 1000ms
│   │   ├── [A] delay = base_delay * (2 ^ attempt)
│   │   ├── [A] jitter = random(0, delay * 0.1)
│   │   ├── [A] final_delay = delay + jitter
│   │   └── [T] Continue
│   │
│   ├── OPERATION: Wait
│   │   ├── [W] Sleep(final_delay)
│   │   └── [T] Continue
│   │
│   ├── OPERATION: Retry
│   │   ├── [A] Execute operation
│   │   ├── [C] Success?
│   │   ├── [T] Yes → Return result
│   │   └── [T] No → Continue loop
│   │
│   └── OPERATION: Check Retryable
│       ├── [C] Error is retryable? (timeout, 5xx, network)
│       ├── [T] Yes → Continue loop
│       └── [T] No → Exit loop, return error
│
└── [E] Max retries exceeded → Return final error
```

---

## 10. Approval

| Role             | Name | Signature | Date |
|------------------|------|-----------|------|
| Engineering Lead |      |           |      |
| Operations Lead  |      |           |      |
| QA Lead          |      |           |      |

---

## Appendix A: Narrative Index

| ID          | Name                  | Trigger                    |
|-------------|-----------------------|----------------------------|
| CN-AUTH-001 | User Registration     | POST /auth/register        |
| CN-AUTH-002 | User Login            | POST /auth/login           |
| CN-CHAT-001 | Process Chat Message  | POST /triad/query          |
| CN-VOICE-001| Synthesize Voice      | POST /voice/synthesize     |
| CN-SONG-001 | Generate Song         | POST /song/generate        |
| CN-ECON-001 | Credit Trekcoin       | System event               |
| CN-ECON-002 | Debit Trekcoin        | Service request            |
| CN-PASS-001 | Record Journey        | User enters/exits          |
| CN-PASS-002 | Trigger Milestone     | User action                |
| CN-OPS-001  | Health Check          | GET /health                |
| CN-OPS-002  | Scheduled Maintenance | Cron Sunday 02:00          |
| CN-OPS-003  | Deployment            | Manual trigger             |
| CN-EXC-001  | Circuit Breaker       | Failure threshold          |
| CN-EXC-002  | Retry with Backoff    | Transient failure          |

## Appendix B: Revision History

| Version | Date     | Author       | Changes       |
|---------|----------|--------------|---------------|
| 1.0     | Feb 2026 | AirTrek Team | Initial draft |
