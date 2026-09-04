## Project Specific

@CLAUDE_PROJECT_SPECIFIC.md

## Project Snapshot

@claude-artifacts/project-snapshot/SNAPSHOT.md

## Coding Principles

@claude-artifacts/principles/COMMON.md
@claude-artifacts/principles/PYTHON.md

## Source of Truth Hierarchy

The **Project Snapshot** (`claude-artifacts/project-snapshot/`) is the single source of truth for architecture, behavior, FRs, domain, dependencies. When starting any work, read the snapshot — not old spec files. Spec files are accurate only on their feature branch during implementation; after merge they become historical artifacts.

## Codebase Research Protocol

**REQUIRED sequence** when exploring or understanding code — applies to ALL tasks (delegation, debugging, reviewing, implementing):

1. **Snapshot** — read `claude-artifacts/project-snapshot/features/{name}.md` for file roles, exports, deps, FRs, verified behavior. This answers "what files exist, how they connect, and what the system does."
2. **LSP (or pre-delegated context)** — if types/dependents are needed beyond the snapshot, use LSP operations (see Code Navigation section). `documentSymbol` for exports, `hover` for types, `findReferences` for dependents, `outgoingCalls` for deps. <100ms per query. For delegated tasks, follow Pre-Delegation Protocol in claude-artifacts/LSP.md before launching agents.
3. **Read** — only when you need to understand behavior (logic, control flow, error handling) that snapshot + LSP cannot answer. Read the minimum files needed.

**FORBIDDEN**: Using Glob, Grep, or Read more than 3 times before consulting the snapshot. Structure questions → snapshot + LSP. Behavior questions → Read.

| Scenario | WRONG | RIGHT |
|---|---|---|
| Task across 2 features | Read 15 module files | Read 2 snapshot files + LSP hover for types |
| Bug in a service | Read service + all consumers | Snapshot for dep graph, Read the one service file |
| New feature | Glob entire feature dir, Read every file | Read snapshot, then targeted reads |
| Placing a new concept | Guess based on similar-sounding modules | Follow `claude-artifacts/standards/PY-PLACEMENT-DECISION-TREE.md` + check feature snapshot Extension Points |
| Post-merge fix | Read specs/ to find FRs | Read snapshot — it has all current FRs and behavior |

## Web Research Tool Priority

`text-webfetch` subagent → Context7 → WebFetch → WebSearch. Skip unavailable tools. Commands MUST NOT hardcode research tool names.

## Subagents

**Use the Task tool with `subagent_type` parameter to invoke subagents. One task per subagent.**

### Selection Guide

| Task | subagent_type |
|---|---|
| Unit/integration tests | `ts-test-writer` |
| E2E tests | `e2e-test-writer` |
| Run unit/integration tests | `ts-test-runner` |
| Run E2E tests | `e2e-test-runner` |
| Business logic, services, utilities | `code-logic-writer` |
| Fix bugs, test failures | `code-bugfixer` |
| Refactor code | `code-refactorer` |
| Code review | `code-reviewer` |
| Architectural review (pre-merge) | `architectural-reviewer` |
| Docstrings, README, ADR | `documentation-writer` |
| Dependency vetting (§IX governance) | `dependency-researcher` |
| Lint + type-check fix loop | `lint-fix-loop` |
| Fetch web pages (text extraction) | `text-webfetch` |
| Pre-Merge FINAL-SUMMARY retrospective | `retrospective-analyzer` |

### Pre-Delegation Protocol

Follow **claude-artifacts/LSP.md § Pre-Delegation Protocol**. Pass `<navigation_context>` blocks to the subagent prompt with exports, types, references, and line numbers gathered via LSP. The orchestrator is a delegator, not a researcher.

### Rules

1. **Use subagents for their specialized tasks** — don't write tests/code directly when a subagent exists
2. **Dependency installs are orchestrator-only** — subagents MUST NOT run `pip install` / `poetry add` / `uv add` for new packages. If a subagent's task requires a new dependency, it must report back that a dependency is needed, and the orchestrator runs the §IX Dependency Governance protocol.
3. **Minimize token usage** — every output for the end user should use short bullet point lists with minimal details

