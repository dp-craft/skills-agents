#!/usr/bin/env bash
# local.sh: run one self-contained brief headless on the local model server and print only the final result.
# usage: local.sh --model ornith|27b [--profile read|data|code] [--agent NAME] [--out FILE] "brief" [extra claude args]
#   read  Read, Grep, Glob, Write (default): documents, logs, classification, summaries.
#   data  read + jq and python3: anything that counts or computes over JSON. python3 can run any code.
#   code  read + Edit, pytest, vitest, tsc, npm test/run, git diff/status: coding tasks. Run it inside the target repo.
# --agent NAME runs the session as the repo's .claude/agents/NAME.md (a code-writer role): the code profile plus LSP
#   and npx tsx, with the project's settings, hooks and CLAUDE.md loaded, as local-agent.sh did. Run it inside the repo.
# --model is a guard: the run refuses when the port serves another model (Ornith and the 27b both report the 27b's
#   name; Ornith is told apart by /v1/models .root).
# --out FILE writes the final reply (or `STATUS: failed` and the error) to FILE unless the worker wrote FILE itself,
#   then prints only the path and the file's first 5 lines.
# Without --agent the session is clean: no CLAUDE.md, no MCP, no skills, no user or project settings.
# System prompt: Ornith on data and code appends refs/prompt-dp.txt to Claude Code's; Ornith on read keeps Claude
#   Code's alone (measured best per profile). The 27b gets none: its server template already has the dp terse block.
#   Add more with --append-system-prompt-file; the text flag --append-system-prompt would replace it.
# Parallel cap, across all sessions: Ornith takes the number on SKILL.md's `**Parallel cap: N**` line (the only place
#   that sets it), the 27b 1 (its server runs one sequence); a further run waits for a free slot.
# Every run appends one usage line to ~/.local/state/dp-fan-out-subagents/local-runs.jsonl (read by statusline.py),
#   with peak (the largest single call, the real context size) and compacts, both read from the worker's transcript
#   (none found: null and 0). A run that compacted gets `STATUS: partial` on its --out file's first line.
# Env: MAX_TURNS (default 80; a trailing --max-turns works too). LOCAL_SETTINGS overrides settings.json.
#   ORNITH_PROMPT=none leaves dp out. LOCAL_RAW_OUT=FILE saves the raw JSON result (turns, duration, tokens).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETTINGS="${LOCAL_SETTINGS:-$HERE/../settings.json}"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/dp-fan-out-subagents"
ORNITH_STARTER=/home/dev/work/dp-craft/amd/stack/serve/radiance/ornith_rad_mtp.sh
QWEN_STARTER=/home/dev/.config/claude/local_vllm_direct/vllm.sh

MODEL=""; PROFILE=read; OUT=""; AGENT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --model) MODEL="${2:-}"; shift 2;;
    --profile) PROFILE="${2:-}"; shift 2;;
    --agent) AGENT="${2:-}"; shift 2;;
    --out) OUT="${2:-}"; shift 2;;
    *) break;;
  esac
done
if [ $# -lt 1 ] || [ -z "$1" ] || [ -z "$MODEL" ]; then
  echo "usage: local.sh --model ornith|27b [--profile read|data|code] [--agent NAME] [--out FILE] \"brief\" [extra claude args]" >&2
  exit 2
fi
brief="$1"; shift

# Stops with the error. An --out file the worker didn't write gets `STATUS: failed`, as after a failed reply.
fail() {
  echo "LOCAL ERROR: $1" >&2
  if [ -n "$OUT" ] && [ ! -s "$OUT" ]; then
    mkdir -p "$(dirname "$OUT")"; printf 'STATUS: failed\nSUMMARY: LOCAL ERROR: %s\n' "$1" > "$OUT"
  fi
  exit "${2:-1}"
}

CAP=$(sed -n 's/^\*\*Parallel cap: \([0-9][0-9]*\)\*\*.*/\1/p' "$HERE/../SKILL.md" | head -1)
[ "${CAP:-0}" -ge 1 ] || CAP=1
case "$MODEL" in
  ornith) STARTER=$ORNITH_STARTER; SLOTS=$CAP;;
  27b) STARTER=$QWEN_STARTER; SLOTS=1;;
  *) echo "unknown model: $MODEL (ornith|27b)" >&2; exit 2;;
esac

