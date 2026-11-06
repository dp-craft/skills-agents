#!/usr/bin/env python3
"""statusline.py: the dp-fan-out-subagents rows under Claude Code's status line.

usage: <status-line JSON on stdin> | statusline.py
Row 1, Claude: session cost; this session's subagents per model (agents, API calls, prefill, cached, out, peak);
the review counts. Row 2, local: the server, GPU busy %, VRAM and vLLM's queue (local-status.sh --short), then this
session's local.sh runs per model (runs, API calls, prefill, cached, out, minutes).
prefill = fresh input + cache writes, cached = cache reads, out = decode. Every API call re-sends the whole context,
so prefill + cached count it again on each call; peak is the largest single call, the real context size.
Subagents: <transcript dir>/subagents/agent-*.jsonl, one usage per message id (the transcript repeats it per content
block). Per-file totals are cached by size and mtime, so a refresh reads only transcripts that changed.
Local runs: this session's lines in ~/.local/state/dp-fan-out-subagents/local-runs.jsonl (written by local.sh).
"""
import json, os, subprocess, sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
STATE = Path(os.environ.get("XDG_STATE_HOME", Path.home() / ".local/state")) / "dp-fan-out-subagents"


def k(n):
    return f"{n / 1e6:.1f}M" if n >= 1e6 else f"{n / 1e3:.0f}k" if n >= 1e3 else str(n)


def pl(n, word):
    return f"{n} {word}" + ("" if n == 1 else "s")


def short(model):
    for name in ("opus", "sonnet", "haiku", "fable", "ornith", "27b"):
        if name in model:
            return name
    return model or "?"


def file_usage(path):
    """[model, calls, prefill, cached, out, peak] of one subagent transcript."""
    seen = {}
    with open(path, errors="replace") as f:
        for line in f:
            if '"usage"' not in line:
                continue
            try:
                msg = json.loads(line).get("message") or {}
            except ValueError:
                continue
            u = msg.get("usage")
            if u and msg.get("id"):
                seen[msg["id"]] = (short(msg.get("model", "")),
                                   u.get("input_tokens", 0) + u.get("cache_creation_input_tokens", 0),
                                   u.get("cache_read_input_tokens", 0), u.get("output_tokens", 0))
    v = list(seen.values())
    return [v[0][0] if v else "?", len(v), sum(x[1] for x in v), sum(x[2] for x in v), sum(x[3] for x in v),
            max((x[1] + x[2] for x in v), default=0)]


def subagents(transcript, sid):
    d = Path(transcript).with_suffix("") / "subagents"
    if not d.is_dir():
        return {}
    cache_file = Path(os.environ.get("XDG_RUNTIME_DIR", "/tmp")) / f"dpfan-statusline2-{sid}.json"
    try:
        cache = json.loads(cache_file.read_text())
    except (OSError, ValueError):
        cache = {}
    totals = defaultdict(lambda: [0, 0, 0, 0, 0, 0])  # agents, calls, prefill, cached, out, peak
    for p in d.glob("agent-*.jsonl"):
        st = p.stat()
        key = f"{st.st_size}:{st.st_mtime_ns}"
        if cache.get(p.name, {}).get("key") != key:
            cache[p.name] = {"key": key, "u": file_usage(p)}
        model, calls, pre, cached, out, peak = cache[p.name]["u"]
        t = totals[model]
        t[0] += 1; t[1] += calls; t[2] += pre; t[3] += cached; t[4] += out; t[5] = max(t[5], peak)
    try:
        cache_file.write_text(json.dumps(cache))
    except OSError:
        pass
    return totals


def local_runs(sid):
    f = STATE / "local-runs.jsonl"
    totals = defaultdict(lambda: [0, 0, 0, 0, 0, 0])  # runs, calls, prefill, cached, out, ms
    if sid and f.exists():
        for line in f.read_text().splitlines():
            try:
                r = json.loads(line)
            except ValueError:
                continue
            if r.get("session") == sid:
                t = totals[r["model"]]
                t[0] += 1; t[1] += r.get("turns") or 0
                t[2] += (r.get("fresh") or 0) + (r.get("cache_write") or 0); t[3] += r.get("cached") or 0
                t[4] += r.get("out_tokens") or 0; t[5] += r.get("duration_ms") or 0
    return totals


def reviews():
    f = STATE / "reviews.jsonl"
    n = defaultdict(int)
    if f.exists():
        for line in f.read_text().splitlines():
            try:
                r = json.loads(line)
                n[f"{r['worker'][:2]}>{r['reviewer'][:2]}"] += 1
            except (ValueError, KeyError, IndexError):
                pass
    return n


def main():
    try:
        data = json.load(sys.stdin)
    except ValueError:
        data = {}
    sid = data.get("session_id", "")
    claude, local = [], []
    cost = (data.get("cost") or {}).get("total_cost_usd")
    if cost is not None:
        claude.append(f"sess ${cost:.2f}")
    if data.get("transcript_path"):
        for m, (n, calls, pre, cached, out, peak) in sorted(subagents(data["transcript_path"], sid).items()):
            claude.append(f"sub {m}: {pl(n, 'agent')}, {pl(calls, 'call')}, prefill {k(pre)}, cached {k(cached)},"
                          f" out {k(out)}, peak {k(peak)}")
    rev = reviews()
    if rev:
        claude.append("rev " + " ".join(f"{p} {n}" for p, n in sorted(rev.items())))
    try:
        local.append(subprocess.run([str(HERE / "local-status.sh"), "--short"], capture_output=True,
                                    text=True, timeout=2).stdout.strip())
    except (OSError, subprocess.TimeoutExpired):
        pass
    for m, (n, calls, pre, cached, out, ms) in sorted(local_runs(sid).items()):
        local.append(f"local {m}: {pl(n, 'run')}, {pl(calls, 'call')}, prefill {k(pre)}, cached {k(cached)},"
                     f" out {k(out)}, {ms / 60000:.0f}m")
    for row in (claude, local):
        if any(row):
            print(" │ ".join(p for p in row if p))


if __name__ == "__main__":
    main()
