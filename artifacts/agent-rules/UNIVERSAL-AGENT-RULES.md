<!-- LLM-PRIMARY: universal tool-use guards (listing, read budget, git flags). Shared via skills-agents; symlinked as claude-artifacts/agent-rules/. -->

## Universal Agent Rules 1–3 (shared)

Harness-independent — they MUST hold in every harness (Claude Code, opencode, any other). Claude Code loads this file via an `@`-import in CLAUDE.md; opencode via `opencode.json` → `instructions`. Repo-specific rules continue the numbering in each CLAUDE.md.

### 1. No unfiltered `ls` / `find` / `tree`

A bare listing dumps the whole directory tree into context. MUST NOT run `ls`/`find`/`tree` as the terminal stage of a statement with no reducer and no stdout redirect. `2>/dev/null` does NOT count — it leaves stdout dumping.

| Actual need | Use |
|---|---|
| Existence of ONE path | `test -f <path>` / `test -d <path>` (no listing) |
| Ensure a dir before write | `mkdir -p <dir>` (silent, idempotent) |
| You need the names | add a reducer: `... \| head -50` / `... \| wc -l` / `... \| grep <pat>` |
| Persist a large listing | redirect, then read a slice: `... > /tmp/x && head /tmp/x` |
| Source-tree files | the Glob tool, not `ls`/`find`/`tree` |

### 2. No unbounded read over the byte budget

Budget: 15000 bytes. MUST NOT read a file over budget unbounded — no `Read` without `limit`, no terminal-stage `cat`/`bat`/`less`/`more` with unfiltered stdout. Bounded slices (`head`/`tail`/`sed -n`, `Read` with `offset`+`limit`), reducers and redirects are always allowed. Delegated subagents are exempt — reading whole files is their job.

| Actual question | Use |
|---|---|
| Export list / structure | `grep -n '^export' <file>` |
| Type / signature of X | LSP `hover` / `workspaceSymbol "X"` — an empty FIRST `workspaceSymbol` means a COLD INDEX, not a broken LSP: anchor one `hover` (or `documentSymbol` on a small types/barrel file) on a known file to load the project, then retry |
| Callers / blast radius | LSP `findReferences` |
| A known section | `Read` with offset+limit, or `grep -n '^#' <file>` |
| One md section (content) | `sed -n '/^## <Heading>/,/^## /p' <file>` |
| JSON/JSONL field subset | `jq -c '.path[]\|{f1,f2}' <file>` (name the fields) |
| Table shape | `grep -m2 '^\|' <file>` |
| Diff size, not content | `git diff --stat` |
| The WHOLE file | delegate to a subagent for a bounded digest |

### 3. No gate-bypassing git flags

MUST NOT run `git commit --amend`, `--no-verify` (or `-n`), or `--no-gpg-sign` without explicit user approval in the current chat.

| Flag | Instead |
|---|---|
| `--amend` | ask the user if a prior commit needs correction |
| `--no-verify` / `-n` | fix the gate failure instead of bypassing it |
| `--no-gpg-sign` | ask — signing MUST NOT be skipped silently |