[ -z "$AGENT" ] || PROFILE=code
case "$PROFILE" in
  read) tools="Read,Grep,Glob,Write"; allowed="$tools";;
  data) tools="Read,Grep,Glob,Write,Bash"; allowed="Read,Grep,Glob,Write,Bash(jq:*),Bash(python3:*)";;
  code) tools="Read,Grep,Glob,Write,Edit,Bash"
    allowed="Read,Grep,Glob,Write,Edit,Bash(python3 -m pytest:*),Bash(pytest:*),Bash(npx vitest:*),Bash(npx tsc:*),Bash(npm test:*),Bash(npm run:*),Bash(git diff:*),Bash(git status:*),Bash(ls:*)";;
  *) echo "unknown profile: $PROFILE (read|data|code)" >&2; exit 2;;
esac

# Passed as text: a second --append-system-prompt-file would replace a file flag, but adds to this one.
PROMPT=""
if [ "$MODEL" = ornith ] && [ "$PROFILE" != read ] && [ "${ORNITH_PROMPT:-dp}" != none ]; then
  PROMPT="$(cat "$HERE/../refs/prompt-dp.txt")"
fi
# --agent needs the project's settings: with --setting-sources "" the repo's agents are "not found". Its CLAUDE.md
# tells the orchestrator to hand writers to this script, so the worker is told not to.
SOURCES=""; AGENT_ARGS=()
if [ -n "$AGENT" ]; then
  SOURCES="project,local"; AGENT_ARGS=(--agent "$AGENT")
  tools="$tools,LSP"; allowed="$allowed,LSP,Bash(npx tsx:*)"
  PROMPT="${PROMPT:+$PROMPT$'\n\n'}You are the worker. Do the task yourself; never call local.sh or local-agent.sh, and never delegate it."
fi
PROMPT_ARGS=(); [ -z "$PROMPT" ] || PROMPT_ARGS=(--append-system-prompt "$PROMPT")

BASE_URL="$(jq -r '.env.ANTHROPIC_BASE_URL' "$SETTINGS")"
MODELS="$(curl -s -m 3 "$BASE_URL/v1/models" || true)"
GOT_MODEL="$(printf '%s' "$MODELS" | jq -r '.data[0].id // empty' 2>/dev/null || true)"
GOT_ROOT="$(printf '%s' "$MODELS" | jq -r '.data[0].root // empty' 2>/dev/null || true)"
[ -n "$GOT_MODEL" ] || fail "no server at $BASE_URL (start it: $STARTER start)"
case "$MODEL|$GOT_ROOT|$GOT_MODEL" in
  ornith\|*ornith*) ;;
  27b\|*ornith*) fail "port serves Ornith, not the 27b";;
  27b\|*27b*|27b\|*27B*) ;;
  *) fail "port serves '$GOT_MODEL' ($GOT_ROOT), not $MODEL";;
esac

# One lock file per slot; the fd is inherited by claude, so the slot stays taken until the session ends.
mkdir -p "$STATE"
waiting=""
while :; do
  for i in $(seq 1 "$SLOTS"); do
    exec {LOCK_FD}>"$STATE/slot-$MODEL-$i.lock"
    flock -n "$LOCK_FD" && break 2
    exec {LOCK_FD}>&-
  done
  [ -n "$waiting" ] || { echo "waiting for a free $MODEL slot ($SLOTS in use)" >&2; waiting=1; }
  sleep 5
done

# The server reports an alias, so every model entry is pointed at it here. --agent keeps the project's CLAUDE.md.
RUN_SETTINGS="$(mktemp --suffix=.dpfan.json)"
trap 'rm -f "$RUN_SETTINGS"' EXIT
jq --arg got "$GOT_MODEL" --arg agent "$AGENT" '.env |= (with_entries(if .value == "set-by-local-sh" then .value = $got else . end)
  | if $agent != "" then del(.CLAUDE_CODE_DISABLE_CLAUDE_MDS) else . end)' "$SETTINGS" > "$RUN_SETTINGS"

RC=0
RAW="$(claude --settings "$RUN_SETTINGS" \
  -p "$brief" --output-format json --max-turns "${MAX_TURNS:-80}" \
  --permission-mode acceptEdits \
  --tools "$tools" --allowedTools "$allowed" \
  --strict-mcp-config --setting-sources "$SOURCES" --disable-slash-commands \
  "${AGENT_ARGS[@]}" "${PROMPT_ARGS[@]}" "$@" < /dev/null 2>/dev/null)" || RC=$?

