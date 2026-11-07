# ornith (retired 2026-11-06)

Replaced by `../dp-fan-out-subagents`: `scripts/local.sh --model ornith`, with the fit, limits and tested briefs in its
`refs/ornith.md` and `refs/briefs/`. The old skill text is kept as `RETIRED-SKILL.md`, so Claude Code and opencode no
longer load it as a skill.

Kept for old callers, don't delete: `scripts/`, `references/` and `settings.json`. The amd use-case harness
(`dp-craft/amd/bench/workers/`) runs `scripts/ornith.sh` (its `ORN` default) and
writes `references/briefs.md`.
