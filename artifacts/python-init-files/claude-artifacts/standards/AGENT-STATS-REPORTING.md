<!-- LLM-PRIMARY: Subagent stats reporting protocol. Referenced by agent configs and retrospective template. -->

## Agent Stats Reporting

Every subagent MUST include this HTML comment as the **last line** of its response:

```html
<!-- AGENT_STATS: {
  "tool_usage": {
    "Bash": { "count": N },
    "Read": { "count": N, "unique_targets": N },
    "Write": { "count": N },
    "Edit": { "count": N, "unique_targets": N, "max_per_file": N },
    "Glob": { "count": N },
    "Grep": { "count": N, "unique_targets": N },
    "LSP": { "count": N, "operations": { "OP": N } },
    "WebSearch": { "count": N },
    "WebFetch": { "count": N }
  },
  "files": {
    "read": ["paths"],
    "modified": ["paths"],
    "created": ["paths"],
    "lines_added": N,
    "lines_removed": N
  },
  "test_results": { "runs": N, "passed": N, "failed": N },
  "errors": { "count": N, "details": ["short description of each error"] }
} -->
```

### Field Guide

Tool keys match PascalCase tool names. Report only tools your agent has access to. `LSP` is available to agents with `LSP` in their `tools:` field — currently 8 agents (code writers, test writers, architectural-reviewer, snapshot-generator).

| Field | What to count |
|---|---|
| `Bash.count` | Total Bash tool calls (shell commands, test runs, git) |
| `Read.count` | Total Read tool calls |
| `Read.unique_targets` | Distinct file paths read |
| `Write.count` | Total Write tool calls (new files created) |
| `Edit.count` | Total Edit tool calls |
| `Edit.unique_targets` | Distinct files edited |
| `Edit.max_per_file` | Highest edit count on a single file |
| `Glob.count` | Total Glob tool calls (file pattern searches) |
| `Grep.count` | Total Grep tool calls (content searches) |
| `Grep.unique_targets` | Distinct search patterns used |
| `LSP.count` | Total LSP tool calls |
| `LSP.operations` | Map of LSP operation → call count (e.g. `{"hover": 3, "findReferences": 2, "documentSymbol": 1}`) |
| `WebSearch.count` | Total WebSearch tool calls |
| `WebFetch.count` | Total WebFetch tool calls |
| `files.read` | All file paths read during this invocation |
| `files.modified` | All file paths edited |
| `files.created` | All new file paths written |
| `files.lines_added` | Estimated lines added across all files |
| `files.lines_removed` | Estimated lines removed across all files |
| `test_results` | Test runs and outcomes (if agent ran tests) |
| `errors.count` | Total tool errors, permission denials, file-not-found, edit conflicts, and command failures |
| `errors.details` | One short string per error: `"Edit failed: non-unique match in foo.ts"`, `"Bash: tsc exited 1"`, `"Read: file not found bar.ts"` |

### Rules

- Report ONLY tools listed in your agent's `tools:` header — omit tools you don't have access to
- Replace `N` with actual counts — do not use placeholders
- Include real file paths in the arrays — do not use placeholders
- Set unused-but-available fields to `0` or `[]` — do not omit fields you have access to
- The comment MUST be the **very last line** of the response — nothing after it
- The orchestrator enriches with: `agent`, `task`, `duration_s`, `retries`, `outcome`
- Stats feed into the retrospective's Agent Tool Usage Matrix for optimization analysis
