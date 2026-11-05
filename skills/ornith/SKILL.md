---
name: ornith
description: Run a self-contained task on the free local Ornith model (Radiance on port 8000) and decide whether it fits. Covers when to use it, which tested brief to use, how many tokens to give it, and how to check the result. Use for log triage, JSON and JSONL questions, fixed-form summaries, document notes, grouping documents, code inventories, splitting or reorganizing documents without retyping them, writing tests, small edits and bug fixes, or when the user says "use ornith" or "do it locally for free". Not for final judgement, exhaustive review or retyping long text.
allowed-tools: Bash(/home/dev/work/dippe/skills-agents/skills/ornith/scripts/ornith.sh:*), Bash(/home/dev/work/dippe/skills-agents/skills/ornith/scripts/doc_apply.py:*), Bash(/home/dev/work/dippe/skills-agents/skills/ornith/scripts/doc_check.py:*)
compatibility:
  tools:
    - claude (Claude Code CLI)
    - jq
    - python3
    - Radiance serving Ornith on 127.0.0.1:8000 (/home/dev/work/dp-craft/amd/ornith_rad_mtp.sh)
---

# Ornith

Ornith costs nothing to run and finished about 4× faster than Haiku at `max` effort on the median tested task, ranging from about even on judgement-heavy tasks to 13× on writing tests. It works well when the task is clear and a script can check the result. It is weaker when the task needs an exhaustive list or fine judgement.

All figures come from measured runs, most of them a single run (`n=1`), on synthetic or repo fixtures. Treat a difference under 0.05 as a tie. Evidence: `/home/dev/work/dp-craft/amd/docs/analysis/2026-11-05-0814-ornith-use-cases.md`.

## Steps

1. **Check the fit** in the table below. If the task isn't listed, use the closest row under "Untested tasks" and check the result harder.
2. **Check the size.** "Tokens" means the source material. Estimate with `wc -c` divided by 4. Above the limit, split the work into several sessions.
3. **Take the brief** from `references/briefs.md` and adapt its file names, labels and output format. The session knows nothing of this conversation, so give absolute paths.
4. **Start the server if it's down.** `/home/dev/work/dp-craft/amd/ornith_rad_mtp.sh start` takes about 45 s and fills the card. If another model holds port 8000, ask before stopping it.
5. **Run it.** Use one session at a time, because the card serves one session well.
   ```bash
   /home/dev/work/dippe/skills-agents/skills/ornith/scripts/ornith.sh --profile read "<brief>"
   ```
   Use `run_in_background` when the table's time is over a few minutes. `cd` into the target repository first for `--profile code`.
6. **Check the result** as the table says. Never pass on an unchecked result from a "draft" row as fact.

## What to use it for

Scores are from 0 to 1. "Limit" is the recommended size per session, and "tested" is the largest size that ran.

| Task | Profile, brief | Result | Limit (tokens) | Time | Check |
|---|---|---|---:|---:|---|
| JSON or JSONL questions | `data`, JSON | 1.0 at 8k, 41k, 131k | 131k tested, no sign of a limit | 14–19 s | Spot-check one number with `jq` |
| Python code inventory | `read`, inventory | 1.0, 1.0, .995 at 8k, 36k, 88k | 88k | 10–76 s | Compare the count with `grep -c` |
| Split a document | `data`, split | Zero loss at 6k–55k, 6 of 6 | No limit found: it reads headings only | 35–76 s | `doc_check.py` is part of the brief |
| Sort mixed sections into topic files | `data`, sort | Content intact 6 of 6; right file 18/18, 20/20 up to 15k, then 17–21 of 22 at 25k | 15k without review; above that, review the placement | 95–278 s | `doc_check.py`; read the file list above 15k |
| Write tests for given code | `code`, tests | 1.0, killed 16 of 16 mutants | Small module | 41 s | Run the tests |
| Multi-file rename or mechanical edit | `code`, rename | 1.0 | Small repo | 45 s | Tests and `git diff` |
| Bug fix with a clear symptom | `code`, bug fix | 1.0 | Small module | 14 s | Run the tests |
| Code from a clear spec | `code`, spec | 34 of 34, then 26 of 34 hidden tests, on the same brief | Small module | 148–163 s | **Draft.** Your own tests decide; it can report success and still fail 8 of 34 |
| Log triage | `read`, log | All planted faults found at 18k, 151k and 340k. Class list .90, 1.0, .80 | 100k; tested 151k once | 61–138 s | Good for finding faults; not a full list of error classes above 150k |
| Fixed-form report summary | `read`, summary | Numbers 1.0 at 6k–55k. Blind grade of the conclusion 2–3 of 3 on most, the same range as Haiku; 4–5 of 5 key lines right | 55k tested | 19–71 s | Spot-check key numbers: errors are wrong labels on right numbers |
| Notes on one document (conclusion, config, key facts, incidents) | `read`, notes | Scripted facts and planted incidents all found. Blind grade: conclusion and facts tie Haiku at `high`; config 4 of 8 vs 8 of 8; real incidents 10 vs 16 | One document per session; tested to about 29k (978 lines) | 37–152 s | Don't rely on it for a complete incident list or full configuration. Check any number that decides something |
| Group documents by type | `read`, grouping | .85–.90 at 17k. 67k didn't finish in 14 min | 17k per session | About 3 min | Spot-check. Split larger sets into batches |
| Classify bug or finding text | `read`, bugs | .71 at 9k, .58 at 33k | 10k per session | About 4 min | **Draft.** Severity is weak (.56 exact, .97 within one level). Get paths with `grep`, not from the model |

