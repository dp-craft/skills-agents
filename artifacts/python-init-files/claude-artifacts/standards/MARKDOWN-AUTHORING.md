<!-- LLM-PRIMARY: Markdown authoring standards for LLM-primary documentation files. -->

# Markdown Authoring Standards

All `.md` files in this project are **LLM-primary** — consumed by agents far more often than by humans.

MUST do on every claude md file change (`.md` files in `.claude/`, `claude-artifacts/`, or `CLAUDE*.md`):
- Every edit MUST be LLM-condensed — optimize for token efficiency and parse speed
- Every change must be validated: re-read the edited section as an agent would — can you act on it without reading surrounding context?
- Check consequences, validate consistency, avoid overengineering

## Formatting Rules

- **Token efficiency over prose** — use tables, lists, and shorthands; avoid verbose paragraphs
- **Consistency is non-negotiable** — follow the existing heading hierarchy, list style, and table format already in the file
- **Single responsibility** — files and blocks inside must follow the single responsibility rule
- **`<!-- LLM-PRIMARY: ... -->` header** — every standalone `.md` file MUST have this as line 1 with a one-line purpose summary
- **File naming** — `UPPER-KEBAB-CASE.md` for standards files (e.g., `TS-MODULE-DEPENDENCY-RULES.md`)
- **Max heading depth** — absolute max `####` (H4). If you need H5+, split into a sub-file

## .md file Pre-Edit Protocol

Before modifying any `.md` in `.claude/`, `claude-artifacts/`, or `CLAUDE*.md`:

1. **Belongs here?** — verify against `<!-- LLM-PRIMARY: ... -->` header or `description:` field
2. **Find or create** — wrong file → Grep purpose across standards, or create in `claude-artifacts/standards/` with `LLM-PRIMARY` header
3. **Reference, don't inline** — shared content → one standards file + reference

| Pattern | When |
|---|---|
| `@file.md` (auto-loaded) | Content needed in >80% of reads |
| "See `file.md`" (manual read) | Content needed <20% of reads |
| Inline | Content always needed, <10 lines |

File ownership: see CLAUDE.md § Markdown file editing standards

## Content Rules

- **No bare tool/script paths** — wrap repeatable commands in `npm` scripts (`package.json`) or shell scripts (`tools/scripts/`); reference the script name, not the raw invocation
- **Minimize context reads** — structure content so an agent can find what it needs in one targeted read, not by scanning the entire file
- **Tables for lookup, lists for sequences** — if data has 2+ columns use a table; if it's ordered steps use a numbered list
- **No duplication across files** — use filename references instead of copying content between files

## Performance Rules

- **Try to keep files under 300 lines** — split into referenced sub-files. If the same responsibility then let the user decide.
- **Front-load high-value content** — put the most-referenced sections at the top of the file
- **Avoid deep nesting** — max 2 heading levels within a section (`##` → `###`); deeper structure signals the section should be its own file
- **Think over the performance, latency cost of external calls, commands**

## Post-Edit Validation

| Check | How |
|---|---|
| Token efficiency | Compare line count before/after — edits should not increase by >10% without new content |
| Consistency | Verify heading style, list format matches rest of file |
| No duplication | Grep other `.md` files for similar content before adding |
| Actionability | Each rule must be directly actionable — no vague guidance |
