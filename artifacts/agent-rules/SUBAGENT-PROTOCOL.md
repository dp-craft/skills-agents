<!-- LLM-PRIMARY: universal subagent delegation protocol. The per-project Selection Guide stays in each CLAUDE.md. Shared via skills-agents. -->

**Use the Task tool with `subagent_type` parameter to invoke subagents. One task per subagent.** The per-project Selection Guide (task → `subagent_type`) lives in each project's CLAUDE.md.

### Pre-Delegation Protocol

Follow **claude-artifacts/LSP.md § Pre-Delegation Protocol**. Pass `<navigation_context>` blocks to the subagent prompt with exports, types, references, and line numbers gathered via LSP. The orchestrator is a delegator, not a researcher.

### Rules

1. **MUST use subagents for their specialized tasks** — MUST NOT write tests/code directly when a subagent exists
2. **e2e-test-runner is Bash-only** — runs Playwright CLI and filters output (no MCP browser tools)
3. **Dependency installs are orchestrator-only** — subagents MUST NOT run `npm install` for new packages. If a subagent's task requires a new dependency, it must report back that a dependency is needed, and the orchestrator runs the §IX Dependency Governance protocol.
4. **Minimize token usage** — every output for the end user should use short bullet point lists with minimal details

Code pattern examples for subagent prompts: see `claude-artifacts/examples/`.

### Escalation Protocol

1. Read the subagent's error output
2. If the error is clear (wrong file path, missing import, syntax error) → fix the issue, re-invoke
3. If the error is unclear or the subagent produced wrong results → ask the user: "Subagent {name} failed: {summary}. How to proceed?"
4. MUST NOT silently skip a workflow step
5. MUST NOT retry the same subagent with identical input

### Script Exit-Code Contract (MANDATORY)

All `tools/scripts/*.sh` and `tools/scripts/*.ts` follow ONE convention:

- **Exit 0**: success — output is silent or minimal.
- **Exit ≠ 0**: failure — orchestrator MUST STOP and surface stderr to the user.
- Per-script exit codes (e.g. exit 2 = bad input, exit 3 = partial / drift detected) MUST be documented in the script's `--help`, NOT inline in workflow.md / CLAUDE.md.
- Orchestrator MUST NOT silently retry on non-zero exit. STOP, surface, ask user.
- Orchestrator MUST NOT pipe script stdout through `| tail` / `| head` / `| grep` in main session before reading — those mask exit codes AND truncate failure context. Capture the full output via redirection if size is a concern, then `tail` the file.

