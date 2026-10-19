---
name: local-agent
description: Delegate a simple, self-contained task (boilerplate, renames, small tests, summarizing or grepping files, mechanical edits) to the local Qwen model running behind llama-swap. Use when the user says "delegate to local", "use local", "local agent", or for mechanical tasks that don't need deep reasoning.
allowed-tools: Bash(/home/dev/work/dippe/skills-agents/skills/local-agent/scripts/local-agent.sh:*)
compatibility:
  tools:
    - claude (Claude Code CLI)
    - jq
    - llama-swap on 127.0.0.1:9292
---

# Local Agent Skill

Runs a headless Claude Code session against the local llama-swap model and returns only its final answer.

## Steps

1. **Write a self-contained brief.** The local agent sees nothing of this conversation. Include:
   the goal, exact file paths, constraints (what not to touch), and the exact output format to return.
   Keep the task small and mechanical — it is a weaker model.
2. **Run it** with Bash (timeout 600000):
   ```bash
   /home/dev/work/dippe/skills-agents/skills/local-agent/scripts/local-agent.sh "<brief>"
   ```
   - It runs in the current working directory; `cd` into the right folder in the same command if needed.
   - The first call after a model swap loads the model (~60–90 s). For tasks likely to exceed ~2 min,
     use `run_in_background` and continue with other work.
   - Extra claude flags can follow the brief, e.g. `--max-turns 40`.
3. **Verify before reporting.** Check `git diff` / run the relevant tests. Treat the output as a draft:
   fix or redo anything wrong yourself rather than passing it on unchecked.

## Limits

- Tools available to the local agent: Read, Grep, Glob, Edit, Write, `git diff`, `git status`, `ls`.
  Anything else is denied (headless mode cannot prompt). Edits are auto-accepted.
- One model in VRAM, concurrency 1 — local tasks run serially; don't launch several in parallel.
- Output starting with `LOCAL AGENT ERROR:` means the run failed (llama-swap down, max turns hit, ...).
