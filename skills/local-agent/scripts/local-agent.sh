#!/usr/bin/env bash
# local-agent: run one self-contained task headless on the local vLLM model server
# (settings: ~/.config/claude/local_vllm_direct/settings.json) and print only the final result.
# usage: local-agent.sh "task" [extra claude args, e.g. --agent tools-code-logic-writer --max-turns 40]
# With --agent <name>, the session runs as .claude/agents/<name>.md (its rules + tools) and may
# also run tests / typecheck / npm scripts.
set -euo pipefail

# The model server + settings come from LOCAL_AGENT_SETTINGS (default the llama-swap muxik).
# Point it at a vLLM settings file (e.g. ~/.config/claude/local_vllm_direct/settings.json) to run
# on a vLLM server; the reachability check is derived from that file's ANTHROPIC_BASE_URL.
SETTINGS="${LOCAL_AGENT_SETTINGS:-/home/dev/.config/claude/local_vllm_direct/settings.json}"

if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "usage: local-agent.sh \"task\" [extra claude args]" >&2
  exit 2
fi
task="$1"; shift

BASE_URL="$(jq -r '.env.ANTHROPIC_BASE_URL // empty' "$SETTINGS" 2>/dev/null)"
if [ -n "$BASE_URL" ] && ! curl -s -m 3 -o /dev/null "$BASE_URL/v1/models"; then
  echo "LOCAL AGENT ERROR: model server not reachable at $BASE_URL (start it first)" >&2
  exit 1
fi

allowed="Read,Grep,Glob,Edit,Write,Bash(git diff:*),Bash(git status:*),Bash(ls:*)"
for arg in "$@"; do
  if [ "$arg" = "--agent" ]; then
    allowed="$allowed,LSP,Bash(npx vitest:*),Bash(npx tsc:*),Bash(npx tsx:*),Bash(npm run:*),Bash(npm test:*)"
    break
  fi
done

RAW="$(claude --settings "$SETTINGS" \
  -p "$task" --output-format json --max-turns "${MAX_TURNS:-20}" \
  --permission-mode acceptEdits \
  --allowedTools "$allowed" \
  --append-system-prompt "You ARE the local agent. Do the task yourself; never call local-agent.sh or delegate it." \
  "$@" < /dev/null 2>/dev/null)"

# Save the raw JSON (num_turns, duration_ms, cost, tokens) when LOCAL_AGENT_OUT is set.
# The caller reads it for the runs table; the result below is unchanged for everyone.
if [ -n "${LOCAL_AGENT_OUT:-}" ]; then
  mkdir -p "$(dirname "$LOCAL_AGENT_OUT")"
  printf '%s\n' "$RAW" > "$LOCAL_AGENT_OUT"
fi

printf '%s\n' "$RAW" | jq -r 'if .is_error then "LOCAL AGENT ERROR: \(.subtype) \(.result // "")" else .result end'
