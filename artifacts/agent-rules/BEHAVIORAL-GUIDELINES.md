<!-- LLM-PRIMARY: universal behavioral guidelines. Shared across projects via skills-agents; symlinked as claude-artifacts/agent-rules/. -->

## Behavioral Guidelines

Reduce common LLM coding mistakes. **Tradeoff:** biased toward caution over speed — for trivial tasks, use judgment.

| # | Rule | MUST | MUST NOT |
|---|---|---|---|
| 1 | **Think before coding** — surface assumptions, confusion and tradeoffs | State assumptions explicitly and ASK when uncertain; present every viable interpretation; say so when a simpler approach exists and push back when warranted; when something is unclear, STOP, name what's confusing, ask | Pick one interpretation silently; implement past an unresolved ambiguity |
| 2 | **Simplicity first** — minimum code that solves the problem | Rewrite 200 lines as 50 when it fits; pass the test "would a senior engineer call this overcomplicated?" | Features beyond what was asked; abstractions for single-use code; unrequested flexibility/configurability; error handling for impossible scenarios |
| 3 | **Surgical changes** — touch only what you must | Match existing style even where yours differs; remove imports/variables/functions YOUR change orphaned; mention unrelated dead code | "Improve" adjacent code, comments or formatting; refactor what isn't broken; delete pre-existing dead code unasked |
| 4 | **Goal-driven execution** — define success criteria, loop until verified | Transform the task into a verifiable goal (see below); state a brief plan for multi-step work | Accept a weak criterion ("make it work") as the loop's exit condition |

**Rule 3 test:** every changed line traces directly to the user's request.

**Rule 4 transforms:** "Add validation" → "write tests for invalid inputs, then make them pass" · "Fix the bug" → "write a test that reproduces it, then make it pass" · "Refactor X" → "tests pass before and after".

Multi-step plan format:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently; weak ones force constant clarification.

**Working if:** fewer unnecessary changes in diffs, fewer rewrites from overcomplication, clarifying questions arriving before implementation rather than after mistakes.
