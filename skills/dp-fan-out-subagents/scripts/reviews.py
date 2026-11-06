#!/usr/bin/env python3
"""reviews.py: count the temporary reviews (Ornith -> Haiku or Opus, Haiku -> Opus) until the user decides to drop them.

usage: reviews.py add --worker ornith --reviewer haiku --task json --tokens 8000 [--review-tokens N]
                      [--worker-tokens N] --result FILE --review FILE
       reviews.py status
--tokens is the source size; --review-tokens / --worker-tokens are the subagent_tokens of the reviewer / a Claude
worker, from their completion notices, so the summaries show what a review costs.
The verdict comes from the review file's `VERDICT: ok|minor|major` line (first 20 lines).
Ledger: ~/.local/state/dp-fan-out-subagents/reviews.jsonl (global, all projects).
NOTICE lines are for the user: Haiku -> Opus every 10 reviews; any other pair when one task reaches 10, 20, ...
"""
import argparse, json, os, re, statistics, subprocess, sys, time
from collections import defaultdict
from pathlib import Path

STATE = Path(os.environ.get("XDG_STATE_HOME", Path.home() / ".local/state")) / "dp-fan-out-subagents"
LEDGER = STATE / "reviews.jsonl"


def load():
    rows = []
    if LEDGER.exists():
        for line in LEDGER.read_text().splitlines():
            try:
                rows.append(json.loads(line))
            except ValueError:
                pass
    return rows


def median_of(rs, key):
    vals = [r[key] for r in rs if r.get(key)]
    return int(statistics.median(vals)) if vals else None


def summary(rows, pair):
    by_task = defaultdict(list)
    for r in rows:
        if (r["worker"], r["reviewer"]) == pair:
            by_task[r["task"]].append(r)
    lines = []
    for task, rs in sorted(by_task.items()):
        v = defaultdict(int)
        for r in rs:
            v[r["verdict"]] += 1
        med = int(statistics.median(r["tokens"] for r in rs))
        cost = "".join(f", median {name} {m} tokens" for name, m in
                       (("worker", median_of(rs, "worker_tokens")), ("review", median_of(rs, "review_tokens"))) if m)
        lines.append(f"  {task}: {len(rs)} reviews, ok {v['ok']} / minor {v['minor']} / major {v['major']},"
                     f" median source {med} tokens{cost}")
    return lines


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("add")
    for f in ("worker", "reviewer", "task", "result", "review"):
        a.add_argument("--" + f, required=True)
    a.add_argument("--tokens", type=int, required=True, help="source size, about bytes / 4")
    a.add_argument("--review-tokens", type=int, help="the reviewer's subagent_tokens")
    a.add_argument("--worker-tokens", type=int, help="a Claude worker's subagent_tokens")
    sub.add_parser("status")
    args = ap.parse_args()

    if args.cmd == "status":
        rows = load()
        pairs = sorted({(r["worker"], r["reviewer"]) for r in rows})
        if not pairs:
            print("no reviews logged")
        for p in pairs:
            n = sum(1 for r in rows if (r["worker"], r["reviewer"]) == p)
            print(f"{p[0]} -> {p[1]}: {n} reviews")
            print("\n".join(summary(rows, p)))
        return

    text = Path(args.review).read_text(errors="replace").splitlines()[:20]
    m = next(filter(None, (re.search(r"VERDICT\W*(ok|minor|major)\b", l, re.I) for l in text)), None)
    if not m:
        sys.exit(f"no 'VERDICT: ok|minor|major' line in the first 20 lines of {args.review}; not logged")
    try:
        project = Path(subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True,
                                      text=True).stdout.strip() or os.getcwd()).name
    except OSError:
        project = Path.cwd().name
    row = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "project": project,
           "session": os.environ.get("CLAUDE_CODE_SESSION_ID", ""), "worker": args.worker.lower(),
           "reviewer": args.reviewer.lower(), "task": args.task, "tokens": args.tokens,
           "worker_tokens": args.worker_tokens, "review_tokens": args.review_tokens,
           "verdict": m.group(1).lower(), "result": os.path.abspath(args.result),
           "review": os.path.abspath(args.review)}
    STATE.mkdir(parents=True, exist_ok=True)
    with LEDGER.open("a") as f:
        f.write(json.dumps(row) + "\n")

    rows = load()
    pair = (row["worker"], row["reviewer"])
    total = sum(1 for r in rows if (r["worker"], r["reviewer"]) == pair)
    task_n = sum(1 for r in rows if (r["worker"], r["reviewer"]) == pair and r["task"] == row["task"])
    print(f"logged {pair[0]} -> {pair[1]} #{total} ({row['task']} #{task_n}, verdict {row['verdict']})")
    if pair == ("haiku", "opus"):
        hit, where = total % 10 == 0, ""
    else:
        hit, where = task_n % 10 == 0, f" ({task_n} on {row['task']})"
    if hit:
        print(f"NOTICE: tell the user: {pair[0]} -> {pair[1]} reached {total} reviews{where},"
              " enough to judge whether this review can be dropped:")
        print("\n".join(summary(rows, pair)))


if __name__ == "__main__":
    main()
