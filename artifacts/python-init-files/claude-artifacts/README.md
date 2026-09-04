# Reusable CLAUDE/LLM artifacts in agents, skills, etc.

These STATIC artifacts are needed for the daily usage, used by commands, agents, core.

The generated things like logs, review items, retrospective items etc. are in the docs directory.

## Content

- `project-snapshot/` — up to date project snapshot (architecture, features, data model, constraints, user flows)
- `speckit/` — templates for implementation workflows (phase retrospective, final summary, task complexity)
- `standards/` — coding standards, testing rules, debugging rules, architectural patterns
- `examples/` — code pattern examples (React, TypeScript, unit tests, E2E tests, placement decisions)
- `git-strategy.md` — branching model, commit rules, merge protocol

## Retrospective & Decision-Making Flow

The implementation workflow collects data at three stages, each building on the previous. The final output is a prioritized, actionable summary the user reviews before creating a PR.

### Flowchart

```
IMPLEMENTATION (speckit.implement)
==================================

  Phase 1..N tasks execute
         │
         ▼
  ┌─────────────────────────────────────────────────────┐
  │  Phase Retrospective (step 9)                       │
  │                                                     │
  │  Collects per phase:                                │
  │  - Per-task summary (commit, workflow, retries)     │
  │  - Phase stats (files, lines, tests, coverage)      │
  │  - Non-task commits (manual user changes)           │
  │  - Agent tool usage matrix (from AGENT_STATS)       │
  │  - Usage pattern analysis (LSP, edit thrash, etc.)  │
  │  - Retry/rework events with root causes             │
  │  - Categorized findings & recommendations           │
  │  - What worked well                                 │
  │  - Lessons learned + verdict                        │
  │                                                     │
  │  Template: speckit/retrospective-template.md        │
  │  Output:   docs/impl-lessons/{branch}-phase-NN.md   │
  │  Owner:    orchestrator (current session)            │
  └────────────────────┬────────────────────────────────┘
                       │
                       ▼
            All phases complete?
            ───── No ──→ next phase
                  │
                 Yes
                  │
                  ▼
  ┌─────────────────────────────────────────────────────┐
  │  Epic Completion (step 11)                          │
  │                                                     │
  │  - Verify all tasks [X]                             │
  │  - Update CLAUDE_PROJECT_SPECIFIC.md (Module Registry)  │
  │  - Commit                                           │
  └────────────────────┬────────────────────────────────┘
                       │
                       ▼

PRE-MERGE (claude-artifacts/speckit/workflow.md)
================================

  Steps 1-20: Quality gates
  (tests, E2E, visual, lint, build, reviews, refactors, snapshot)
         │
         ▼
  ┌─────────────────────────────────────────────────────┐
  │  Pre-Merge Retrospective (step 21)                  │
  │                                                     │
  │  Collects from current session:                     │
  │  - Which steps caught real issues (step #, finding) │
  │  - Which steps were no-ops (step #, why)            │
  │  - Workflow improvement suggestions                 │
  │                                                     │
  │  Output:   docs/impl-lessons/{branch}-pre-merge-    │
  │            retro.md                                  │
  │  Owner:    orchestrator (has session context)        │
  └────────────────────┬────────────────────────────────┘
                       │
                       ▼
  ┌─────────────────────────────────────────────────────┐
  │  FINAL-SUMMARY (step 22)                            │
  │                                                     │
  │  retrospective-analyzer subagent (fresh context)    │
  │                                                     │
  │  Reads:                                             │
  │  ├── {branch}-phase-*.md  (all phase retros)        │
  │  ├── {branch}-pre-merge-retro.md                    │
  │  └── speckit/final-summary-template.md              │
  │                                                     │
  │  Produces (7 sections):                             │
  │  1. Epic Overview (aggregated stats)                │
  │  2. Phase-by-Phase Summary (one row per phase)      │
  │  3. Pre-Merge Process Retrospective (standalone)    │
  │  4. All Findings (prioritized, ALL included)        │
  │  5. What Worked Well (with evidence)                │
  │  6. Connections & Recurring Patterns                │
  │  7. Implementation Readiness (quick wins/backlog)   │
  │                                                     │
  │  Prioritization weights applied:                    │
  │  BOOST: workflow/agent improvements, recurring      │
  │         patterns, cheap fixes, low side effects     │
  │  DEMOTE: technology-specific, one-off, expensive,   │
  │          speculative                                │
  │                                                     │
  │  Output:   docs/impl-lessons/{branch}-FINAL-        │
  │            SUMMARY.md                                │
  │  Owner:    retrospective-analyzer subagent           │
  └────────────────────┬────────────────────────────────┘
                       │
                       ▼
  ┌─────────────────────────────────────────────────────┐
  │  Commit + Push + PR (steps 23-25)                   │
  │                                                     │
  │  User reviews FINAL-SUMMARY to decide:              │
  │  - Quick wins → implement before/after merge        │
  │  - Next batch → schedule for next epic              │
  │  - Backlog → track for future consideration         │
  └─────────────────────────────────────────────────────┘
```

### Data ownership

| Data | Written by | When | Persisted to |
|---|---|---|---|
| Phase retro | Orchestrator | After each phase (speckit.implement step 9) | `docs/impl-lessons/{branch}-phase-NN.md` |
| Pre-Merge retro | Orchestrator | After Pre-Merge steps 1-20 (step 21) | `docs/impl-lessons/{branch}-pre-merge-retro.md` |
| FINAL-SUMMARY | `retrospective-analyzer` subagent | Pre-Merge step 22 (fresh context) | `docs/impl-lessons/{branch}-FINAL-SUMMARY.md` |

### Why a subagent for FINAL-SUMMARY?

The orchestrator may have run implementation across multiple sessions (phases 1-3 in session A, phases 4-6 in session B, Pre-Merge in session C). Phase retro files on disk are the complete record. The subagent reads ALL of them in a fresh context window, ensuring no data loss from context compaction. The orchestrator writes only what it uniquely knows: the Pre-Merge process results from the current session.
