---
name: dp-fan-out-subagents
description: Route work to the cheapest subagent that does it well, and run it — free local Ornith or Qwen 27B, Claude Haiku, Sonnet or Opus. Load it BEFORE any Agent/subagent call, and whenever the user says fan out, use subagents, delegate, use ornith, use haiku, use local, local agent, or do it for free. Covers which model and effort fit, the local server state, session size and splitting, result files, parallel limits and the temporary review counts.
allowed-tools: Bash(/home/dev/work/dippe/skills-agents/skills/dp-fan-out-subagents/scripts/local.sh:*), Bash(/home/dev/work/dippe/skills-agents/skills/dp-fan-out-subagents/scripts/local-status.sh:*), Bash(/home/dev/work/dippe/skills-agents/skills/dp-fan-out-subagents/scripts/run-dir.sh:*), Bash(/home/dev/work/dippe/skills-agents/skills/dp-fan-out-subagents/scripts/reviews.py:*)
compatibility:
  tools:
    - claude (Claude Code CLI), jq, python3, flock
    - Ornith (ornith_rad_mtp.sh) or Qwen 27B (vllm.sh) on 127.0.0.1:8000 for the local routes
---

# Fan out to subagents

`S=/home/dev/work/dippe/skills-agents/skills/dp-fan-out-subagents`

For delegated work the main session is the orchestrator: it routes, writes briefs and reads result-file summaries.
It doesn't pre-investigate or read the source material; the worker reads its inputs and writes a file.
This skill is the only place that sets workers, models, efforts and parallel caps; repo files don't (a repo's selection
guide only names agent types). A worker the user names wins; if the table disagrees, say so once.

## 1. Pick the worker

**Ornith and the 27B are free**: the local GPU, no token bill; Claude workers bill every token. **If a local model can
do the job, it does it**: the Ornith row, and while the 27B is up also the Haiku and Sonnet rows (below). The task waits
in the local queue (§4), also behind the 27B's single slot, and never moves to Claude because the slots are busy: with
both Ornith slots taken, Haiku still starts only for work Ornith can't do. Claude takes local work only when the local
model can't run (§2). Free still costs review tokens (§5) and the GPU: Ornith fills the card, so no benchmark runs
beside it.

| Task | Worker | Effort |
|---|---|---|
| A script, test or `grep` can check it: JSON/log questions, code inventory, writing tests, renames, clear bug fix, fixed-form summary, document notes, grouping, splitting or sorting documents | **Ornith** (free; Haiku `high` only when Ornith can't run, §2) | — |
| Lookups, routine single-source web search, mechanical work when local is unavailable | Haiku | `high` |
| Completeness: full lists, paths, full configs, incidents, retyping text, notes on many documents | Haiku | `xhigh` |
| A small, clearly specified code change (one file or module); non-trivial analysis (connections, consistency, logical gaps) | Haiku | `max` |
| Agentic coding, usual implementation of a few tasks | **Qwen 27B** (free) when it is up, else Sonnet | Sonnet: `high` |
| Usual web research | Sonnet | `high` |
| Investigation, architecture, complex cases, TDD with negative and edge cases, holistic view, mission-critical or high-impact work (token-heavy runners, blockers); reviews and grading, except Ornith's non-code results (§5) | Opus | `high` |

- **While the 27B is up** (`sly-27b` in `local-status.sh`), it also takes the Ornith, Haiku and Sonnet rows by default:
  `local.sh --model 27b` with the row's profile (`read` for lookups and notes, `data` for counts and JSON, `code` or
  `--agent` for code). Not for web search (the local route has no web tools), the Opus row, or reviews (§5).