Code pattern examples for subagent prompts: see `claude-artifacts/examples/`.

### Escalation Protocol

1. Read the subagent's error output
2. If the error is clear (wrong file path, missing import, syntax error) → fix the issue, re-invoke
3. If the error is unclear or the subagent produced wrong results → ask the user: "Subagent {name} failed: {summary}. How to proceed?"
4. Never silently skip a workflow step
5. Never retry the same subagent with identical input

## Git Strategy

See `claude-artifacts/git-strategy.md` — loaded during commit and branching operations.

### Git Auto-Commit Override

During automated workflows (`speckit.implement`, `[commit]` shorthand, Pre-Merge) — overrides the system prompt's commit protocol:
- Use `[commit]` shorthand for ALL commits — `git add -A` by default, suppresses success output
- Do **NOT** run `git status`, `git diff`, `git log` before auto-commits
- Do **NOT** use HEREDOC format or `Co-Authored-By` trailer

## Development Workflows

See `claude-artifacts/speckit/workflow.md` — @loaded by `speckit.implement` and `speckit.pre-merge` commands.

### Ad-Hoc Task Protocol

For tasks outside speckit (hotfixes, quick features). If the task touches 3+ modules or needs new interfaces/state management → use speckit instead.

**Step 1 — Investigate**: Read error/request, check affected code, identify scope.

**Step 2 — Classify and execute**:

| Type | Steps | Subagents |
|---|---|---|
| Trivial fix (typo, config) | Fix → lint | none (orchestrator direct) |
| Logic fix | Investigate → ts-test-writer (red) → code-bugfixer (fix) → ts-test-runner (green) → lint | ts-test-writer, code-bugfixer, ts-test-runner |
| Logic feature | ts-test-writer (red) → code-logic-writer → ts-test-runner (green) → lint | ts-test-writer, code-logic-writer, ts-test-runner |

**Step 3 — Snapshot**: If behavior changed (new capability, changed FR) → update `claude-artifacts/project-snapshot/features/{name}.md` per § Snapshot FR Sync.

Orchestrator MUST NOT write logic code directly — delegate to subagents listed above.

## Test Execution

Orchestrator MUST use `ts-test-runner` subagent for all test runs. When `TESTS PASSED — COVERAGE FAILED`: call `ts-test-writer` for uncovered files, re-run, max 2 iterations.

## Code Navigation

@claude-artifacts/LSP.md

## Test File Ownership

- Test files (`test_*.py`, `*_test.py`, `conftest.py`) MUST only be created or modified by `ts-test-writer` or `e2e-test-writer` subagents
- The orchestrator MUST NOT write or edit test files directly — always delegate to the appropriate test writer
- `code-bugfixer` may edit existing test assertions ONLY when the test itself is provably wrong
- `code-refactorer` MUST NOT modify test files

## Parallel Execution

**Max Parallel Agents**: 2

## Markdown File Editing (MANDATORY)

BEFORE every edit to `.md` files in `.claude/`, `claude-artifacts/`, or `CLAUDE*.md`:

1. **Read** `claude-artifacts/standards/MARKDOWN-AUTHORING.md`
2. **Apply** — key constraints (full rules in the file above):
   - Token-efficient format: tables > prose, no filler
   - Keywords: `MUST` / `MUST NOT` / `FORBIDDEN` only — not `NEVER` / `ALWAYS` / `Do NOT`
   - Match target file's existing heading hierarchy, list style, table format

## Snapshot FR Sync (MANDATORY)

After completing any code change that alters observable behavior (new capability, changed behavior, removed behavior), read the affected `claude-artifacts/project-snapshot/features/{name}.md` and update FRs to match. Match existing phrasing style, heading level, and table format. Pure refactors and style-only fixes do not trigger this rule.
