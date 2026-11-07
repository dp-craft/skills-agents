#!/usr/bin/env bash
# ornith.sh: run one self-contained brief headless on the local Ornith server and print only the final result.
# usage: ornith.sh [--profile read|data|code] "brief" [extra claude args]
#   read  Read, Grep, Glob, Write (default): documents, logs, classification, summaries.
#   data  read + jq and python3: anything that counts or computes over JSON. python3 can run any code.
#   code  read + Edit, pytest, vitest, tsc, git diff/status: small coding tasks. Run it inside the target repo.
# The session is clean: no CLAUDE.md, no MCP, no skills, no user settings. Runs in the current directory.
# data and code append references/prompt-dp.txt to Claude Code's system prompt; read keeps Claude Code's alone.
#   Add more with --append-system-prompt-file; the text flag --append-system-prompt would replace it.
# Env: ORNITH_OUT=file saves the raw JSON result. MAX_TURNS (default 80). ORNITH_SETTINGS overrides settings.json.
#   ORNITH_PROMPT=none leaves Claude Code's system prompt alone.
# Up to 3 sessions can run in parallel (the server's --max-num-seqs 3); a 4th waits in the server queue.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETTINGS="${ORNITH_SETTINGS:-$HERE/../settings.json}"
STARTER=/home/dev/work/dp-craft/amd/stack/serve/radiance/ornith_rad_mtp.sh

PROFILE=read
if [ "${1:-}" = "--profile" ]; then PROFILE="${2:-}"; shift 2; fi
if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "usage: ornith.sh [--profile read|data|code] \"brief\" [extra claude args]" >&2
  exit 2
fi
brief="$1"; shift

case "$PROFILE" in
  read) tools="Read,Grep,Glob,Write"; allowed="$tools";;
  data) tools="Read,Grep,Glob,Write,Bash"; allowed="Read,Grep,Glob,Write,Bash(jq:*),Bash(python3:*)";;
  code) tools="Read,Grep,Glob,Write,Edit,Bash"
    allowed="Read,Grep,Glob,Write,Edit,Bash(python3 -m pytest:*),Bash(pytest:*),Bash(npx vitest:*),Bash(npx tsc:*),Bash(git diff:*),Bash(git status:*),Bash(ls:*)";;
  *) echo "unknown profile: $PROFILE (read|data|code)" >&2; exit 2;;
esac

# Passed as text: a second --append-system-prompt-file would replace a file flag, but adds to this one.
PROMPT_ARGS=()
if [ "$PROFILE" != read ] && [ "${ORNITH_PROMPT:-dp}" != none ]; then
  DP_PROMPT="$(cat "$HERE/../references/prompt-dp.txt")"
  PROMPT_ARGS=(--append-system-prompt "$DP_PROMPT")
fi

BASE_URL="$(jq -r '.env.ANTHROPIC_BASE_URL' "$SETTINGS")"
MODELS="$(curl -s -m 3 "$BASE_URL/v1/models" || true)"
GOT_MODEL="$(printf '%s' "$MODELS" | jq -r '.data[0].id // empty' 2>/dev/null || true)"
GOT_ROOT="$(printf '%s' "$MODELS" | jq -r '.data[0].root // empty' 2>/dev/null || true)"
if [ -z "$GOT_MODEL" ]; then
  echo "ORNITH ERROR: no server at $BASE_URL (start it: $STARTER start)" >&2; exit 1
fi
case "$GOT_ROOT" in
  *ornith*) ;;
  *) echo "ORNITH ERROR: port serves '$GOT_ROOT', not Ornith (stop that server, then: $STARTER start)" >&2; exit 1;;
esac

# The server reports an alias, so every model entry is pointed at it here.
RUN_SETTINGS="$(mktemp)"
trap 'rm -f "$RUN_SETTINGS"' EXIT
jq --arg got "$GOT_MODEL" '.env |= with_entries(if .value == "ornith-set-by-script" then .value = $got else . end)' \
  "$SETTINGS" > "$RUN_SETTINGS"

RC=0
RAW="$(claude --settings "$RUN_SETTINGS" \
  -p "$brief" --output-format json --max-turns "${MAX_TURNS:-80}" \
  --permission-mode acceptEdits \
  --tools "$tools" --allowedTools "$allowed" \
  --strict-mcp-config --setting-sources "" --disable-slash-commands \
  "${PROMPT_ARGS[@]}" "$@" < /dev/null 2>/dev/null)" || RC=$?

if [ -n "${ORNITH_OUT:-}" ]; then
  mkdir -p "$(dirname "$ORNITH_OUT")"
  printf '%s\n' "$RAW" > "$ORNITH_OUT"
fi

if [ -z "$RAW" ]; then
  echo "ORNITH ERROR: claude exited $RC with no output" >&2
  exit "$(( RC == 0 ? 1 : RC ))"
fi
printf '%s\n' "$RAW" | jq -r 'if .is_error or (.subtype // "success") != "success" then "ORNITH ERROR: \(.subtype) \(.result // "")" else .result end'
exit "$RC"
