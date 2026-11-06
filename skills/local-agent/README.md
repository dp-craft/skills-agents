# local-agent (retired 2026-11-06)

Replaced by `../dp-fan-out-subagents`: `scripts/local.sh --model 27b`, plus `--agent <name>` for a repo's code-writer
role (its `refs/local-27b.md`). The old skill text is kept as `RETIRED-SKILL.md`, so Claude Code and opencode no
longer load it as a skill.

Kept for old callers, don't delete: `scripts/local-agent.sh`. The CLAUDE.md of `dpf-bench-redhat-d0-sharp-r1` and of
the dp-forge worktrees `w2-g3` and `w3-robust` (other branches) still call it.
