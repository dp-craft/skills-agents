<!-- LLM-PRIMARY: Deterministic decision tree for placing new concepts into a Python codebase. Follow mechanically — do not skip steps. -->

# PY Placement Decision Tree

> **Purpose:** Given a new concept's characteristics, determine the correct module location. Follow this tree mechanically from top to bottom.

## How to Use

For each new concept (entity, behavior, API surface, utility) in a feature plan:

1. Answer the questions in order
2. Follow the arrow to the next question or terminal node
3. The terminal node gives the exact directory and file pattern
4. If a concept spans multiple terminal nodes, it decomposes into multiple files (one per node)

---

## The Tree

```
START: "What is this concept?"
  |
  +-- Q1: Does it persist data?
  |     |
  |     +-- YES --> Q2: Is it a new entity type (new table/collection)?
  |     |     |
  |     |     +-- YES --> CREATE: model + repository
  |     |     |           Backend: db/models/X.py + features/X/repository.py + migration
  |     |     |           CLI: db/models/X.py + db/repositories/X.py
  |     |     |           See: PY-LAYER-BOUNDARIES.md § Repository File
  |     |     |
  |     |     +-- NO --> EXTEND: existing repository for that entity
  |     |               (add method to the repo that owns the entity)
  |     |
  |     +-- NO --> continue to Q3
  |
  +-- Q3: Does it have its own significant surface (API route group, CLI command group, worker domain)?
  |     |
  |     +-- YES --> Q4: Does it pass the Removal Test?
  |     |     |         (Can you delete it without changing other features?)
  |     |     |
  |     |     +-- YES --> CREATE: features/X/ (full feature module)
  |     |     |           __init__.py, routes.py, service.py, repository.py, schemas.py, models.py
  |     |     |           See: PY-LAYER-BOUNDARIES.md § Feature Module
  |     |     |
  |     |     +-- NO --> EXTEND: existing feature that owns the API surface
  |     |               (add routes/services to that feature)
  |     |
  |     +-- NO --> continue to Q5
  |
  +-- Q5: Does it wrap an external API, protocol, or execution pattern?
  |     |   (HTTP client, message queue, email, OAuth, streaming)
  |     |
  |     +-- YES --> CREATE: services/X/ (service module)
  |     |           Even if consumed by only 1 feature — protocol complexity
  |     |           warrants isolation. See: PY-LAYER-BOUNDARIES.md § Service Module
  |     |
  |     +-- NO --> continue to Q6
  |
  +-- Q6: Is it shared across >= 2 features?
  |     |
  |     +-- YES --> Q7: Is it types/constants/registry (stateless)?
  |     |     |
  |     |     +-- YES --> CREATE: domain/X/ (domain module)
  |     |     |           Includes: __init__.py, types.py, optional data files
  |     |     |           See: PY-LAYER-BOUNDARIES.md § Domain Module
  |     |     |
  |     |     +-- NO --> Q8: Is it pure logic (no state, no side effects)?
  |     |           |
  |     |           +-- YES --> CREATE: lib/X.py (utility)
  |     |           |           See: PY-LAYER-BOUNDARIES.md § Utility
  |     |           |
  |     |           +-- NO --> CREATE: services/X/ (shared service)
  |     |                      Service if: stateful, wraps I/O, manages lifecycle
  |     |
  |     +-- NO --> Q9: Does it belong to an existing feature?
  |           |
  |           +-- YES --> EXTEND: that feature's internal module
  |           |           (service.py, repository.py, schemas.py, or utils/)
  |           |
  |           +-- NO --> This should not happen. Re-examine Q6.
  |                      If genuinely used by 0-1 features and has no surface,
  |                      it's likely a helper within a single feature.
```

**Note on persistence:** Q1 addresses primary persistence (database tables). For secondary storage (Redis cache, config files, env vars), see the Storage Decisions table in PY-LAYER-BOUNDARIES.md.

**Note on multi-concern concepts:** Most non-trivial concepts have MULTIPLE concerns (e.g., persistence + types + API). Run the tree once per concern.

---

## Decomposition Rule

Most non-trivial features produce MULTIPLE placements:

| Concern | Placement | Example |
|---|---|---|
| Types shared across features | `domain/X/` | `domain/permissions/` |
| Persistence (models + repos) | `db/models/X.py` + `features/X/repository.py` | `db/models/user.py` |
| External API/protocol | `services/X/` | `services/email/`, `services/s3/` |
| Pure business logic | `lib/X.py` | `lib/token_utils.py` |
| API surface | `features/X/routes.py` + `schemas.py` | `features/users/routes.py` |
| Background processing | `workers/X.py` | `workers/email_worker.py` |

**Run the tree once per concern, not once per feature.**

---

## Ambiguity Escape Hatch

If the tree doesn't give a clear answer:

1. **Check worked examples** in `claude-artifacts/examples/python-placement-decisions.md`
2. **Apply the Removal Test** (RESPONSIBILITY-RULES.md Rule 2): if removing this concept would require changing files in >1 feature directory, it's a shared concern and belongs in domain/, lib/, or services/
3. **Ask the user**: "Concept X could live in [A] or [B]. [A] because [reason]. [B] because [reason]. Which do you prefer?"

---

## Validation Checklist

After placement, verify:

- [ ] Each file is in the correct layer per PY-MODULE-DEPENDENCY-RULES.md
- [ ] Import direction flows downward (Route → Service → Repository → Infrastructure)
- [ ] No feature imports another feature's internals (`__init__.py` only)
- [ ] Direction Test passes (RESPONSIBILITY-RULES.md Rule 1)
- [ ] Removal Test passes (RESPONSIBILITY-RULES.md Rule 2)
