<!-- LLM-PRIMARY: Worked examples of past placement decisions for Python projects. Use for pattern matching when the decision tree is ambiguous. -->

# Placement Decisions — Worked Examples (Python)

> **Purpose:** Learn from placement decisions. Each example explains WHAT was placed WHERE and crucially WHY.

---

## 1. Email Service — External API Wrapper

**Concept:** SMTP/API-based email sending with templates, retry logic, and bounce handling.

**Characteristics:**
- Wraps external API (SMTP / SendGrid / SES)
- Used by 2 features (Users: welcome email, Orders: confirmation email)
- Has retry logic and connection management
- No own API surface

**Placement:**

| Concern | Placed In | Why |
|---|---|---|
| Email client + retry logic | `services/email/` | Wraps external protocol (SMTP), connection management |
| Email templates | `services/email/templates/` | Co-located with the service that renders them |
| Send-email call in Users | `features/users/service.py` | Users service calls email service |
| Send-email call in Orders | `features/orders/service.py` | Orders service calls email service |

**NOT placed in:**
- `features/email/` — No own API surface, no own routes. It's a service consumed by features.
- `lib/email.py` — Email sending has side effects (SMTP connection), not a pure utility.

**Decision tree:** Q1->NO -> Q3->NO -> Q5->YES (wraps external SMTP protocol) -> CREATE `services/email/`

---

## 2. Feature Flags — Domain + Shared Service

**Concept:** Boolean toggles gating features, stored in DB, exposed via admin API.

**Characteristics:**
- Shared across all features
- Types and registry are stateless constants
- Has API surface (admin toggle endpoint)
- Persists to database

**Placement:**

| Concern | Placed In | Why |
|---|---|---|
| Flag types + registry | `domain/feature_flags/` | Shared types/constants, registry pattern |
| Flag repository | `db/repositories/feature_flag_repo.py` | New persistence entity |
| Flag service | `services/feature_flags/` | Shared across all features, stateful lifecycle |
| Admin routes | `features/admin/routes.py` | Admin feature owns the toggle UI |

**NOT placed in:**
- `features/feature_flags/` — Consumed by every feature; it's infrastructure, not a feature.
- `lib/feature_flags.py` — Has state (DB persistence), not a pure utility.

---

## 3. User Management — Full Feature Module

**Concept:** User CRUD, authentication, profile management.

**Characteristics:**
- Has own API surface (`/api/users`, `/api/auth`)
- Has own DB tables (users, sessions)
- Has own service with 10+ methods
- Passes removal test

**Placement:**

| Concern | Placed In | Why |
|---|---|---|
| DB models | `db/models/user.py` | ORM model (1:1 with table) |
| Repository | `features/users/repository.py` | User persistence operations |
| Service | `features/users/service.py` | Business logic (create, authenticate, etc.) |
| API routes | `features/users/routes.py` | Own route prefix `/api/users` |
| API schemas | `features/users/schemas.py` | Request/response models |
| Shared user types | `domain/entities/user.py` | User entity used by other features |
| Password hashing | `lib/crypto.py` | Pure utility, could be reused |

**Decision tree:**
- DB persistence: Q1->YES, Q2->YES -> CREATE model + repository
- API surface: Q3->YES -> Q4->YES (removal test passes) -> CREATE `features/users/`
- Shared types: Q6->YES -> Q7->YES -> CREATE `domain/entities/user.py`
- Password hashing: Q6->YES -> Q8->YES (pure function) -> CREATE `lib/crypto.py`

---

## 4. Background Job Processing — Service Layer

**Concept:** Celery/asyncio task queue for deferred processing (emails, reports, cleanup).

**Characteristics:**
- No own API surface (triggered by other features)
- Wraps execution pattern (task scheduling, retry, dead letter)
- Used by multiple features
- Has own connection management (broker)

**Placement:**

| Concern | Placed In | Why |
|---|---|---|
| Task runner / broker config | `services/task_queue/` | Wraps execution protocol (Q5) |
| Email task | `workers/email_worker.py` | Specific background job |
| Report task | `workers/report_worker.py` | Specific background job |
| Task types/schemas | `domain/tasks/` | Shared task payload types |

**Decision tree:** Q5->YES (wraps task scheduling protocol) -> CREATE `services/task_queue/`

---

## 5. Encryption Utility — Pure Library

**Concept:** AES encryption for API keys at rest.

**Characteristics:**
- Pure crypto operations (encrypt, decrypt, derive key)
- No own API surface
- Used by 1 feature currently (Settings) but reusable
- No persistence of its own

**Placement:**

| Concern | Placed In | Why |
|---|---|---|
| Crypto functions | `lib/crypto.py` | Pure utility, no state, no domain semantics |
| Encryption config | `config.py` | App-level configuration |

**NOT placed in:**
- `services/crypto/` — Not wrapping an external API. Python's `cryptography` lib is a local dependency, not a protocol.
- `domain/encryption/` — Not shared types/constants. These are operations, not domain concepts.

**Decision tree:** Q1->NO -> Q3->NO -> Q5->NO (not protocol wrapper) -> Q6->NO (single consumer) -> Q9->YES -> EXTEND feature. Exception: >50 lines of pure functions → `lib/` placement justified.
