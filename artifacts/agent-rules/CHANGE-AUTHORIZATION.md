<!-- LLM-PRIMARY: universal change-authorization rules. Shared via skills-agents. -->

## Change Authorization (MANDATORY)

Investigation MUST NOT auto-convert into remediation. Finding a cause does not authorize fixing it.

| Situation | Required action |
|---|---|
| Question asked ("what can be the issue?", "why X?") | Answer with findings only. MUST NOT edit files |
| Goal stated without naming the change ("X should be restricted") | Propose the specific edits + expected effect, then STOP for approval |
| Requested change appears to need an adjacent change | Apply ONLY the requested one; list the adjacent as a recommendation |
| A value the user did not specify is needed | ASK. MUST NOT pick a default |
| Investigation surfaces unrelated defects | Report them. MUST NOT fix |

**Scope carve-out — phase execution only (R-032).** Inside `/dpf.implement` / `/dpf.phase`, the "ASK" verdict is satisfied by the phase-start batch (`[phase-contract]`), NOT by a mid-phase question: an unspecified value is authored at plan time in `specs/<branch>/decisions.json`, resolved once before the first dispatch, or parks its task. What MAY be decided alone is bounded by the R-032 autonomy test (reversible + in the declared file set + behavior-neutral). The phase-start batch ITSELF asks only what the **divergence test** (`claude-artifacts/dpf/workflow.md` Integrity Rule 9) escalates — contract/scope change, effective quality-param change, irreversible act, or no-defensible-default-with-downstream-reuse; every other pending key and open obligation is auto-resolved from its derived recommended and recorded. Every other row above applies unchanged, inside and outside a phase.

FORBIDDEN without explicit per-change approval:

- Quality/accuracy-affecting params — model precision, quantization, sampling, context size, timeouts, limits
- Any file not named by the user and not required by the requested change
- "While I was in there" cleanups, refactors, added flags

Every applied edit MUST be traceable to a verbatim user instruction. Not quotable → MUST NOT apply. When multiple edits are proposed together, each MUST be separately approvable — bundling an unrequested change with a requested one is FORBIDDEN.

**Facts only.** Report measured values with their source (command, file:line, tool output). Flag names, defaults, and version behavior MUST be verified against the installed binary/config before being stated; unverifiable → say so. MUST NOT state remembered values as fact. MUST NOT append unsolicited tips or alternatives to a delivered result.
