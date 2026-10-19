#!/usr/bin/env bash
# local-agent: run one self-contained task headless on the local llama-swap model
# (settings: ~/.config/claude/local_muxik/settings.json) and print only the final result.
# usage: local-agent.sh "task" [extra claude args, e.g. --max-turns 40]
set -euo pipefail

if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "usage: local-agent.sh \"task\" [extra claude args]" >&2
  exit 2
fi
task="$1"; shift

if ! curl -s -m 3 -o /dev/null http://127.0.0.1:9292/v1/models; then
  echo "LOCAL AGENT ERROR: llama-swap is not reachable on :9292 (start it first)" >&2
  exit 1
fi

claude --settings /home/dev/.config/claude/local_muxik/settings.json \
  -p "$task" --output-format json --max-turns 20 \
  --permission-mode acceptEdits \
  --allowedTools "Read,Grep,Glob,Edit,Write,Bash(git diff:*),Bash(git status:*),Bash(ls:*)" \
  "$@" < /dev/null 2>/dev/null \
  | jq -r 'if .is_error then "LOCAL AGENT ERROR: \(.subtype) \(.result // "")" else .result end'
