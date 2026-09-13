<!-- LLM-PRIMARY: universal token-discipline rules. Shared via skills-agents. -->

## Token Discipline (MANDATORY)

Per-session token budget pressure points. Each rule cuts a measured failure mode from past sessions.

| Rule | Saves | Trigger |
|---|---|---|
| **One file = one edit-pass.** Batch all changes to a single file (i18n, retros, registry) into ONE Write/Edit at the end of a phase, not 3-5 sequential Edits across the session. Each edit → reformat → "file modified" reinjection (5-15k each). | 20-30k | Multi-edit session |
| **Subagent prompt should below 1k tokens.** Pre-delegation context = `<navigation_context>` (exports + line numbers + 1-paragraph behavior), NOT full file dumps. Reference snapshot or LSP output instead of pasting code. | 10-20k | Subagent invocation |
| **Tool-result caching.** Same LSP query (operation + file + position), same `Read`, same diagnostic Bash (`cat file | head N`, `ls path`, `grep pattern`) MUST NOT be re-run in the same session unless the file was Edit-ed in between. Re-running buries the prior result deeper in context (lost-in-middle risk) and inflates total prompt size (context-rot risk). | 2-10k per phase | Same-query re-runs |
| **MUST NOT `Read`/`cat`/`grep` an `@-imported` file in the main session.** Bare `@path/to/file.md` at line start = auto-loaded into the system prompt; re-reading it doubles cost (e.g. grepping a `workflow.md` shorthand already in context). **Subagent exception:** subagents do NOT inherit `@`-imports — they need a real Read. Backticked `` `@path` `` = textual ref, NOT an import — also needs a real Read. | 3-15k per session | Session-start orchestrator runs |
| **Subagent return cap.** Tell subagents to `report in under 500 words` (≤300 for trivial verifications). Default returns are 2-8k; capped returns are 1-2k. | 5-10k | Read-heavy subagent (review/audit) |
| **Name the fields on a structured read.** `jq -c '.steps[]\|{id,type}'`, `task-dag context --fields` — the field list is the lever, not the parser. Measured on `plan.json`: whole 10432 B → `.steps[]` 7193 B → `{id,type}` **701 B**. | 3-10k per artifact | Reading any `.json` / `.jsonl` |
| **Cap parallel agents.** Do not override `Max Parallel Agents: 2` upward — each parallel subagent multiplies pre-delegation context cost. | — | Parallel execution |
