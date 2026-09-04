# Phase {N} — {Phase Name}: Retrospective

**Feature:** {feature-id} {feature-name}
**Date:** {YYYY-MM-DD}

## Status
- Tasks completed: X / Y
- Tasks skipped/failed: <!-- list any, or "none" -->

## Phase Stats
<!-- Computed from git diff and test output for this phase's commits -->

| Metric | Value |
|---|---|
| Files created | {N} |
| Files modified | {N} |
| Lines added / removed | +{N} / -{N} |
| Test count delta | +{N} |
| Coverage delta | {before}% -> {after}% |
| New dependencies | {list or "none"} |

## Execution Stats

### Per-Task Summary
<!-- One row per task. Hash + Message from `git log --oneline`. Workflow = Small/Med/MedUI/Large/LargeUI/Bugfix/Refactor. -->
| Task | Commit Hash | Message | Workflow | Subagent Calls | Retries | Deviation | Notes |
|---|-------------|---|---|---|---|---|---|
| T0XX | `abc1234`   | feat(T0XX): description | Medium | 5 | 0 | — | |
| T0XX | `def5678`   | feat(T0XX): description | Large (UI) | 9 | 2 | upgraded from Medium — needed E2E | |
<!-- Deviation: note if the workflow was upgraded/downgraded from initial classification -->

### Non-Task Commits
<!-- Commits on this branch during this phase that don't match T0XX patterns. Captures manual user changes, session-boundary fixes, or ad-hoc work. Use `git log --oneline` and filter out task commits. Write "none" if all commits are task-attributed. -->
| Commit Hash | Message | Attributed To |
|---|---|---|
| `xyz9876` | fix: manual CSS adjustment | user (manual) |

### Agent Tool Usage Matrix
<!-- One row per agent invocation. Columns match agent `tools:` headers. Populated from AGENT_STATS footers. -->
| Agent | Task | Duration | Bash | Read | Write | Edit | Glob | Grep | LSP | WebSearch | WebFetch | Errors | Lines +/- |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| {agent} | T0XX | {N}s | {N} | {N} ({U}) | {N} | {N} ({U}) | {N} | {N} ({U}) | {N} ({ops}) | {N} | {N} | {N} | +{N}/-{N} |
<!-- (N) = call count, (U) = unique targets, (ops) = LSP operation breakdown. Dash (—) for tools not in agent's allowed list. Data source: AGENT_STATS HTML comment footer from each agent response. Errors column = errors.count; if > 0, list errors.details in the Usage Pattern Analysis table. -->

### Usage Pattern Analysis
<!-- Identify patterns from the matrix. Focus on actionable improvements. -->
| Pattern | Agent | Evidence | Recommendation | Est. Savings |
|---|---|---|---|---|
| {pattern type} | {agent} | {data from matrix} | {concrete fix} | {tokens or calls saved/task} |

<!-- Common pattern types to check for:
- LSP underuse: Agent has high Read/Grep count but 0 LSP calls — likely reading files for structural info that LSP hover/documentSymbol could provide
- LSP overuse: Agent has 30+ LSP calls (esp. Haiku) — over-exploring instead of targeted queries. Consider pre-delegation next time
- Missing pre-delegation: Haiku agent with high tool count — orchestrator should have pre-delegated navigation context
- Edit thrash: Agent has high max_per_file on edits — trial-and-error instead of planning edits
- Read overuse: Agent re-reads files (count >> unique_targets) — possible context loss
- Scope creep: High lines_added on a small task — YAGNI violation
- Test loop: Many test runs with high failure rate — guessing at fixes instead of diagnosing
- Wasted context: Many files read but few modified — reading files it didn't need
- Tool errors: Agent has errors.count > 0 — wrong paths, edit conflicts wasting tokens on retries
- Good LSP adoption: Agent uses LSP hover/documentSymbol before editing — working as designed
-->

### Retry / Rework Events
<!-- Every retry = wasted work. List each one. -->
| Task | Step | Retries | Root Cause | Preventable? |
|---|---|---|---|---|
| T0XX | lint-fix-loop | 2 | code-logic-writer emitted implicit `any` | Yes — add strict-mode reminder to prompt |

### Bottlenecks (ranked by wasted calls)
<!-- Rank by: (retries x avg cost per call). Focus on what to fix first. -->
1. <!-- e.g. lint-fix-loop: 6 retries across phase, 3 caused by code-logic-writer TS errors -->
2.
3.

## Findings & Recommendations
<!-- All findings from this phase — problems, issues, decisions, and improvements merged into one prioritized table. -->
<!-- Category: Workflow Gate | Agent Prompt | Testing Discipline | Lint/Tooling | Task Planning | Architecture | Import Discipline | State Management | Type System -->

| # | Category | Finding | Root Cause | Recommendation | Effort | Est. Savings |
|---|---|---|---|---|---|---|
| 1 | {category} | {finding} | {root cause} | {concrete fix} | {Low/Med/High} | {savings} |

## What Worked Well
<!-- Positive patterns to preserve. Include evidence (task IDs, metrics, zero-retry streaks). -->

- {pattern}: {evidence}

## Lessons Learned
<!-- Patterns or pitfalls discovered that affect future phases. Focus on transferable insights, not phase-specific details already covered in Findings. -->

## Verdict
<!-- 2-3 sentences: What is the single highest-impact improvement for the next phase? -->
<!-- e.g. "lint-fix-loop was called 18 times (3x per task avg). 60% of retries traced to code-logic-writer ignoring strict TS. Adding a strict-mode preamble to code-logic-writer would eliminate ~10 calls/phase." -->

## Next Phase
<!-- Brief description of what Phase {N+1} will do and any known risks -->
