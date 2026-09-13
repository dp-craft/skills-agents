<!-- LLM-PRIMARY: universal web-research protocol. Shared via skills-agents. -->

## Web Research

Conduct web research to identify current best practices before technology decisions.

### Tool Priority

`text-webfetch` subagent → Context7 → WebFetch → WebSearch. Skip unavailable tools. Commands MUST NOT hardcode research tool names.

### Slash Commands

Use the `/research:*` commands — pick the best fit:
- **What to build / how**: `technical` (implementation approaches) · `options` (compare side-by-side)
- **What exists**: `open-source` (find libraries) · `landscape` (map the space) · `competitive` (who else does this)
- **Should we / can we**: `feasibility` (go/no-go) · `history` (what's been tried)
- **Go deep**: `deep-dive` (thorough investigation of any topic)
