<!-- LLM-PRIMARY: This file is optimized for LLM consumption. Token efficiency takes priority over human readability. -->
<!-- Technology-agnostic principles. Language/framework-specific rules live in claude-artifacts/principles/ (TYPESCRIPT.md, UI.md, PYTHON.md, RUST.md). -->

## Core Principles

### 0. Scope Discipline (MANDATORY)

MUST execute only what is requested — nothing more, nothing less.

| Rule | MUST NOT |
|---|---|
| File creation | Create new files unless editing existing files cannot accomplish the task |
| Documentation | Create `*.md` / README files unless explicitly requested |
| Edit preference | Use Write when Edit suffices — build on existing code |
| Scope creep | Add features, refactors, configurability, or abstractions beyond what was asked |
| Unchanged code | Add docstrings, comments, type annotations, error handling, or validation to code you did not change |

### I. Simplicity and Minimalism

- MUST follow the principle of simplicity
- Complex solutions, frameworks, libraries, and dependencies MUST be avoided unless essential, or unless implementation complexity without them would add high risk
- Code MUST be self-explanatory, eliminating unnecessary overhead
- **Reuse-before-reimplement**: Before specifying or building UI for an existing domain concept, check the project snapshot for components that already render it. If found → compose (e.g., slot props in React, DI in Spring), never re-implement. Spec/task MUST reference existing component by name when reuse is intended
- Conduct web research to identify current best practices before technology decisions. Use the `/research:*` commands — pick the best fit:
  - **What to build / how**: `technical` (implementation approaches) · `options` (compare side-by-side)
  - **What exists**: `open-source` (find libraries) · `landscape` (map the space) · `competitive` (who else does this)
  - **Should we / can we**: `feasibility` (go/no-go) · `history` (what's been tried)
  - **Go deep**: `deep-dive` (thorough investigation of any topic)

### II. Single Responsibility Orientation

- Every module or feature MUST have a single, well-defined responsibility
- Responsibility MUST be encapsulated in a standalone directory with a single entry point
- Cross-dependencies MUST be minimized
- A module that handles more than one concern MUST be split before it grows further

#### Responsibility Assignment Protocol

**Golden Rule**: A feature that needs another feature's state MUST observe that state through the state manager (e.g., Zustand store, Spring service), not require the other feature to export integration points.

| Test | Question |
|---|---|
| Direction | Does A need B, or STATE that B owns? If state → A observes, A MUST NOT import from B |
| Removal | Delete feature X — do files outside `features/X/` change? If yes → SRP violation |
| Ownership | Data + Behavior + UI for a concern MUST point to the same feature |

Full protocol (Direction, Removal, Ownership, Cross-Cutting, Data Flow Audit, High-Level UI State): see `claude-artifacts/standards/RESPONSIBILITY-RULES.md` — MUST be read when implementing cross-feature interactions.

#### Module Encapsulation

- Every feature module MUST define a public API boundary (e.g., barrel file in TS, package visibility in Java/Kotlin). Internal implementation details MUST be hidden from consumers
- Cross-feature imports MUST use the public API — reaching into internal paths from outside the feature is FORBIDDEN
- UI-tier code MUST NOT import types from infrastructure layers. Feature-local types or public API re-exports MUST be used instead
- Public API surface: state managers, entry-point components, and explicitly shared types. Internal: views, hooks, helper functions

#### Code Placement

Apply Package Cohesion / Common Closure Principle: things that change together and are used together should live together.
Reusable codes (Helpers/Utils/Libs) live next to their consumers. Move up only when shared across siblings.

| Consumers | Location |
|---|---|
| 1 file | Same file or same directory |
| ≥2 files in 1 module (now or planned) | `{module}/utils/` |
| ≥2 files across modules (now or planned) | `src/lib/` (or language equivalent) |

"Planned" = spec, research, or design artifacts indicate future reuse — not speculation.

- `utils/` is internal to its parent module — MUST NOT be exported via barrel
- A `utils/` function that gains consumers outside its module → promote to shared lib
- When a shared lib function's consumers shrink to a single module → move it back down (colocation over inertia)
- **Anti-pattern**: putting module-specific helpers in shared lib because they look "utility-like"

### III. Code Quality Assurance

- The project's type system MUST be used in strict mode with zero tolerated type errors
- Application code MUST use explicit types everywhere. Type casting to incompatible types MUST be avoided. Test code may use relaxed typing where necessary
- Linter and type checker MUST be run and pass before committing code changes (after test and implementation completion)
- Naming conventions MUST be consistent across the codebase
- Magic constants, magic strings, and hardcoded config values are FORBIDDEN — all such values MUST be named constants or pulled from a common config file
- Environment-specific or tunable values (timeouts, default theme, feature flags, URLs, etc.) MUST live in a centralized config, never burned into application code

#### Constant Ownership

- Each configuration value or default constant MUST be defined in exactly one location and imported everywhere else — multiple named constants with the same value across different files is a DRY violation
- Runtime config (fetched from server or env vars) MUST be loaded once at app initialization and cached — never re-fetched per operation

- All changes MUST be reviewed before merge, verifying:
  - Correctness of logic and adherence to requirements
  - No regressions or broken existing behavior
  - Consistent naming, structure, and patterns with the rest of the codebase
  - No unnecessary complexity, dead code, or leftover debug artifacts
  - Test coverage is adequate for the change

#### Paradigm Rules (MANDATORY)

- Pure business logic — side effects (I/O, DB, HTTP, logging) at system boundaries only
- Immutable by default — no shared mutable state; state owned by single module, accessed via public API
- Declarative transformations over imperative iteration (where language idiom supports it)
- Functions + types over classes — classes when language requires; behavior MUST NOT live in data containers

#### Quality Metrics

| Metric | Target | Minimum |
|---|---|---|
| Function/method length | 15 lines | 20 lines max |
| Parameters | 3 max (use object/data class for more) | — |
| Cyclomatic complexity | 5 max | — |
| Nesting depth | 3 levels max | — |
| Test coverage | 100% | 90% |
| Unit test speed | <1ms/test | — |
| Integration test speed | <100ms/test | — |
| E2E test speed | <5s/test | — |

Code patterns: see language-specific principles file for pattern references.

### IV. Testing Excellence

- After code changes that alter observable behavior, snapshot FRs MUST be updated — see CLAUDE.md § Snapshot FR Sync
- TDD is REQUIRED — tests MUST be written first and MUST fail before implementation
- Coverage: 100% goal, 90% minimum (lines, branches, functions)
- Test files are exempt from §III strict rules (`let` in setup, mock mutations, relaxed typing)

Testing by role, patterns, exemptions: `claude-artifacts/standards/TS-TESTING.md`, `claude-artifacts/standards/TS-E2E-TESTING.md`

### V. User Experience Consistency

- Interface consistency is non-negotiable
- UI component library (defined in `CLAUDE_PROJECT_SPECIFIC.md`) MUST be used consistently across all UI components
- Recurring UX testing MUST be performed to catch regressions
- Framework-specific UI rules (component positioning, theme integrity, etc.) are defined in the applicable UI principles file

### VI. Performance Awareness

- Write correct, simple code first — optimize only when a measurable problem exists
- MUST avoid common pitfalls: memory leaks (unreleased references, missing cleanup), unnecessary re-renders, and obviously inefficient algorithms (e.g., O(n²) when O(n) is straightforward)
- MUST NOT hold references to objects that are no longer needed
- Bundle size MUST be considered when adding dependencies — prefer native or lightweight alternatives
- Caching and memoization MUST be justified by measured performance data — not assumed or applied preemptively
- Performance profiling is warranted only when users experience degradation, not as a routine gate

### VII. Security Compliance

- Every third-party dependency MUST be vetted for security posture before adoption (license, known CVEs, maintenance status, scope of access)
- API keys and credentials MUST never be stored in source code or transmitted beyond their intended provider
- User data MUST only be persisted in explicitly approved storage locations documented in the feature spec

### VIII. Data Access Layering

- Persistence operations MUST flow through a defined layer stack: **Entry Point → State Manager → Service → Infrastructure**
- Feature code MUST NOT import from the infrastructure layer directly — only from service files or via the feature's state manager
- Each domain entity with persistence MUST have a corresponding service file
- State mutations that involve persistence MUST be routed through the state manager that owns that state slice — no "write-then-reload" patterns

#### Target Bindings

| Abstract Layer | Browser (React/PWA) | Node Backend | Electron Main | Chrome Extension |
|---|---|---|---|---|
| Entry Point | Container / Hook | Controller / Route handler | IPC handler | Message handler |
| State Manager | Zustand store | Service class (singleton) | Module-level state | Background state |
| Service | `db/*.ts` | Repository module | Service module | Storage service |
| Infrastructure | `db/idb.ts` (IndexedDB) | DB driver (pg, SQLite) | `fs` / SQLite | `chrome.storage` API |

Rules reference abstract layer names. Concrete bindings are in target-specific principles files and `TS-LAYER-BOUNDARIES.md`.

#### Atomic Multi-Field Updates

When a single user action modifies multiple fields on the same entity, changes MUST be combined into a single store action. The read→modify→write pattern is NOT concurrency-safe: two concurrent calls read the same stale snapshot, last writer silently reverts the first.

| Pattern | Status | Example |
|---|---|---|
| Single action, multiple fields | **Required** | `setProviderAndModel(id, provider, model)` |
| Two `void` async calls on same entity | **Forbidden** — race condition | `void setProvider(id, x); void resetParams(id);` |
| Sequential awaited calls | **Allowed** — safe (ordered), slower | `await setProvider(id, x); await resetParams(id);` |
| Composite action | **Preferred** — single read→modify→write, single DB write | `setProviderAndResetParams(id, provider)` |

When adding a store action called alongside an existing action on the same entity → extend the existing action or create a composite.

#### Module Dependency Direction

Imports MUST flow downward through layers: Entry Point → State → Service → Infrastructure. View/renderer components (where applicable) sit outside this chain — they receive data only via props/bindings from containers/controllers. Project-specific layer tables are defined in the applicable target principles file.

#### Debugging

`claude-artifacts/standards/TS-DEBUGGING-RULES.md` — Rules 0-8, Red Flags Checklist, Anti-Patterns, Escalation protocol. MUST be followed for all bug investigations.

### IX. Dependency Governance

New dependencies MUST follow the 5-step protocol in `claude-artifacts/standards/TS-DEPENDENCY-GOVERNANCE.md` — exhaust native/existing alternatives first, then research → ADR → user approval → install.

### X. Feature Flag Governance

Non-trivial features MUST be gated behind feature flags. Full rules and lifecycle: `claude-artifacts/standards/FEATURE-FLAG-GOVERNANCE.md`