## Don't use it for

- **Retyping text.** Don't ask it to rewrite a document with a Write call, even a small one. A 6k-token split took 480 s and 69k generated tokens, and two more runs didn't finish in 10–12 minutes. The low-temperature preset didn't help. Use the manifest briefs, where a script moves the bytes. If text really must be retyped, use Haiku: 6k took 242 s with no loss.
- **Exhaustive lists from long logs.** At 340k it found 16 of 21 error classes, while Haiku at `max` found all 21. It found the planted faults either way.
- **Path extraction by reading.** Ornith recalled .57–.76 of file paths in findings, Haiku .94–.97. Use `grep` for paths and Ornith for the labels.
- **Final decisions.** Use a stronger model or a human for anything that gets acted on without further checks. This includes verdicts on reports and code that won't be tested.

## Untested tasks

These weren't measured. Use the closest tested row's limits and check the result more strictly.

| Task | Closest row | Note |
|---|---|---|
| CSV, YAML, TOML, config files | JSON | Make it compute with `python3` instead of reasoning |
| Explaining a stack trace, sorting CI failures | Log triage | |
| TODO lists, API inventories in other languages | Code inventory | Compare the count with `grep` |
| Changelog from `git log`, PR description | Summary | Give the log in a file, since no profile runs `git log` |
| Docstrings, boilerplate, fixtures | Mechanical edit | Review with `git diff` |
| Format conversion | JSON | Have it write and run a script instead of retyping |
| Translation | Retyping warning applies | Expect long runs; test on one small file first |

## Writing a brief

What the tests showed:

- **Keep clear tasks short.** Added rules and self-check steps seldom raised the score and often cost time. Only the judgement-heavy `bugs` task clearly gained.
- **Have it compute, not reason.** On JSON, moving to `jq` or `python3` took the time from 48–89 s to 17 s at the same score.
- **Show a real example of the output line.** A format line with a placeholder like `CLASS|` got its placeholder replaced in every run.
- **Give fixed output fields** so a script can check them.
- **One document per session** for notes.
- **Say where to write.** Sessions can write outside the work directory, and `/tmp` is the usual place. Check there afterwards.

## Limits and failure signs

- **Profiles:** `read` has file tools only. `data` adds `jq` and `python3`, and `python3` can run anything, so use it only on material you trust. `code` adds edits, test runners and read-only git.
- **Turn cap:** `ORNITH ERROR: error_max_turns` means it looped at the 80-turn cap. Rework the brief or move the task. Don't simply raise `MAX_TURNS`.
- **Other errors:** `ORNITH ERROR: no server` means start the server. A port serving another model reports that model's name.
- **Interrupted runs:** discard the output of a cut or timed-out session.
- **Reasoning cost:** most generation can be reasoning (96% on the `bugs` M run), at 89–241 tokens/s, and context can pass 100k on small input when it loops. Slow runs are usually long reasoning, not slow generation.
- **Memory:** the server holds up to 31.8 GiB of VRAM, nearly the whole card, so nothing else GPU-heavy can run alongside it. Stop it when you're done if something else needs the card.
- **Sampler:** keep the default preset (temp 1.0, presence penalty 1.5). The precise preset (`EXTRA_ARGS="--temp 0.6 --presence-penalty 0" ornith_rad_mtp.sh start`) showed no clear benefit in 7 finished comparisons, and it didn't fix retyping.

## Output

Report what Ornith produced and how you checked it. Say so plainly if you didn't check it, or if the size was over the limit.
