---
name: consider
description: "Use ONLY when the user explicitly asks for help thinking a decision through or names a thinking framework (find the root cause, what am I giving up, what could go wrong, prioritize these, simplify this) — routes to the matching `/consider:*` framework command; MUST NOT be auto-invoked during speckit phase execution (/speckit.implement, /speckit.phase), nor for research requests or ordinary implementation work."
---

# consider — route a decision-framing request to the right `/consider:*` command

These are decision-framing aids, not research. For gathering external facts use the `research` skill instead.

## Routing table

Pick the FIRST row whose situation matches the user's request.

| Situation (what the user wants) | Command file |
|---|---|
| Drill to the root cause of a problem | `consider/5-whys.md` |
| Strip to fundamentals and rebuild from base truths | `consider/first-principles.md` |
| Pick the simplest explanation that fits the facts | `consider/occams-razor.md` |
| Work backwards — what would guarantee failure | `consider/inversion.md` |
| Trace consequences of consequences | `consider/second-order.md` |
| Weigh a decision across 10 min / 10 months / 10 years | `consider/10-10-10.md` |
| Name what is given up by choosing this option | `consider/opportunity-cost.md` |
| Map strengths, weaknesses, opportunities, threats of a subject | `consider/swot.md` |
| Find the 20% of inputs driving 80% of the result | `consider/pareto.md` |
| Identify the single highest-leverage action | `consider/one-thing.md` |
| Prioritize many tasks by urgent vs important | `consider/eisenhower-matrix.md` |
| Improve by removing rather than adding | `consider/via-negativa.md` |

### Tie-breakers (apply in order, deterministic)

| Ambiguity | Rule |
|---|---|
| `5-whys` vs `first-principles` | Something WENT WRONG, diagnose it → `5-whys`. Building/redesigning a solution → `first-principles` |
| `5-whys` vs `occams-razor` | Competing explanations already on the table, pick one → `occams-razor`. No explanation yet, drill down → `5-whys` |
| `pareto` vs `one-thing` | User wants exactly ONE action → `one-thing`. A high-impact SUBSET → `pareto` |
| `pareto` vs `eisenhower-matrix` | An explicit LIST of tasks to order → `eisenhower-matrix`. Impact concentration → `pareto` |
| `inversion` vs `second-order` | Goal is to AVOID failure modes → `inversion`. Goal is to trace ripple effects of a chosen action → `second-order` |
| `second-order` vs `10-10-10` | Consequences chain causally → `second-order`. Consequences differ by TIME HORIZON → `10-10-10` |
| `opportunity-cost` vs `swot` | Choosing BETWEEN options → `opportunity-cost`. Assessing ONE subject's position → `swot` |
| `via-negativa` vs `one-thing` | The best move is a REMOVAL → `via-negativa`. An addition → `one-thing` |

## Instruction

Read `.claude/commands/<chosen path>` and follow it exactly, substituting the user's topic wherever it says `$ARGUMENTS`.
