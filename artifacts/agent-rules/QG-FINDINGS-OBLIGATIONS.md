<!-- LLM-PRIMARY: universal quality-gate findings routing. Shared via skills-agents. -->

## Quality-Gate Findings → Obligations (non-interactive)

A phase run MUST complete without user interaction. Quality-gate agents (`dp-qg-*`) emit 5–20 findings; **none of them may stop a phase to ask a question**. Every finding routes to an action the orchestrator can take alone, and anything needing judgment becomes a scoped OBLIGATION resolved later — at the next `[phase-contract]` or at Pre-Merge.

`AskUserQuestion` is FORBIDDEN during phase execution AND during phase-end findings routing. (This extends `claude-artifacts/dpf/workflow.md` §9 "no mid-phase questions" to the phase-END gate, which previously escaped it.)

### Routing matrix (attribution-first)

After `dp-qg-impl-audit` emits findings, the orchestrator MUST:

1. Run `tools/scripts/attribute-findings.ts` (exit 0 success, 2 infra, 3 placement-format drift hard-block; bypass with `--no-strict-placement`).
2. For each finding with `action: "opus"` (needs-judgment) → invoke `dp-qg-attribute`.
3. Validate the agent output via `tools/scripts/validate-attribution-output.ts`. Validator errors → re-invoke `dp-qg-attribute` ONCE with the errors as feedback, else surface to user.
4. Route per the table below — **attribute first, then apply overrides**:

**Disposition order** — first match wins. `OBLIGATION` never asks; it records and scopes.

| # | When | Action |
|---|---|---|
| 1 | `attribution_category: impl-drift` AND `category: code-quality` AND NOT `hard_block_fired` | **AUTO-FIX.** Bounded loop ≤2 (delegate to writer/bugfixer), re-run affected tests; on fail → revert → OBLIGATION (blocking) with `reverted: test-fail` |
| 2 | The fix targets a file a **pending** task already declares | **ADOPT** — `task-dag adopt --task <T> --path <file>`, then OBLIGATION (advisory) naming that task. Mechanical, not judgment: file-set membership is a fact |
| 3 | The fix needs work **no task owns** and the work is nameable | **AMEND** — `task-dag amend --add-task "<line>" --reason "<why>" --source-finding <F> [--into-phase current\|next]`. `--into-phase current` only when the runner-eligibility rule below holds |
| 4 | `rule-induced` / `rule-missed` | `dp-qg-learn` / `dp-qg-history` proposal flow (already deferred; unchanged) |
| 5 | `runner-defect` | **RECORD** to `<dp-forge>/docs/test/runner-quality-ledger.jsonl` + OBLIGATION (advisory). MUST NOT auto-fix — that destroys the capability signal the runner backlog is built from |
| 6 | Everything else (`scope-decision`, `task-gap`, `plan-gap`, `spec-gap`, `unforeseen`, `hard_block_fired`, `cross_phase_pattern`) | **OBLIGATION** — see severity table |

Attribution still runs first and is still recorded verbatim: a `plan-gap` stays a `plan-gap` in the ledger even when disposition 2 or 3 schedules the remedy. Auto-fixing must never erase the upstream category — the ledger is what `dp-qg-learn` mines.

**Obligation severity** — `task-dag obligations add --file <dag> --text "<t>" --severity <s> --source <F> [--blocks-task <T>...] [--blocks-file <p>...] [--blocks-fr <FR>...]`

| Severity | Use for | Effect |
|---|---|---|
| `blocking` | `spec-gap`, `plan-gap`, `task-gap`, `scope-decision`, `unforeseen`, `hard_block_fired` | Blocks ONLY tasks matching its `blocks` set (task id ∪ file ∪ FR) |
| `advisory` | `cross_phase_pattern`, `runner-defect`, ADOPT/AMEND follow-ups | MUST NOT block; counted and reported |

`severity` is derived from the attribution CATEGORY (provenance) and answers ONE question — may this task start? It is NOT an authority signal. Who decides is the divergence test's answer (`claude-artifacts/dpf/workflow.md` Integrity Rule 9), computed independently: a `blocking` obligation whose resolution fires no escalation row is auto-resolved at `[phase-contract]`, and resolving it unblocks its tasks. `blocking` MUST NOT be read as "the user must answer".

An obligation MUST declare at least one `--blocks-*` target — one that blocks nothing is a note, not an obligation (exit 2). Scope it to the narrowest true set: a finding about phase 2 MUST NOT block phase 3 work that does not touch it.

**Circuit breaker — the only automatic stop.** `task-dag phase-start` exits 3 when *every* pending task in the phase is blocked; that phase can make no progress, so proceeding is pointless. Partial blocking passes the gate and reports the blocked ids so the caller skips them.

**Runner eligibility for an AMEND-ed task** (`RUNNER-GUIDE.md` § Goals — Reach): a task whose validator is already satisfied cannot fail, so the loop converges with no semantic change and reports a false green. An inserted task MUST NOT be runner-dispatched unless it is `{M}` in `tdd` mode (where `red` is structural) or `{S}` gated by a currently-failing deterministic check. Otherwise route it to a Claude subagent or leave it ungrouped.

After auto-applying any patch: run the affected tests. On failure, revert and convert to OBLIGATION (blocking). If the patch touches a test file, delegate to `ts-test-writer` / `e2e-test-writer` (Test File Ownership) — orchestrator MUST NOT edit test files directly.

### Resolution — batched, never mid-phase

| Point | Action |
|---|---|
| `[phase-contract]` (next phase start) | Review open obligations for that phase's tasks. Auto-resolve every one that does NOT fire the divergence test (workflow.md Integrity Rule 9) — `resolve --note "<basis>"`; ask only the escalating ones. This is the ONLY per-phase interaction point, and it already carries R-032 `[park]` answers |
| Pre-Merge | MUST be free of open `blocking` obligations. `task-dag obligations list --open --json` is the gate input |
| Resolve | `task-dag obligations resolve --id <OB-NNN> --note "<how>"` — appends a `resolved` row; the ledger is append-only and never rewritten |

The ledger lives at `specs/<branch>/obligations.jsonl`, deliberately OUTSIDE `task-dag.json` so it survives a destructive full `seed`. A malformed row is skipped and counted, never thrown — a corrupt line MUST NOT brick a phase.

Findings MUST NOT be silently dropped: every finding ends as AUTO-FIX, ADOPT, AMEND, a learn-flow proposal, or a ledger row. MUST NOT widen the `blocking` set or relax disposition 1 mid-session — `dp-qg-learn` proposes routing changes from the ledger; widening happens through the rule loop, not orchestrator judgment.
