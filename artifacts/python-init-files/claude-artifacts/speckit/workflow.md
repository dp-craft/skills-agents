<!-- LLM-PRIMARY: Optimized for LLM token efficiency. Shorthands defined once, expanded inline during execution. -->

## Development Workflows

### Shorthands

- [kill-port] = bash tools/scripts/kill_port.sh 5173 — kill leftover Vite dev server before E2E runs to prevent OOM
- [lint] = npm run lint && npx tsc --noEmit — Biome auto-fixes formatting + safe lint errors, then type-check
- [commit] = `bash tools/scripts/git-autocommit.sh "{type}({scope}): {description}"` — no file args = `git add -A` (default), with file args = stage only those. Suppresses success output.
- [phase-end] = [regress] → batch `sed` to mark completed tasks as `[X]` in tasks.md → [commit] the update as `chore: mark phase {NN} tasks complete`
- [review] = 1. code-reviewer — quality check 2. Conditional: silent-failure-hunter (if error handling changed) · pr-test-analyzer (if tests changed) · type-design-analyzer (if types changed) 3. Fix critical findings (severity > 7/10), re-run code-reviewer once max
- [review-lint-commit] = [review] → [lint] → [commit]
- [verify-e2e] = [kill-port] → e2e-test-runner (--project=chromium)
- [verify-visual] = [kill-port] → e2e-test-runner (--project=visual). On failure with "snapshot doesn't exist": run `npm run test:visual:update`, then [commit] the updated baselines as `chore: update visual baselines`, report new baselines to user for review
- [verify-all] = [kill-port] → ts-test-runner + e2e-test-runner (--project=chromium) + e2e-test-runner (--project=visual)
- [lint-theme] = bash tools/scripts/lint-theme.sh — verify all CSS tokens registered in @theme inline
- [bug-repro] = code-bugfixer — reproduce and isolate the bug
- [audit-tests] = ts-test-runner — run existing tests for the affected feature. Then [write-test-green: audit] — are related tests present? Do they cover the broken behavior? Are any false positives (pass despite the bug)? Fix false-positive tests or add missing coverage. **Applies to**: functional bugs only. **Skip for**: trivial bugs (wrong text/order) and design bugs (color, overflow, visibility)
- [bug-fix] = code-bugfixer — implement minimal fix (Green)
- [write-test-red: X] = ts-test-writer (`mode: red`) — write X + enforce Red internally. X = test, regression test, unit/integration tests. For E2E tests use e2e-test-writer (`mode: red`)
- [write-test-green: X] = ts-test-writer (`mode: green`) — write X for existing code + enforce Green internally. For E2E use e2e-test-writer (`mode: green`). Used in: `[audit-tests]`, coverage fix iterations
- [green] = ts-test-runner — confirm test passes (TDD Green phase)
- [regress] = ts-test-runner — run existing tests to catch regressions
- [implement: X] = X — implement (Green). X = code-logic-writer, ui-writer

### Bugfix Workflow Selection

| Bug type                                                                   | Workflow | Key difference |
|----------------------------------------------------------------------------|---|---|
| Trivial (e.g. wrong text, wrong order, typo)                               | Small Feature | Direct fix, no tests needed |
| Design (e.g. color, overflow, visibility, layout)                          | Medium Feature (UI) or Medium Bugfix (UI) | Visual verification, no [audit-tests] |
| Functional, non-UI (logic, data, state)                                    | Medium/Large Bugfix | [audit-tests] + unit regression test |
| Functional, UI-affecting (broken interaction, missing element, UI blocker) | Medium/Large Bugfix (UI) | **MUST** include E2E regression test — [audit-tests] + E2E + unit tests |

