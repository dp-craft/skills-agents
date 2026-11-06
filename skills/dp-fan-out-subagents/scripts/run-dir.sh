#!/usr/bin/env bash
# run-dir.sh: reserve a unique result-file path for one subagent run, in this session's run dir.
# usage: run-dir.sh <worker> <slug>
#   → <repo>/docs/tmp/<YYYY-MM-DD-HHMM>-<session8>/<NN>-<worker>-<slug>.md   (created empty, so NN stays unique)
# <repo> is the git root of the directory the Claude session started in (CLAUDE_PID's cwd), so a `cd` elsewhere
# doesn't scatter one session's results; outside Claude it is the current directory's git root.
# The run dir is created on first use and found again by the session id for the rest of the session.
# A new docs/tmp gets a `*` .gitignore, so results stay untracked in any repo. An existing file is never overwritten.
set -euo pipefail
[ $# -eq 2 ] || { echo "usage: run-dir.sh <worker> <slug>" >&2; exit 2; }
start=$(readlink "/proc/${CLAUDE_PID:-0}/cwd" 2>/dev/null || pwd)
root=$(git -C "$start" rev-parse --show-toplevel 2>/dev/null || echo "$start")
sid=${CLAUDE_CODE_SESSION_ID:-nosession}; sid=${sid:0:8}
[ -d "$root/docs/tmp" ] || { mkdir -p "$root/docs/tmp"; echo '*' > "$root/docs/tmp/.gitignore"; }
dir=$(ls -d "$root"/docs/tmp/*-"$sid" 2>/dev/null | head -1 || true)
[ -n "$dir" ] || dir="$root/docs/tmp/$(date +%Y-%m-%d-%H%M)-$sid"
mkdir -p "$dir"
exec 9>"$dir/.lock"; flock 9
slug=$(printf '%s' "$1-$2" | tr -cs 'a-zA-Z0-9' '-' | tr 'A-Z' 'a-z' | cut -c1-60 | sed 's/^-*//; s/-*$//')
last=$(ls "$dir" | sed -n 's/^\([0-9][0-9]*\)-.*/\1/p' | sort -n | tail -1)
path=$(printf '%s/%02d-%s.md' "$dir" "$(( 10#${last:-0} + 1 ))" "$slug")
set -o noclobber
: > "$path"
echo "$path"
