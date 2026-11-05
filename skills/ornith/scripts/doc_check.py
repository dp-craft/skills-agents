#!/usr/bin/env python3
"""doc_check.py SOURCE OUTPUT [OUTPUT ...] [--ignore NAME]: did a split or reorganized document keep its text?
OUTPUT is a file or directory of .md files. Compares nonblank lines as multisets, ignoring spacing and table padding.
Prints PASS, or FAIL with every lost, added or duplicated line and its source line number. Exit 0 on PASS, 1 on FAIL."""
import collections, os, re, sys


def norm(s):
    s = re.sub(r"\s+", " ", s.strip())
    return re.sub(r" ?\| ?", "|", s) if s.startswith("|") else s


def rows(path):
    return [(n, l.rstrip("\n"), norm(l)) for n, l in enumerate(open(path, encoding="utf8"), 1) if l.strip()]


def main():
    args = sys.argv[1:]
    ignore = set()
    while "--ignore" in args:
        i = args.index("--ignore")
        ignore.add(args[i + 1])
        del args[i : i + 2]
    if len(args) < 2:
        sys.exit(__doc__)
    src, targets = args[0], args[1:]
    paths = []
    for t in targets:
        if os.path.isdir(t):
            paths += [os.path.join(d, f) for d, _, fs in os.walk(t) for f in fs if f.endswith(".md")]
        else:
            paths.append(t)
    paths = [p for p in paths if os.path.basename(p) not in ignore]
    want = rows(src)
    have = [(p, n, raw, key) for p in sorted(paths) for n, raw, key in rows(p)]
    wc = collections.Counter(k for _, _, k in want)
    hc = collections.Counter(k for *_, k in have)
    lost, seen = [], collections.Counter()
    for n, raw, k in want:
        seen[k] += 1
        if seen[k] > hc[k]:
            lost.append((n, raw))
    added, seen = [], collections.Counter()
    for p, n, raw, k in have:
        seen[k] += 1
        if seen[k] > wc[k]:
            added.append((os.path.basename(p), n, raw))
    print(f"source {len(want)} lines, output {len(have)} lines in {len(paths)} files: {len(lost)} lost or altered, {len(added)} added or duplicated")
    for n, raw in lost[:60]:
        print(f"LOST source:{n}: {raw[:200]}")
    for p, n, raw in added[:60]:
        print(f"ADDED {p}:{n}: {raw[:200]}")
    if len(lost) > 60 or len(added) > 60:
        print("(list cut at 60 per kind)")
    print("PASS" if not lost and not added else "FAIL")
    sys.exit(0 if not lost and not added else 1)


if __name__ == "__main__":
    main()
