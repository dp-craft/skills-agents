#!/usr/bin/env python3
"""doc_apply.py SOURCE MANIFEST [OUTDIR]: build files from line ranges of SOURCE, byte for byte, so no text is retyped.
Manifest JSON: {"files":[{"path":"01-intro.md","ranges":[[1,40],[90,120]]}]}. Ranges are 1-based and inclusive.
Refuses the whole manifest, writing nothing, on a bad range, an overlap or a path outside OUTDIR.
Prints lines left unassigned; blank ones are harmless."""
import json, os, sys


def main():
    if len(sys.argv) not in (3, 4):
        sys.exit(__doc__)
    src, man = sys.argv[1:3]
    outdir = sys.argv[3] if len(sys.argv) == 4 else os.path.dirname(os.path.abspath(man))
    lines = open(src, encoding="utf8", newline="").read().splitlines(keepends=True)
    files = json.load(open(man, encoding="utf8"))["files"]
    root = os.path.abspath(outdir)
    used = {}
    errors = []
    for f in files:
        path = os.path.abspath(os.path.join(root, f["path"]))
        if not path.startswith(root + os.sep):
            errors.append(f"{f['path']}: outside {outdir}")
        for a, b in f["ranges"]:
            if not 1 <= a <= b <= len(lines):
                errors.append(f"{f['path']}: bad range {a}-{b} (source has {len(lines)} lines)")
                continue
            for n in range(a, b + 1):
                if n in used:
                    errors.append(f"line {n} in both {used[n]} and {f['path']}")
                used[n] = f["path"]
    if errors:
        print("REFUSED, nothing written:")
        print("\n".join(errors[:40]))
        sys.exit(1)
    for f in files:
        path = os.path.join(root, f["path"])
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf8", newline="") as o:
            for a, b in f["ranges"]:
                o.writelines(lines[a - 1 : b])
    left = [n for n in range(1, len(lines) + 1) if n not in used]
    hard = [n for n in left if lines[n - 1].strip()]
    print(f"wrote {len(files)} files; {len(left)} lines unassigned, {len(hard)} of them not blank")
    if hard:
        print("NOT BLANK AND UNASSIGNED:", ",".join(map(str, hard[:80])))
        sys.exit(2)


if __name__ == "__main__":
    main()
