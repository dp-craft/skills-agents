# {branch-name} — Implementation Summary

<!-- SCOPE: This analysis covers THIS epic only — phase retros + Pre-Merge retro. Do NOT read or reference other epics' retrospectives. -->

<!-- PRIORITIZATION WEIGHTS — apply these when scoring findings in Section 4:

BOOST priority when:
- Workflow or agent improvement (not technology-specific) → +1 level
- Same root cause appears in 2+ phases (recurring pattern) → +1 level
- Fix is cheap (<5 min) AND reduces token usage or retries → +1 level
- Minimal or no side effects → +1 level

DEMOTE priority when:
- Technology-specific (only applies to one library/API) → -1 level
- One-off issue unlikely to recur → -1 level
- Fix is expensive (>30 min) or risky (may break other things) → -1 level
- Speculative benefit (no measurable savings) → -1 level

Net priority after boosts/demotes: Critical > High > Medium > Low
A finding can appear as Low but still be listed — the user wants ALL findings visible.
-->

**Feature:** {feature-id} {feature-name}
**Date:** {YYYY-MM-DD}
**Phases:** {N} | **Tasks:** {completed}/{total} | **Retries:** {M} ({N}% preventable)

---

## 1. Epic Overview

<!-- Aggregate from all phase retro Phase Stats sections -->

| Metric | Value |
|---|---|
| Phases | {N} |
| Tasks completed | {X}/{Y} |
| Tasks skipped | {list or "none"} |
| Total retries | {M} |
| Preventable retries | {N}% |
| New files created | {N} |
| Lines added / removed | +{N} / -{N} |
| Test count delta | +{N} |
| Coverage delta | {before}% -> {after}% |
| New dependencies | {list or "none"} |
| Non-task commits | {N} <!-- from Non-Task Commits sections --> |

---

## 2. Phase-by-Phase Summary

<!-- One row per phase. Aggregated from {branch-name}-phase-NN.md files. -->

| Phase | Name | Tasks | Retries | Key Issues | Verdict |
|---|---|---|---|---|---|
| 01 | {name} | {X}/{Y} | {N} | {1-line summary} | {1-line verdict from phase retro} |
| 02 | {name} | {X}/{Y} | {N} | {1-line summary} | {1-line verdict} |

---

## 3. Pre-Merge Process Retrospective

<!-- STANDALONE BLOCK — from {branch-name}-pre-merge-retro.md written by orchestrator -->

### Steps that caught real issues

<!-- List Pre-Merge steps that found actual problems requiring fixes -->

| Step | What | Finding | Action Taken |
|---|---|---|---|
| {N} | {step name} | {what was found} | {what was fixed} |

### Steps that were no-ops

<!-- List Pre-Merge steps that passed without findings — consider making conditional -->

| Step | What | Why No-Op | Suggest Conditional? |
|---|---|---|---|
| {N} | {step name} | {why nothing found} | {Yes/No — condition} |

### Pre-Merge workflow improvement suggestions

<!-- Concrete suggestions for improving the Pre-Merge workflow itself -->

| # | Suggestion | Rationale | Effort |
|---|---|---|---|
| 1 | {suggestion} | {why} | {Low/Med/High} |

---

## 4. All Findings

<!-- EVERY finding from all phases + Pre-Merge, including minor ones. Ordered by Priority (Critical > High > Medium > Low). Source: phase retro "Findings & Recommendations" tables + Pre-Merge retro. -->

| # | Priority | Category | Finding | Root Cause | Affected Phase(s) | Recommendation | Effort | Risk | Est. Savings |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Critical | {category} | {finding} | {root cause} | {phase list} | {recommendation} | {Low/Med/High} | {None/Low/Med/High} | {savings} |
| 2 | High | | | | | | | | |
| 3 | Medium | | | | | | | | |
| N | Low | {category} | {minor finding} | {root cause} | {phase} | {recommendation} | {effort} | {risk} | {savings} |

<!-- Categories: Workflow Gate, Agent Prompt, Testing Discipline, Lint/Tooling, Task Planning, Architecture, Import Discipline, State Management, Type System, Pre-Merge Process -->

<!-- Priority criteria (AFTER applying boost/demote weights from top of file):
- Critical: Prevents retries of the #1 failure mode, zero risk, <5 min effort
- High: Measurable token/time savings, low risk, <15 min effort
- Medium: Cumulative savings, moderate effort or some risk
- Low: Minor improvement, nice-to-have, or technology-specific — STILL LISTED (user wants all findings visible)
-->

---

## 5. What Worked Well

<!-- Aggregate from phase retro "What Worked Well" sections. Include evidence. -->

- {pattern}: {evidence from this epic}

---

## 6. Connections & Recurring Patterns

<!-- Cross-phase patterns within THIS epic. Logical dependencies between findings. Tool usage effects. -->

### Recurring issues (same root cause in 2+ phases)

| Pattern | Occurrences | Phases | Root Cause | Status |
|---|---|---|---|---|
| {pattern} | {N} | {phase list} | {shared root cause} | {Fixed in phase X / Still open} |

### Logical dependencies between findings

<!-- Findings that are connected — fixing one may resolve or expose others -->

- {Finding #X} -> {Finding #Y}: {relationship}

### Agent usage effects

<!-- Aggregate from phase retro Agent Tool Usage Matrix + Usage Pattern Analysis -->

| Agent | Effective When | Problematic When | Evidence |
|---|---|---|---|
| {agent} | {context} | {context} | {specific task refs} |

---

## 7. Implementation Readiness

<!-- For the user to decide which recommendations to act on without re-reading all phase files -->

### Quick wins (do now — <5 min, zero risk)

| # | Finding Ref | Action |
|---|---|---|
| 1 | #{N} | {concrete action} |

### Next batch (do soon — <30 min, low risk)

| # | Finding Ref | Action |
|---|---|---|
| 1 | #{N} | {concrete action} |

### Backlog (do when convenient)

| # | Finding Ref | Action |
|---|---|---|
| 1 | #{N} | {concrete action} |
