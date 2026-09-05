<!-- LLM-PRIMARY: universal token-discipline rules. Shared via skills-agents. -->

## Token Discipline (MANDATORY)

Per-session token budget pressure points. Each rule cuts a measured failure mode from past sessions.

| Rule | Saves | Trigger |
|---|---|---|
| **One file = one edit-pass.** Batch all changes to a single file (i18n, retros, registry) into ONE Write/Edit at the end of a phase, not 3-5 sequential Edits across the session. Each edit → reformat → "file modified" reinjection (5-15k each). | 20-30k | Multi-edit session |
| **Subagent prompt cap: 1k tokens.** Pre-delegation context = `<navigation_context>` (exports + line numbers + 1-paragraph behavior), NOT full file dumps. Reference snapshot or LSP output instead of pasting code. | 10-20k | Subagent invocation |
| **Skip code-reviewer when dp-qg-impl-audit covers same scope.** Pre-merge orchestrator runs both → redundant. If `dp-qg-impl-audit` is in the workflow (phase end), `code-reviewer` MUST be skipped for that phase's tasks unless retro flagged a review-only concern. | 5-10k per phase | `[review-lint-commit]` + dp-qg-impl-audit pair |
| **LSP before Read.** Structure questions → exports: the project snapshot (where one exists) or barrel, or `grep -n "^export"` (depth-0, zero noise); types/props: `hover`; callers/blast-radius: `findReferences` (~200 tokens/call). Read only for behavior (logic, control flow). Re-reading after Edit is FORBIDDEN — Edit/Write would have errored if it failed. | 8-15k | Files >200 lines |
| **LSP query selection** (per LSP.md). Name known → `hover`. Export list → project snapshot (where one exists) or barrel, or `grep -n "^export"`. Position → `workspaceSymbol`. `documentSymbol` dumps the full tree (no filter param — 522 symbols on a 1081-line store) → OK only on barrel/`types.ts`/tests (or ranges-only, see LSP.md), FORBIDDEN elsewhere. | 4-6k per avoided call | `documentSymbol` impulse |
| **Tool-result caching.** Same LSP query (operation + file + position), same `Read`, same diagnostic Bash (`cat file | head N`, `ls path`, `grep pattern`) MUST NOT be re-run in the same session unless the file was Edit-ed in between. Re-running buries the prior result deeper in context (lost-in-middle risk) and inflates total prompt size (context-rot risk). | 2-10k per phase | Same-query re-runs |
| **MUST NOT `Read`/`cat`/`grep` an `@-imported` file.** Bare `@path/to/file.md` at line start = auto-loaded into the system prompt; `Read`/`cat`/`head`/`grep` against it re-loads the same content, doubling cost (e.g. grepping a `workflow.md` shorthand already in context). **Scope**: main session only (where the `@`-import lives). Subagents do NOT inherit `@`-imports — they DO need a real Read. Backticked `` `@path` `` = textual ref, NOT an import — also needs a real Read. | 3-15k per session | Session-start orchestrator runs |
| **Subagent return cap.** Pass `report in under 500 words` (or ≤300 for trivial verifications) in the prompt. Default returns are 2-8k; capped returns are 1-2k. | 5-10k | Read-heavy subagent (review/audit) |
| **Name the fields on a structured read.** `jq -c '.steps[]\|{id,type}'`, `task-dag context --fields` — the field list is the lever, not the parser. Measured on `plan.json`: whole 10432 B → `.steps[]` 7193 B → `{id,type}` **701 B**. | 3-10k per artifact | Reading any `.json` / `.jsonl` |
| **Cap parallel `[P]` tasks.** Each parallel subagent multiplies pre-delegation context cost. Use `Max Parallel Agents: 2` (already set); MUST NOT override upward. | — | Parallel execution |
