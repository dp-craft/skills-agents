---
name: research
description: "Use ONLY when the user explicitly asks for research on a topic (research/investigate X, compare these options, find a library, is X feasible, what's been tried before) — routes to the matching `/research:*` command and enforces saving the result under docs/research/; MUST NOT be auto-invoked during speckit phase execution (/speckit.implement, /speckit.phase), nor for ordinary questions, debugging, or implementation work."
---

# research — route an explicit research request to the right `/research:*` command

## Routing table

Pick the FIRST row whose situation matches the user's request.

| Situation (what the user wants) | Command file |
|---|---|
| How to implement something — approaches, libraries, tradeoffs | `research/technical.md` |
| Compare named alternatives side-by-side, want a recommendation | `research/options.md` |
| Find an existing library/tool/project that solves a concrete need | `research/open-source.md` |
| Map a domain — tools, players, trends, gaps | `research/landscape.md` |
| Who else does this — rivals, their strengths/weaknesses | `research/competitive.md` |
| Go/no-go reality check against our constraints | `research/feasibility.md` |
| What has been tried before — past attempts, lessons learned | `research/history.md` |
| Exhaustive investigation, or no row above fits | `research/deep-dive.md` |

### Tie-breakers (apply in order, deterministic)

| Ambiguity | Rule |
|---|---|
| `technical` vs `options` | User names ≥2 concrete candidates → `options`. One goal, no candidates → `technical` |
| `open-source` vs `landscape` | Goal is to ADOPT something → `open-source`. Goal is to UNDERSTAND the space → `landscape` |
| `landscape` vs `competitive` | Named products/companies as rivals → `competitive`. Whole space incl. trends/gaps → `landscape` |
| `technical` vs `feasibility` | Question is "how" → `technical`. Question is "can we / should we" → `feasibility` |
| `history` vs `landscape` | Past/abandoned attempts → `history`. Current state of the art → `landscape` |
| `deep-dive` vs any other row | `deep-dive` ONLY when no specific row matches, or the user asks for exhaustive depth |

## Instruction

Read `.claude/commands/<chosen path>` and follow it exactly, substituting the user's topic wherever it says `$ARGUMENTS`.

## Standing project rules

- **Output location (MUST).** Every web research pass MUST be written to `docs/research/<YYYY-MM-DD-HHMM>-<slug>.md` — date + 4-digit time + slugified topic. This naming OVERRIDES the `<artifact_output>` filename format inside the routed command file; the rest of that section still applies.
- **Tool priority** (CLAUDE.md § Web Research Tool Priority): `text-webfetch` subagent → Context7 → WebFetch → WebSearch. Skip unavailable tools.
