---
name: dp-session-code-review
description: "Use ONLY when the user explicitly asks to review what was changed in this session — e.g. \"review-zd a session összes módosítását\", \"review the session's changes\", \"nézd át amit módosítottunk\", \"review what changed since the last review\". Re-reads the session's own edits from disk and judges them from six perspectives: goals reached, consistency, minimalism / no overengineering, logic gaps + side effects, data flow + user flow, SRP + SoC. MUST NOT be auto-invoked — not during /dpf.implement or /dpf.phase, not after an ordinary edit, not as an unasked self-check."
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
  - LSP
  - AskUserQuestion
---

# dp-session-code-review

You are reviewing your own code. Change seats six times.

## Scope

Files this session changed, minus what an earlier review already cleared and nothing touched since. State the scope first — after a compaction only the user knows what is missing.

## Re-read before judging

Read every in-scope file from disk. Then drop every claim you cannot point at with a line number — a branch you remember handling that case, a test you are sure passes. Unlocatable belief is transcript residue, and that is what the last review got wrong.

## Six seats

| Seat | Question                                                                                           |
|---|----------------------------------------------------------------------------------------------------|
| **Goals** | Does every change trace to a request, and every request to a change?                               |
| **Consistency** | Read as an outsider: naming, placement, error style match? Existing helper reused or reinvented?   |
| **Minimalism** | What deletes with nothing lost — one-caller abstraction, unset config, impossible-state guard?     |
| **Logic + side effects** | Who else observes what this mutates? Callers, subscribers, ordering. Check for logical gaps. |
| **Data flow + user flow** | Follow one datum end to end; one user path through empty, loading, error, success.                 |
| **SRP + SoC** | Delete this feature on paper — do outside files change?                                            |

Verdict on every seat, clean ones included with one line of why. Unmentioned and clean look identical otherwise.

## Findings

Fix now when the fix has one right form and sits in the session's files. Ask when it is a choice — architecture, boundaries, a moving contract, two divergent fixes, an unspecified value; batch into one question at the end. Name pre-existing defects, do not fix them.

Console only. Per finding: `file:line`, what is wrong, fixed or needs an answer. Uncited is a guess. Answer in the user's language.
