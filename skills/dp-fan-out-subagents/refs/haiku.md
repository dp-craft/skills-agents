# Haiku

Claude Haiku 5.5 as an Agent-tool subagent (`model: haiku`, `effort: high|xhigh|max`). Use it where completeness or
judgement matters and as Ornith's fallback; not for mechanical work Ornith ties for free. Measured, mostly `n=1`.
Evidence: `/home/dev/work/dp-craft/amd/docs/analysis/2026-11-06-0930-haiku-manual.md`.

## Effort

| Effort | Use for | Measured |
|---|---|---|
| `high` (minimum) | Lookups, routine web search, mechanical work when Ornith is unavailable, retyping text | Best incident recall and verdicts at 4 reports; every per-file extraction finished |
| `xhigh` | Full lists, paths, full configs, incident lists, notes over several documents | Not measured |
| `max` | Coding, non-trivial analysis (connections, consistency, logical gaps), reviewing Ornith's non-code results (SKILL.md §5) | As a grader closer to Opus than `high` on several fields; one blind grading took 227.5k tokens and 462 s |

- **`max` gets one file or module per call.** A 4-file, 844-line extraction at `max` spent 128k thinking tokens without writing, 4 times in a row, and failed with no output.
- Cost seen per call: 92k–114k tokens for a 219–303-line extraction at `high`.

## Where it beats Ornith

| Area | Haiku | Ornith |
|---|---|---|
| Error classes, 340k log | 21 of 21 | 16, 16, 21 |
| Paths in finding text | .94–.97 | .57–.76 |
| Full config in notes | 8 of 8 | 4 of 8 |
| Incidents in footnotes or hedged text | 4–6 of 6 | 0 of 3 |
| Cross-document conflicts | 1/1, 4/4 valid | 0 valid |
| Retyping 6k | 242 s, no loss | 480 s, 2 runs unfinished |

Ties: facts on the exact line (0 invented by either). Ornith is better on bug labels (.795 vs .718 at 9k).

## Risks

| Risk | Guard |
|---|---|
| Overclaiming: "best", "only", "rules out" where the source hedges | Compare against the source's certainty words |
| False critical flags when grading (5 of 6 Haiku-only flags didn't hold) | Check each flag at its line |
| Unstable judgement scores (10/12, then 8/12 on the same notes) | Count a gap under 4 of 18 as a tie |
| Own system prompt and tools, not the caller's | State paths and rules in the brief |

Give fixed output fields, and have it write the result file, not prose in the reply.
