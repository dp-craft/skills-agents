#!/usr/bin/env bash
# local-status.sh: one line on the local model server, GPU, other GPU engines and Claude sessions, for routing.
# usage: local-status.sh [--short]    --short prints the server, GPU busy %, VRAM and vLLM's queue (for the status line).
# Server labels: rad-ornith (Ornith on radiance), sly-27b (the 27b on Sly), rad-27b (the 27b IQ4 .rad on radiance),
# other (<served name>), none. All three report the 27b's name on :8000; Ornith is told apart by /v1/models .root,
# the engine by .owned_by.
PORT=${PORT:-8000}

models=$(curl -s -m 1 "http://127.0.0.1:$PORT/v1/models" 2>/dev/null)
id=$(jq -r '.data[0].id // empty' <<<"$models" 2>/dev/null)
root=$(jq -r '.data[0].root // empty' <<<"$models" 2>/dev/null)
owner=$(jq -r '.data[0].owned_by // empty' <<<"$models" 2>/dev/null)
case "$root|$id" in
  *ornith*) srv=rad-ornith;;
  *27b*|*27B*) if [ "$owner" = radiance ]; then srv=rad-27b; else srv=sly-27b; fi;;
  "|") srv=none;;
  *) srv="other ($id)";;
esac

# The card with the largest VRAM is the discrete GPU.
gpu=$(for d in /sys/class/drm/card*/device; do
  [ -r "$d/mem_info_vram_total" ] && echo "$(cat "$d/mem_info_vram_total") $(cat "$d/mem_info_vram_used") $(cat "$d/gpu_busy_percent" 2>/dev/null || echo '?')"
done | sort -n | tail -1)
read -r total used busy <<<"$gpu"
vram=""; [ -z "$total" ] || vram="$((used / 1048576))/$((total / 1048576)) MiB"

# vLLM's queue counts every client: this and other sessions, pipelines, benchmarks.
queue=""
[ "$srv" = none ] || queue=$(curl -s -m 0.5 "http://127.0.0.1:$PORT/metrics" 2>/dev/null | awk '
  /^vllm:num_requests_running/ {r += $NF; m = 1} /^vllm:num_requests_waiting/ {w += $NF; m = 1}
  END {if (m) printf " · vllm %d running, %d waiting", r, w}')
head=":$PORT $srv · GPU ${busy:-?}% · VRAM ${vram:-?}$queue"

if [ "${1:-}" = --short ]; then echo "$head"; exit 0; fi

others=$(pgrep -a llama-server | grep -o -- '--port [0-9]*' | awk '{printf "llama-server:%s ", $2}')
swap=off
if args=$(pgrep -a -x llama-swap); then
  lport=$(grep -o -- '-listen [^ ]*' <<<"$args" | grep -o '[0-9]*$'); lport=${lport:-8080}
  swap=$(curl -s -m 1 "http://127.0.0.1:$lport/running" | jq -r '[.running[]? | .model] | if length == 0 then "idle" else join(",") end' 2>/dev/null)
  swap=${swap:-up}
fi

# Interactive sessions = claude processes without -p/--print; headless = with it (benchmarks and pipelines too);
# local.sh runs are the headless ones with its *.dpfan.json settings.
procs=$(pgrep -a -x claude || true)
inter=$(printf '%s' "$procs" | grep -cvE ' (-p|--print)( |$)' || true)
headless=$(printf '%s' "$procs" | grep -cE ' (-p|--print)( |$)' || true)
mine=$(printf '%s' "$procs" | grep -c 'dpfan.json' || true)

echo "$head · other GPU engines: ${others:-none} · llama-swap: $swap · claude: $inter interactive (incl. this one), $headless headless ($mine via local.sh)"
