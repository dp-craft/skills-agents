# Qwen 27B (local)

RedHatAI Qwen3.8-27B MXFP4 with the DFlash2 drafter on Sly (status label `sly-27b`), port 8000, started by
`/home/dev/.config/claude/local_vllm_direct/vllm.sh start|stop|status`; or the IQ4 `.rad` on radiance (`rad-27b`,
`/home/dev/work/dp-craft/amd/stack/serve/radiance/start_qwen38_27b_iq4r-l-v4_rad.sh`). Both serve the same name. Free. Agentic coding and usual implementation;
while it is up it also takes the Ornith, Haiku and Sonnet rows by default (SKILL.md §1). Not for web search (no web
tools on the local route), the Opus row (architecture, complex cases, edge-case TDD, mission-critical work) or reviews.

- **Speed:** decode 87/96/82 tokens/s at 10k/50k/100k (Ornith: 220/205/175), measured in
  `/home/dev/work/dp-craft/amd/docs/findings/radiance/2026-11-04-1746-ornith15-radiance-vs-sly-35b-27b.md`.
- **One session at a time:** `vllm.sh` runs it with `MAXSEQS=1`; `local.sh` queues a second run.
- **System prompt:** the server's chat template (`dp-sharp`) always adds the `dp` terse prompt, so `local.sh` adds none.
- **Clean session:** no CLAUDE.md or project settings. Put the project's rules that matter into the brief, or pass
  `--append-system-prompt-file <file>` after it.
- **Run:** `cd` into the repo, then `local.sh --model 27b --profile code --out <file> "<brief>"`. The `code` profile
  allows edits, pytest, vitest, tsc, `npm test`, `npm run` and read-only git.
- **Code-writer roles:** `local.sh --model 27b --agent <name> --out <file> "<brief>"` runs the repo's
  `.claude/agents/<name>.md` with its rules and tools: the `code` profile plus LSP and `npx tsx`. Like the retired
  `local-agent.sh`, it loads the project's settings, hooks and CLAUDE.md, and tells the worker not to call `local.sh`
  itself. Pass `--agent` only when that file exists. It needs the project settings: in a clean session
  (`--setting-sources ""`) the repo's agents are "not found" (tested 2026-11-06 in dp-forge).
- **Turns:** 80 by default (`local-agent.sh` had 20); `MAX_TURNS=N` or a trailing `--max-turns N` changes it.
- **Check:** run the tests yourself; treat "all tests pass" in its reply as a claim.
