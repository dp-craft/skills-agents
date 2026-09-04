<!-- LLM-PRIMARY: Debugging rules for Python projects. All agents. -->

# Debugging Rules

> **Golden Rule**: "Bugs live in stateful services, not pure functions; trace data flow, test hypothesis, question if your fix masks the real bug."

## Rule 0: Stateful vs Stateless Identification

- File contains class with `__init__` managing state, or module-level mutable variables → **STATEFUL** (can cause complex bugs)
- File contains only pure functions, `@dataclass(frozen=True)`, constants → **STATELESS** (cannot cause state bugs, skip to caller)
- If a "utility" file mutates module-level state → **CRITICAL issue**, fix immediately

## Debugging by Module Type

| Aspect | Stateless (Pure function / frozen dataclass) | Stateful (Service / repository / handler) |
|---|---|---|
| Can cause races/state bugs? | No — skip to caller | Yes — investigate here |
| Bug types | Logic errors (wrong calculation, bad transform) | State mutations, connection leaks, race conditions |
| Fix approach | Change transform logic, check edge cases | Trace data flow, check transaction boundaries |
| Test type | Unit test: input → assert output | Integration test with fixtures/mocks |

## Rule 1: Module Type Triage

```
Bug reported → Check module type (use Rule 0):
- Pure function: Skip, check caller
- Service/repository (stateful): Investigate here
- Route handler: Check request parsing, deps injection FIRST
```

## Rule 2: Data Flow First

```
WRONG: Module tree → Read all files → Guess
RIGHT: State mutation → What triggers? → Check transaction → Fix
```

Start from the state mutation (DB write, cache update), trace BACKWARDS to what triggers it. Do NOT trace forwards through the call chain.

## Rule 3: Unit Test Hypotheses

```
Hypothesis: "Date parsing fails on timezone-naive input"
Action: Write unit test with timezone-naive datetime
Result: Test fails → Hypothesis confirmed, dig deeper
```

If test fails, you found the symptom. Dig deeper for root cause.

## Rule 4: Transaction / Connection Audit

```python
async with session.begin():
    result = await repo.update(entity)
    #                    ^^^^^^
    # For each DB operation:
    # - Is it within a transaction? ✓ Safe
    # - Is the session properly scoped? ✓ Safe
    # - Is the connection returned to pool? ✓ Safe
    # - Are there nested transactions? ❌ CHECK carefully
```

Connection leaks → exhausted pool → mysterious timeouts. Audit session lifecycle on every DB-related bug.

## Rule 5: Question Caching Fixes

If a fix uses `@lru_cache` / `@cache` / Redis caching: remove it temporarily. If the bug returns → you're masking a symptom, find the root cause. If no performance issue exists without it → remove the caching.

## Rule 7: Avoid E2E for Logic Bugs

| Bug Type | Test Type | Reason |
|---|---|---|
| Logic (wrong calculation, bad transform) | Unit test | <1ms per run |
| API (request/response, validation) | Integration test | 10-50ms per run |
| Full workflow (multiple features) | E2E test | 1-5s per run |

## Rule 8: User Challenge Protocol

When user says "are you sure?" or "think hard":
1. Stop current approach
2. Re-read the error/symptom
3. Trace data flow from scratch
4. Question every assumption
5. Ask: "What am I missing?"

## Red Flags Checklist

Before marking a bug as "fixed":
- [ ] Can I explain WHY the fix works at the data-flow level?
- [ ] Did I check ALL transaction boundaries in the call chain?
- [ ] Did I write a unit test proving the root cause?
- [ ] Does the fix survive removal of all caching?
- [ ] Did I trace state mutations backwards to their trigger?
- [ ] Is the fix in a service/repository, not a route handler?

## Anti-Patterns

| Anti-Pattern | Why Wrong | Correct Approach |
|---|---|---|
| Adding try/except everywhere | Masks root cause | Find the actual error source |
| Fixing route handler first | Thin layer = not the source | Check services/repos |
| Skipping unit tests | Slow feedback loop | Test hypothesis first |
| Only checking traceback | Symptom, not cause | Trace data flow |
| Assuming first fix is correct | May be masking | Question fix mechanism |
| Bare `except Exception` | Silences real errors | Catch specific exceptions |

## When to Escalate

1. Fixed bug 3+ times, still returns
2. Data flow trace doesn't reveal obvious issue
3. Multiple competing hypotheses, unclear which to test first
4. Fix works but you can't explain why

**Format**: "Bug persists after fixing X. Data flow shows Y. Hypotheses: A, B. Which to investigate?"
