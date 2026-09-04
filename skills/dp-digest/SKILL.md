---
name: dp-digest
description: "Use when a question needs the CONTENT of one or more large files (plan/design doc sets, long source modules, log or catalog dumps) in the main session — e.g. 'what are the contracts in these plan docs?', 'what does this module export and where is the seam?', 'which model id matches X?'. Delegates the reading to a cheap subagent and returns a bounded digest, so the files never enter main-session context. Triggered automatically when guard-read-size.sh blocks a read."
allowed-tools:
  - Agent
  - Bash
  - Glob
---

# dp-digest — bounded file digestion

Reading a large file into the main session to answer a question about it is the
single largest measured token sink (one 051 session: 11 whole-file reads = ~40k
tokens, 70-80% avoidable). The file is processed **once, by a subagent**, and only
the answer reaches the main session.

## Decision gate

Answer the cheapest question that resolves the need. MUST NOT delegate what a
one-line command answers.

| Need | Use instead of a digest |
|---|---|
| Export list | `grep -n '^export' <file>` |
| Section outline | `grep -n '^#' <file>` |
| Table shape / columns | `grep -m2 '^\|' <file>` |
| Type / signature of a known symbol | LSP `hover` |
| Callers, blast radius | LSP `findReferences` |
| Defining file of a symbol | LSP `workspaceSymbol` |
| Size of a change | `git diff --stat` |
| Test outcome | `... \| grep -E 'Test Files\|Tests '` |
| One known value in a dump | `grep -m1 <pattern>` |

Use a digest ONLY when the answer needs prose synthesis across content —
contracts, task dependencies, design constraints, control flow, "how does X work".

## Invocation

Spawn ONE agent for the whole file set — never one per file.

```
Agent(
  subagent_type: 'general-purpose',
  model: 'haiku',          # 'sonnet' if the question needs real reasoning
  description: '<3-5 words>',
  prompt: """
    Read: <explicit paths or glob>
    Answer ONLY: <the specific question>
    Format: <the exact shape wanted — e.g. a table of task id | deps | files>
    Constraints: under <N> words. Quote file:line for every claim.
    Omit anything not asked for. No preamble, no summary of what you read.
  """
)
```

## Rules

| Rule | Detail |
|---|---|
| Word cap MUST be explicit | Uncapped returns run 2-8k tokens; capped run 1-2k. Default cap 800 words; 300 for a lookup |
| Question MUST be specific | "Summarize these docs" returns everything. "Which tasks does T1-07 depend on, and what contract does each emit?" returns the answer |
| Output shape MUST be named | Ask for a table/list with named columns, not "a summary" |
| Citations MUST be requested | `file:line` per claim makes the digest verifiable without re-reading |
| One agent per QUESTION | Not per file. Batch the file set into one call |
| MUST NOT re-read after | The digest is the artifact. Re-reading a source it covered defeats the purpose — ask a follow-up via `SendMessage` to the same agent instead |
| `model: 'haiku'` for extraction | Digestion, filtering, catalog lookup. Use `sonnet`/`opus` only when the question needs judgment |

## After a guard-read-size block

`guard-read-size.sh` blocks unbounded main-session reads over the byte budget.
When it fires, pick from the Decision gate table first. If the answer genuinely
needs the file's content, digest it — do NOT reach for `# force-read`, and do NOT
slice the same file repeatedly with `sed -n` until it is all in context anyway.
