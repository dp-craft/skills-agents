<!-- LLM-PRIMARY: Module creation thresholds and storage decisions for Python targets. Referenced by PY-PLACEMENT-DECISION-TREE.md. -->

# PY Layer Boundaries

> **Purpose:** Define WHEN to create each type of module. For import rules (WHAT may import WHAT), see `PY-MODULE-DEPENDENCY-RULES.md`.

See `CLAUDE_PROJECT_SPECIFIC.md` Module Registry for current project examples.

## Module Creation Thresholds

| Module | Create When | MUST NOT Create When |
|---|---|---|
| Feature (`features/X/`) | Own API surface (route group, CLI command group) + service ≥3 methods + Removal Test passes + own lifecycle (CRUD or state machine) | Consumed by single feature, no surface, only extends existing surface |
| Domain (`domain/X/`) | Types/constants shared ≥2 features, registry/enum pattern, bounded concept with validation | Single-feature types, pure utility without domain semantics |
| Repository File | New persistence entity (1:1 file per entity). Exception: cross-cutting repos (backup, migration) may span entities | Fits in existing repository, no persistence |
| Service Module (`services/X/`) | Related services need shared types, wraps external API/protocol, complexity warrants internal org | Single file suffices, types-only (use `domain/`) |
| Utility (`lib/X.py`) | Pure functions (no state/persistence/side effects), ≥2 features OR >50 lines | <10 lines with 1 consumer, needs state, domain knowledge |

### Target-Specific

| Module | Target | Create When | MUST NOT Create When |
|---|---|---|---|
| FastAPI Router (`features/X/routes.py`) | Web API | Own route prefix (e.g., `/api/users`), composes service calls | Single endpoint fits existing router |
| CLI Command Group (`cli/X.py`) | CLI | Own command group (e.g., `app users`), composes service calls | Single command fits existing group |
| Background Worker (`workers/X.py`) | Async | Own task queue or scheduled job set, stateful processing | One-off task fits existing worker |
| Middleware (`middleware/X.py`) | Web API | Cross-cutting concern (auth, logging, rate limiting) | Feature-specific logic |

## Storage Decisions

| Data Type | Web API | CLI | Background Worker |
|---|---|---|---|
| Domain data (relational) | PostgreSQL / SQLite via ORM | SQLite / PostgreSQL | Same as API (shared DB) |
| Config | Env vars via `pydantic-settings` | Config file (TOML/YAML) | Env vars |
| Cache | Redis / in-memory (lru_cache) | — | Redis |
| Transient state | Request-scoped (Depends) | Module-level | Task-scoped |
| Secrets | Env vars / vault | Env vars / keyring | Env vars / vault |

## Dependency Injection Pattern

Python projects MUST use explicit dependency injection for testability:

| Pattern | Use When | Example |
|---|---|---|
| Function parameter | Pure functions, stateless operations | `def process(data: Data, config: Config) -> Result` |
| FastAPI `Depends()` | Route handlers, request-scoped deps | `def get_users(repo: UserRepo = Depends(get_repo))` |
| Constructor injection | Stateful services with lifecycle | `class EmailService: def __init__(self, client: SMTPClient)` |
| Module-level factory | Singleton services | `def get_db() -> Generator[Session, None, None]` |

FORBIDDEN: Global mutable state, import-time side effects, hidden dependencies via module-level variables.