[ -n "$RAW" ] || fail "claude exited $RC with no output" "$(( RC == 0 ? 1 : RC ))"
[ -z "${LOCAL_RAW_OUT:-}" ] || { mkdir -p "$(dirname "$LOCAL_RAW_OUT")"; printf '%s\n' "$RAW" > "$LOCAL_RAW_OUT"; }

# Peak context (counted as statusline.py does, or a compaction's preTokens when higher: the tool result that set it off
# was never sent) and compactions, from the worker's transcript.
SID="$(printf '%s\n' "$RAW" | jq -r '.session_id // empty' 2>/dev/null || true)"
TRANSCRIPT=""
[ -z "$SID" ] || TRANSCRIPT="$(find "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects" -maxdepth 2 -name "$SID.jsonl" 2>/dev/null | head -1 || true)"
PEAK=null; COMPACTS=0
[ -z "$TRANSCRIPT" ] || read -r PEAK COMPACTS < <(jq -Rrn 'reduce (inputs | fromjson? | objects) as $l ({p: 0, c: 0};
  if $l.type == "system" and $l.subtype == "compact_boundary" then .c += 1 | .p = ([.p, ($l.compactMetadata.preTokens? // 0)] | max)
  else (($l.message? | objects | .usage? | objects) // null) as $u
    | if $u then .p = ([.p, ($u.input_tokens // 0) + ($u.cache_creation_input_tokens // 0)
        + ($u.cache_read_input_tokens // 0)] | max) else . end end) | "\(.p) \(.c)"' "$TRANSCRIPT" 2>/dev/null || echo "null 0")
NOTE=""
[ "$COMPACTS" -eq 0 ] || NOTE="the session compacted $COMPACTS time(s), peak context $PEAK tokens: details may be lost; re-run it in smaller pieces"

printf '%s\n' "$RAW" | jq -c --arg sid "${CLAUDE_CODE_SESSION_ID:-}" --arg model "$MODEL" --arg profile "$PROFILE" \
  --arg agent "$AGENT" --arg cwd "$PWD" --arg out "$OUT" --argjson peak "$PEAK" --argjson compacts "$COMPACTS" \
  '{ts: (now | todate), session: $sid, model: $model,
  profile: $profile, agent: $agent, cwd: $cwd, out: $out, ok: ((.is_error | not) and ((.subtype // "success") == "success")),
  subtype, turns: .num_turns, duration_ms, fresh: (.usage.input_tokens // 0), cached: (.usage.cache_read_input_tokens // 0),
  cache_write: (.usage.cache_creation_input_tokens // 0), out_tokens: (.usage.output_tokens // 0), peak: $peak,
  compacts: $compacts}' \
  >> "$STATE/local-runs.jsonl" 2>/dev/null || true

RESULT="$(printf '%s\n' "$RAW" | jq -r 'if .is_error or (.subtype // "success") != "success" then "LOCAL ERROR: \(.subtype) \(.result // "")" else .result end')"
if [ -n "$OUT" ]; then
  mkdir -p "$(dirname "$OUT")"
  ERR=""; [[ "$RESULT" != "LOCAL ERROR:"* ]] || ERR="$RESULT"
  # Keep a file the worker wrote itself; otherwise the final reply, or the error, becomes the result file.
  if [ ! -s "$OUT" ]; then
    if [ -n "$ERR" ]; then printf 'STATUS: failed\nSUMMARY: %s\n' "$ERR"; else printf '%s\n' "$RESULT"; fi > "$OUT"
    ERR=""
  fi
  # A compacted session's result is partial at best (SKILL.md §4): §3 step 5 re-runs it.
  if [ -n "$NOTE" ]; then
    case "$(head -1 "$OUT")" in
      "STATUS: failed"*|"STATUS: partial"*) ;;
      "STATUS:"*) sed -i "1s/.*/STATUS: partial (local.sh: $NOTE)/" "$OUT";;
      *) sed -i "1i STATUS: partial (local.sh: $NOTE)" "$OUT";;
    esac
  fi
  echo "RESULT FILE: $OUT"
  head -5 "$OUT"
  [ -z "$ERR" ] || printf '%s\n' "$ERR" | head -3
else
  printf '%s\n' "$RESULT"
fi
[ -z "$NOTE" ] || echo "LOCAL WARNING: $NOTE"
exit "$RC"
