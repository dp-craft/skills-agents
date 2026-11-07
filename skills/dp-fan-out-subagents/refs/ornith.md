# Ornith

Ornith 1.5 35B-A3B on native Radiance, port 8000. Free, and about 4× faster than Haiku at `max` on the median tested
task (about even on judgement-heavy tasks, 13× on writing tests). Good when the task is clear and a script can check
the result; weak on exhaustive lists and fine judgement. The starter's settings are the measured best (MTP K=3,
thinking on, default sampler); don't change them. Effort settings do nothing on Ornith.

All figures are measured, mostly `n=1`, on synthetic or repo fixtures; a difference under 0.05 is a tie.
Evidence: `/home/dev/work/dp-craft/amd/docs/findings/workers/2026-11-06-0930-ornith-manual.md`.

## Use

1. Find the row below. Not listed: use the closest "Untested" row and check harder.
2. Size = source material, `wc -c` / 4. Above the limit, split into several sessions.
3. Brief: `refs/briefs/<tag>.md`. Adapt names, labels and output; give absolute paths, and point its output files
   into the run dir.
4. Run with `local.sh --model ornith --profile <profile>`; check as the row says. Never pass on a "draft" row unchecked.

## Fit

"Limit" is the recommended size per session, "tested" the largest that ran. Brief tag in brackets.

| Task | Profile [brief] | Result | Limit (tokens) | Time | Check |
|---|---|---|---:|---:|---|
| JSON or JSONL questions | `data` [json] | 1.0 at 8k, 41k, 131k | 131k tested, no sign of a limit | 14–19 s | Spot-check one number with `jq` |
| Python code inventory | `read` [codeinv] | 1.0, 1.0, .995 at 8k, 36k, 88k | 88k | 10–76 s | Compare the count with `grep -c` |
| Split a document | `data` [docsplit] | Zero loss at 6k–55k, 6 of 6 | No limit found: it reads headings only | 35–76 s | `doc_check.py` is part of the brief |
| Sort mixed sections into topic files | `data` [docreorg] | Content intact 6 of 6; right file 18/18, 20/20 up to 15k, then 17–21 of 22 at 25k | 15k without review; above that, review placement | 95–278 s | `doc_check.py`; read the file list above 15k |
| Write tests for given code | `code` [testgen] | 1.0, killed 16 of 16 mutants | Small module | 41 s | Run the tests |
| Multi-file rename or mechanical edit | `code` [edit] | 1.0 | Small repo | 45 s | Tests and `git diff` |
| Bug fix with a clear symptom | `code` [bugfix] | 1.0 | Small module | 14 s | Run the tests |
| Code from a clear spec | `code` [impl] | 34 of 34, then 26 of 34 hidden tests on the same brief; one parser looped forever | Small module | 148–163 s | **Draft.** Your tests decide, with a timeout; it can report success and fail 8 of 34 |
| Log triage | `read` [log] | All planted faults at 18k, 151k, 340k; class list .90, 1.0, .80 | 100k; 151k once | 61–138 s | Finds faults; not a full class list above 150k |
| Fixed-form report summary | `read` [summary] | Numbers 1.0 at 6k–55k; conclusion 2–3 of 3, same as Haiku | 55k tested | 19–71 s | Spot-check key numbers: errors are wrong labels on right numbers |
| Notes on one document | `read` [docnotes] | Scripted facts and planted incidents all found; config 4 of 8 vs Haiku 8 of 8; real incidents 10 vs 16 | One document per session; about 29k tested | 37–152 s | Not a complete incident list or full config. Check any deciding number |
| Group documents by type | `read` [classify] | .85–.90 at 17k; .89–.93 at 67k, 30 min cap | 17k; 67k if a spot-check is enough | 3 min at 17k; 7–24 min at 67k | Spot-check; split larger sets |
| Classify bug or finding text | `read` [bugs] | .71 at 9k, .58 at 33k | 10k | About 4 min | **Draft.** Severity weak (.56 exact); get paths with `grep` |

## Don't use it for

- **Retyping text.** A 6k split by Write took 480 s and 69k generated tokens; two more runs didn't finish in 10–12 min. Use the manifest briefs, where a script moves the bytes, or Haiku (6k in 242 s, no loss).
- **Exhaustive lists from long logs** unchecked: all 21 error classes at 340k in 2 of 6 runs (Haiku: 21).
- **Paths by reading:** recall .57–.76 vs Haiku .94–.97. Use `grep` for paths, Ornith for labels.
- **Incidents in footnotes, hedged text or list ends:** 0 of 3 vs Haiku 4–6 of 6; 12 prompt variants didn't fix it.
- **Final decisions** and code that won't be tested.

## Untested tasks

| Task | Closest row | Note |
|---|---|---|
| CSV, YAML, TOML, config files | JSON | Make it compute with `python3` |
| Stack traces, sorting CI failures | Log triage | |
| TODO lists, API inventories in other languages | Code inventory | Compare the count with `grep` |
| Changelog from `git log`, PR description | Summary | Give the log in a file; no profile runs `git log` |
| Docstrings, boilerplate, fixtures | Mechanical edit | Review with `git diff` |
| Format conversion | JSON | Have it write and run a script |
| Translation | Retyping warning applies | Test one small file first |

## Writing a brief

- Keep clear tasks short; added rules and self-checks seldom helped. Only `bugs` clearly gained.
- On `data`, a plain task-and-format brief scripts the work (6k split 86 s vs 480 s retyping). On `read`, keep the tested briefs.
- Make it compute, not reason: JSON went from 48–89 s to 17 s with `jq`/`python3`.
- Show a real example output line: a placeholder like `CLASS|` got replaced in every run.
- Fixed output fields so a script can check them. One document per session for notes.

## Limits and failure signs

- **System prompt** (set by `local.sh`): `data` and `code` append `dp` (33% and 15% fewer tokens, score tie or better); `read` keeps Claude Code's alone (`dp` cost 20% more tokens and .05 score there).
- **Profiles:** `read` file tools only. `data` adds `jq` and `python3` (can run anything: trusted material only). `code` adds edits, tests, read-only git; it denies compound commands, `node`, `npx --no-install` and paths outside the repo (7–15 denials per session seen). One session shipped tests that fail on the original code: run them yourself.
- **`LOCAL ERROR: error_max_turns`:** it looped at 80 turns. Rework the brief; don't raise `MAX_TURNS`.
- **A run past 10 min on a small input:** long reasoning or retyping. Stop it, discard the output, change the brief.
- **Interrupted runs:** discard the output.
- **Reasoning:** 41–97% of generated tokens; context can pass 100k on small input when it loops. Plan about 100k of source per session.
- **Memory:** up to 31.8 GiB of 32 with sessions running; nothing else GPU-heavy fits beside it. Desktop apps crashed once near full VRAM.
- **Sampler:** keep the default; the precise preset showed no benefit in 7 comparisons.
