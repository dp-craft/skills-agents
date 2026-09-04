<!-- LLM-PRIMARY: Import direction and per-directory import rules for Python projects. -->

# PY Module Dependency Rules

## Core Principles

### Direction

```
Entry Point (routes/CLI) ──► Service ──► Repository ──► Infrastructure (DB driver)
                               ▲            ▲
                               │            │
                             Domain ◄──── lib/
```

Imports MUST flow downward. No layer may import from a layer above it.

### Cross-Feature

- MUST NOT import from each other's internal modules
- Cross-feature data: shared service, `__init__.py` re-export, or `domain/`
- Shared types → `domain/entities/` or `domain/schemas/`

### Type Ownership

| Type Category | Defined In | Used By |
|---|---|---|
| ORM models (persistence shape) | `db/models/` or feature `models.py` | Repositories only |
| Domain Entities / Value Objects | `domain/entities/` | services, entry points, repositories |
| API Schemas (request/response) | `features/*/schemas.py` | routes/controllers, serializers |
| Shared utility types | `lib/*.py` | any module |

## Import Rules

| Directory | Role | MAY Import From | MUST NOT Import From |
|---|---|---|---|
| `features/*/routes.py` | Entry Point | own feature services, `domain/*`, `lib/` | `db/*` directly, other feature internals |
| `features/*/service.py` | Service | own feature repository, `domain/*`, `lib/` | other feature services directly |
| `features/*/repository.py` | Repository | infrastructure (`db/`), `domain/*`, `lib/` | feature routes, other feature repos |
| `features/*/schemas.py` | API Schemas | `domain/*` (type-only) | `db/*`, other features |
| `features/*/__init__.py` | Barrel | own feature public API | — (re-export only) |
| `features/*/utils/` | Scoped helper | own feature internals, `lib/` | `db/*`, `services/*`, other features |
| `services/*/` | Shared Service | `db/*`, `lib/`, `domain/*` | feature code |
| `db/` | Infrastructure | `domain/*` (models), `lib/` | feature code, `services/*` |
| `domain/` | Domain | `lib/` | `db/*`, `services/*`, feature code |
| `lib/` | Utility | nothing app-level (stdlib + 3rd-party only) | — |
| `config.py` | Config | `lib/`, stdlib, `os.environ` | feature code, `db/*` |

### CLI / Background Workers

| Directory | Role | MAY Import From | MUST NOT Import From |
|---|---|---|---|
| `cli/` | CLI Entry Point | `services/*`, `domain/*`, `lib/` | `db/*` directly, feature routes |
| `workers/` | Background Tasks | `services/*`, `domain/*`, `lib/` | feature routes, `db/*` directly |
| `middleware/` | Cross-cutting | `lib/`, `domain/*`, `config` | feature code, `db/*` |

### Normalization

`db/ → services/*` and `domain/ → services/*` are FORBIDDEN. This prevents circular dependencies.

Project-specific import exceptions: see `CLAUDE_PROJECT_SPECIFIC.md` § Import Exceptions.