**Rule:** Any bug that blocks a user flow in the UI (button doesn't work, element missing, interaction broken) MUST use a Bugfix (UI) workflow to ensure E2E coverage. Size (Medium vs Large) depends on scope and blast radius.

### Workflow Definitions

#### Small Feature

1. Execute change directly (config, deps, scaffolding, renames, lint/format)
2. [lint]
3. [commit]

#### Medium Feature

1. [write-test-red: test]
2. [implement: code-logic-writer]
3. [green]
4. [lint]
5. [commit]

#### Medium Bugfix

1. [bug-repro]
2. [audit-tests]
3. [write-test-red: regression test]
4. [bug-fix]
5. [green]
6. [lint]
7. [commit]

#### Medium Bugfix (UI)

1. [bug-repro]
2. [audit-tests]
3. [write-test-red: E2E test] via e2e-test-writer — regression test exposing bug
4. [write-test-red: unit/integration regression test]
5. [bug-fix]
6. [verify-all] — confirm passes
7. [lint]
8. [commit]

#### Medium Feature (UI)

1. [implement: ui-writer]
2. [regress]
3. [verify-visual]
4. [lint]
5. [commit]

#### Large Feature

1. [write-test-red: test]
2. [implement: code-logic-writer]
3. [green]
4. [review-lint-commit]

#### Large Feature (UI)

1. [write-test-red: E2E test] via e2e-test-writer
2. [write-test-red: unit/integration tests]
3. [implement: code-logic-writer or ui-writer]
4. [verify-all] — confirm passes
5. [review-lint-commit]

#### Large Bugfix

1. [bug-repro]
2. [audit-tests]
3. [write-test-red: regression test]
4. [bug-fix]
5. [green]
6. [review-lint-commit]

#### Large Bugfix (UI)

1. [bug-repro]
2. [audit-tests]
3. [write-test-red: E2E test] via e2e-test-writer — regression test exposing bug
4. [write-test-red: unit/integration regression test]
5. [bug-fix]
6. [verify-all] — confirm passes
7. [review-lint-commit]

#### Refactor

1. ts-test-runner — green baseline (all tests must pass before refactoring)
2. code-refactorer — improve structure in small verified steps
3. [green]
4. [review-lint-commit]

#### Pre-Merge (before creating a PR)

0. `npx tsc --noEmit` — type-check FIRST (catches type errors Vitest skips; prevents wasted E2E/visual runs on broken types)
1. ts-test-runner — full unit/integration regression
2. [verify-e2e] — full E2E suite
3. [verify-visual] — screenshot regression against baselines
4. [lint]
5. [lint-theme] — verify CSS tokens registered in @theme
6. npm run build — verify production build
7. **Snapshot drift audit** — compare `ls src/features/` against `claude-artifacts/project-snapshot/features/*.md`. If any feature directory has no snapshot file → STOP, add it to `CLAUDE_PROJECT_SPECIFIC.md` Module Registry first, then regenerate. Also verify `CLAUDE_PROJECT_SPECIFIC.md` Module Registry lists ALL feature directories.
8. dependency-researcher — audit prod deps (auto-skips if package.json unchanged vs master). IF CVEs or unmaintained → STOP, report to user.
9. [review] — code-level quality check (correctness, security, standards compliance)
10. architectural-reviewer — system-level review (modules, SOLID, data flow, dependency health)
11. [commit] review reports: `docs: add pre-merge code review and architectural review reports`
12. IF BLOCK findings from either review → STOP, report to user with fix options, wait for decision
13. code-refactorer — fix WARN findings + code smells
14. code-simplifier — final polish
15. [lint]
16. [verify-all] — final green confirmation
17. Fix critical findings (severity > 7/10), max 1 iteration back to step 9
18. [commit] refactor changes: `refactor: fix pre-merge review findings`
19. snapshot-generator — regenerate project snapshot after all refactors. Ensures snapshot in PR reflects final code state. Includes `user-flows.md` regeneration from E2E tests.
20. [commit] snapshot: `docs: regenerate project snapshot`
21. **Pre-Merge retrospective** — orchestrator writes `docs/implementation-lessons-learned/{branch-name}-pre-merge-retro.md` from current session context. Covers: which steps caught real issues (step #, finding, action taken), which steps were no-ops (step #, why, suggest conditional?), and workflow improvement suggestions. This file is the subagent's source for FINAL-SUMMARY Section 3.
22. **FINAL-SUMMARY** — invoke `retrospective-analyzer` subagent with prompt:
    ```
    Branch: {branch-name}
    Phase retro files: docs/implementation-lessons-learned/{branch-name}-phase-*.md
    Pre-Merge retro: docs/implementation-lessons-learned/{branch-name}-pre-merge-retro.md
    Template: claude-artifacts/speckit/final-summary-template.md
    Output: docs/implementation-lessons-learned/{branch-name}-FINAL-SUMMARY.md
    ```
    The subagent reads all inputs in fresh context and writes the FINAL-SUMMARY.
23. [commit]: `docs: add pre-merge and final implementation retrospective`
24. git push origin epic/{feature-name}
25. gh pr create — only when all steps pass
