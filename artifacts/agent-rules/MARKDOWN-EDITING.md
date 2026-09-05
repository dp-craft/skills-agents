<!-- LLM-PRIMARY: universal markdown-editing rules for agent-facing .md. Shared via skills-agents. -->

## Markdown File Editing (MANDATORY)

BEFORE every edit to `.md` files in `.claude/`, `claude-artifacts/`, or `CLAUDE*.md`:

1. **Read** `claude-artifacts/standards/MARKDOWN-AUTHORING.md`
2. **Apply** — key constraints (full rules in the file above):
   - Token-efficient format: tables > prose, no filler
   - Keywords: `MUST` / `MUST NOT` / `FORBIDDEN` only — not `NEVER` / `ALWAYS` / `Do NOT`
   - Match target file's existing heading hierarchy, list style, table format
   - `LEARNED-RULES.md` and `LEARNED-RULES-detailed.md` are LLM-loaded but APPROVAL-GATED — orchestrator MAY edit ONLY when applying patches a user explicitly approved via `dp-qg-learn` / `dp-qg-history` / `dp-qg-bugtrace` `AskUserQuestion` flow. Ad-hoc edits (without an approved YAML proposal) are FORBIDDEN. Proposals always go through the agent first; never hand-author a rule mid-session.