- Haiku never below `high`. At `max`, one file or module per call: a 4-file job at `max` thought past the 128k output limit and wrote nothing.
- Between two rows, take the stronger one: a weak result costs more to review and fix than the price gap.
- Sonnet and the 27B are not for the Opus row.
- Claude workers use `subagent_type: general-purpose` (Explore and Plan can't write the result file). A repo's selection guide picks the agent type for its roles: use that type with the model and effort from this table; on a local model, `local.sh --agent <type>`. Repo pipelines (e.g. `/dpf.*`) are products and keep their own parallel setting.
- If this session itself runs on a local model, `opus`, `sonnet` and `haiku` map to it or fail with `model_not_found`: use `local.sh` or work inline, don't retry, and skip the reviews.
- Details: Ornith `refs/ornith.md` (fit, limits, checks, tested briefs in `refs/briefs/`), Haiku `refs/haiku.md`, 27B `refs/local-27b.md`.

## 2. Local server

Before a local route, run `$S/scripts/local-status.sh` and show its line to the user. Never start, stop or switch a server without the user's yes.
Server labels: `sly-27b` (the 27B on Sly), `rad-ornith` (Ornith on radiance), `other (<served name>)`, `none`.

| State | Action |
|---|---|
| The 27B is up, or the wanted model is up | Run; when the slots are full (this session's runs or other sessions'), `local.sh` waits for one: queue, don't switch to Claude |
| Other work uses the server: `vllm` shows requests but no run is listed as via local.sh, or headless runs not via local.sh are listed (a pipeline, a benchmark) | Add no local run and no agent that polls the server: use the Claude fallback, or ask |
| Nothing up | Ask: start it, or use the fallback (Haiku for Ornith work, Sonnet for 27B work) |
| Ornith is up and the task is 27B work | Ask: switch, use Ornith, or Sonnet. Recommend Sonnet when other sessions or headless runs are listed: they may be using Ornith |
| Another model on :8000, another GPU engine, or a benchmark run | Ask before starting anything: the starters unload llama-swap and refuse when VRAM is short |

The session's focus picks the local model to start: agentic coding → 27B, bulk text and data → Ornith. Ask once if unclear, then keep the answer for the session.
Ornith: `/home/dev/work/dp-craft/amd/stack/serve/radiance/ornith_rad_mtp.sh start|stop` (about 45 s, fills the card).
27B: `/home/dev/.config/claude/local_vllm_direct/vllm.sh start|stop`.

## 3. Brief and result file

Every worker writes a result file, so a crash or reset loses no finished work.

1. Reserve a path: `$S/scripts/run-dir.sh <worker> <slug>` prints `<repo>/docs/tmp/<date-time>-<session>/<NN>-<worker>-<slug>.md` (`<repo>`: where the session started; `notes/tmp` instead when the repo has it; the dir ignores itself in git).
2. Brief: goal, absolute input paths, constraints, output format, and: "Write the full result to `<file>`. Start it with `STATUS: done|partial|failed` and `SUMMARY:` (at most 3 lines). Do the work yourself; start no subagents. Reply with only the path and the summary." Workers read their inputs; never paste file contents into a brief.
3. Run:
   - Local: `$S/scripts/local.sh --model ornith|27b --profile read|data|code --out <file> "<brief>"` (Bash; `run_in_background` if over about 2 min; `cd` into the repo for `code`). A repo's agent type: `--agent <name>` in place of `--profile` (`refs/local-27b.md`).
   - Claude: Agent tool, `model` and `effort` from the table.
4. Read `head -5` of a result, and beyond it only the parts you must act on (questions, gaps). Hand bulk content to another subagent.
5. After a crash or reset: `head -2` the run dir's files (newest dir: `ls -t <repo>/docs/tmp`, or `<repo>/notes/tmp`) and re-run only those that are empty or not `STATUS: done`.

**Parallel cap: 2** — at most this many Claude subagents and this many local runs at once (the 27B: 1, its server runs
one sequence). This line is the only place that sets it: `local.sh` reads the number from here and enforces it across
sessions. The two counts are separate: Claude slots run Claude-row tasks beside the local runs, never queued local work.

## 4. Size and split

Measure before writing briefs: source tokens ≈ bytes / 4 (`wc -c <files>`; a directory:
`find <dir> -type f -name '*.md' -exec cat {} + | wc -c`). Every session stays under its worker's ceiling: past it the
session compacts and loses detail.

| Worker | Ceiling (peak context) | Source per session |
|---|---|---|
| Ornith, Qwen 27B, Haiku | 180k | About 100k, or the task's lower limit (`refs/ornith.md`). Haiku `max`: one file or module |
| Sonnet, Opus | 250k | About 170k: a new session re-reads its files, and that costs more here than a bigger context |

The rest, about 80k, is for the system prompt, reasoning, tool output and the result. `local.sh` logs each run's peak
context and marks a run that compacted `STATUS: partial`: re-run it in smaller pieces.

Split by what the task needs, not only by size. Common cases:

| Case | Plan |
|---|---|
| The same job on many files, no view across them: summaries, notes, inventories, JSON or log questions | The §1 worker (Ornith for its rows: free), one file per session; batch small files up to about 100k per session. A file over the limit: cut it at its `## ` sections or time windows, or use a brief that greps it (`log`) |
| Results must line up across sessions: same labels, terms, format | Fix them in the brief. If they come from the material, a first session writes a shared file (label list, glossary) that every later session reads. Or keep the job in one session if it fits |
| A view across files: duplicates, conflicts, grouping, consistency | Two passes: the §1 worker per file with fixed fields (a detailed summary already shows most duplicates), then Haiku `max` or Opus over the result files only; over budget, merge them in groups first |
| Code and thinking tasks: bug fix, implementation, investigation | Split by subtask, not size: one module per call. If it can't be cut without losing the view it needs, move up a row instead |

Anything else: plan it. Ask what each session must know from the others and what splitting loses; if that is a lot,
don't split.

Running a split job:
1. One result file per piece (`run-dir.sh <worker> <slug>-p01`, `-p02`, …), the same brief and fields for each.
2. Independent pieces run in parallel up to the cap; the rest queue. Local queue: one background loop per slot (Ornith 2,
   the 27B 1), each running its pieces one after another; `local.sh` also holds any extra run until a slot frees. A piece
   that needs an earlier one runs after it and reads a short carry file (the shared list), not the earlier results.
3. Check each piece, then merge: a script when the fields are fixed (`cat`, `sort`, `jq`), else a worker that reads only
   the result files. Re-run only the pieces that are not `STATUS: done`.

## 5. Review (temporary, until the user drops it)

Every code review is Opus `high`: the rows below and any review a repo asks for (e.g. dp-plan's batch review).
Haiku reviews only Ornith's non-code results, nothing else.

| Worker | Reviewer | Effort | Dropped for tasks |
|---|---|---|---|
| Ornith, non-code result (`read` or `data` profile) | Haiku | `max` | — |
| Ornith, code result (`code` profile or `--agent`) | Opus | `high` | — |
| Haiku at `max` | Opus | `high` | — |

The 27B has no row: the user has checked its work (a repo's own review step still runs). Ideas for later: `IDEAS.md`.

**Split jobs (§4) whose pieces share one brief:** review a sample, 1 piece in 5 and at least one: the largest, plus any
piece that needed a re-run. Each review gets one piece's brief, sources and result, so it fits one session. On a `major`,
review the other pieces too: they ran the same brief. Nothing reviews the whole against all the sources; it wouldn't fit,
which is why the job was split. The whole gets the free checks (every input in a piece, counts add up, the same labels
in every piece), and a merge or cross-file pass done by a worker is a result of its own, reviewed by its row. Pieces with
different briefs (code subtasks) are separate tasks: each one is reviewed.

1. Run the free check first (`refs/ornith.md`: script, test, `grep`, count). If it fails, re-run or fix before reviewing.
2. The reviewer gets the brief, the source paths and the result file, and writes `<result minus .md>-review.md`
   starting with `VERDICT: ok|minor|major` (ok: nothing to change; minor: fixes that change no conclusion;
   major: a wrong or missing item that changes a decision), then `ISSUES:` with line references. Reviews are not reviewed.
3. Log it: `$S/scripts/reviews.py add --worker ornith --reviewer haiku|opus --task <brief tag or short class> --tokens <source bytes / 4> --review-tokens <the reviewer's subagent_tokens> --result <file> --review <file>` (for a Haiku worker add `--worker-tokens`).
4. Pass any `NOTICE:` line to the user. On `major`, the reviewer's model fixes the result from the review file.

`$S/scripts/reviews.py status` shows the counts. To drop a review for some tasks, list them in its row; to drop it fully, delete the row.

## Report

Tell the user which worker did what, the result file, how it was checked, and the review verdict.
