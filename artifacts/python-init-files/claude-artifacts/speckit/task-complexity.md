<!-- LLM-PRIMARY: Task complexity classification. Referenced by speckit.tasks and speckit.implement. -->

## Task Complexity Classification

### Complexity Markers

Every task in tasks.md MUST include a complexity marker `{X}` after the Task ID.

| Marker | Complexity | Signals | Workflow |
|---|---|---|---|
| `{S}` | Small | No business logic: config files, deps, scaffolding, renames, lint/format fixes. Type-only extensions (adding fields to existing interfaces), single-file edits <15 lines, barrel re-exports, deletions, i18n keys | Small Feature |
| `{M}` | Medium | Single responsibility, clear inputs/outputs, no cross-module side effects, no new interfaces, no state management changes. Single-file logic edits regardless of line count (e.g., extending one provider, one store action) | Medium Feature/Bugfix |
| `{M:UI}` | Medium UI | Visual-only UI change (color, spacing, text, icon) on a single component. **New pure renderers** (props-only, no hooks/store/container) regardless of JSX size | Medium Feature (UI) |
| `{L}` | Large | New interfaces/types, state management changes, cross-feature dependencies, multiple interacting modules | Large Feature/Bugfix |
| `{L:UI}` | Large UI | **Stateful** UI requiring containers + renderers, with store subscriptions, hooks, or cross-feature wiring. Pure renderers do NOT qualify — use `{M:UI}` | Large Feature (UI) |
| `{XL}` | Extra-Large | 3+ distinct responsibilities, multiple new interfaces AND state management AND cross-feature deps | **MUST be split** into 2-3 `{M}`/`{L}` tasks |

### Format

```text
- [ ] [TaskID] {Complexity} [P?] [Story?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **{Complexity}**: REQUIRED — one of `{S}`, `{M}`, `{M:UI}`, `{L}`, `{L:UI}`. See table above.
4. **[P] marker**: Include ONLY if task is parallelizable (different files, no dependencies on incomplete tasks)
5. **[Story] label**: REQUIRED for user story phase tasks only (e.g., [US1], [US2]). Setup/Foundational/Polish phases: NO story label.
6. **Description**: Clear action with exact file path

**Examples**:

- `- [ ] T001 {S} Create project structure per implementation plan`
- `- [ ] T005 {S} [P] Install dev dependencies via npm`
- `- [ ] T012 {M} [P] [US1] Create User model in src/models/user.py`
- `- [ ] T015 {L} [US1] Implement src/db/idb.ts — IDB schema v1 with stores and indexes`
- `- [ ] T031 {L:UI} [US1] Implement ChatWindow.tsx — chat container with empty state`

### XL Splitting Rule

If a task is classified as `{XL}` during `speckit.tasks`, it MUST be decomposed:

1. Identify the distinct responsibilities (look for semicolons, "and", comma-separated actions)
2. Split into 2-3 focused tasks, each classifiable as `{M}` or `{L}`
3. Add dependency ordering between the split tasks
4. `{XL}` MUST NOT appear in the final tasks.md — its presence means splitting failed

### Downgrade Checklist

Apply before finalizing complexity. Retrospective data shows ~30% of tasks are downgraded at runtime — catching these at planning time avoids wasted workflow overhead.

| If the task... | Then it's NOT | It's actually |
|---|---|---|
| Creates a new renderer with only props (no hooks, no store, no useEffect) | `{L:UI}` | `{M:UI}` |
| Adds fields to an existing interface/type (no new file, no new consumers) | `{M}` | `{S}` |
| Extends a single file with clear inputs/outputs (one provider, one store action) | `{L}` | `{M}` |
| Deletes code, removes a hook, or cleans up dead references | `{M}` | `{S}` |
| Adds a slot prop to an existing renderer + renders it | `{L:UI}` | `{M:UI}` |
| Is a barrel re-export, i18n key addition, or config entry | `{M}` | `{S}` |

**`{L:UI}` vs `{M:UI}` key signal**: Does the task require a **container** (store subscription, hook orchestration, cross-module wiring)? Yes → `{L:UI}`. If the component only receives props → `{M:UI}`.

### Classification Timing

**At `speckit.tasks` time** — classify and persist in tasks.md because:
- It can be reviewed and corrected before implementation starts
- The retrospective can compare planned vs actual (deviation tracking)
- XL tasks get split before they become expensive implementation problems

**At `speckit.implement` time**:
1. Read the `{X}` marker — this is the **planned** complexity
2. Use it to select the workflow (no re-classification needed)
3. If runtime assessment differs (e.g., a `{M}` task actually needs E2E tests), log as a **deviation** in the retrospective
4. Execute the workflow matching the **actual** complexity, not the planned one

### Reuse Gate (pre-task)

Before writing any UI task that renders an existing domain concept (e.g., "add skill set selector to header"):
1. Check snapshot `features/*.md` for components already rendering that concept
2. If found → task MUST say "compose `<ExistingContainer>` via slot prop", NOT "add new `Select` with props X, Y, Z"
3. Contracts MUST use `fooSlot: ReactNode` when a standalone container already owns the data+rendering

Violation signal: task describes new data props (`items[]`, `activeId`, `onChange`) for a concept that already has a container+renderer pair.

### Workflow Integrity Rules

These rules are NON-NEGOTIABLE and apply even under "do not stop" / continuous execution instructions:

1. **Every `{M}`, `{L}`, `{M:UI}`, `{L:UI}` task MUST use subagents** — the orchestrator MUST NOT write code directly when a subagent exists for that task type
2. **Every `{M}`, `{L}` task MUST have tests** — either written before (TDD) or verified after implementation
3. **Every `{L:UI}` task MUST have E2E tests** — Large Feature (UI) workflow requires e2e-test-writer
4. **Every `{M:UI}` task MUST run `[verify-visual]`** — visual regression check is mandatory
5. **Every task gets its own commit** — batching multiple tasks is a violation
6. **Velocity pressure does not override workflow** — "do not stop after phases" means skip the phase-end user confirmation, NOT skip workflow steps within tasks
