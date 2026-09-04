<!-- LLM-PRIMARY: Step-by-step responsibility assignment rules for cross-cutting features. Prevents SRP violations like tutorial-in-settings coupling. Referenced from COMMON.md Section II. -->

# Responsibility Rules

> **Golden Rule**: "A feature that needs to know about another feature's state should OBSERVE the store, not require the other feature to call its hooks."

## The Core Problem

When building cross-cutting features (tutorial, analytics, theming, accessibility), the naive approach is:

> "Feature X needs to know when Settings opens. Let's add a hook to Settings that reports to Feature X."

This creates **inverted responsibility**: Settings depends on Feature X. If X is removed, Settings has dead code. If Feature Y also needs the same info, Settings gets another hook.

**Correct approach:** Feature X observes Settings' existing state. Settings doesn't know Feature X exists.

## Rules

### Rule 1: The Direction Test

**Question:** "Does module A need module B, or does A need STATE that B owns?"

| Answer | Pattern | Example |
|---|---|---|
| A needs B specifically | Direct dependency (likely wrong) | Settings importing TutorialHook |
| A needs STATE that B owns | Observe B's store | Tutorial subscribing to Settings store |

**If "A needs STATE" -> A observes, never imports from B.**

### Rule 2: The Removal Test

**Question:** "If I delete Feature X entirely, which other files change?"

1. List every file that would import from Feature X
2. If ANY file outside `features/X/` needs modification -> **SRP violation**
3. Acceptable external touch points:
   - `App.tsx` (mounting container)
   - `features/X/index.ts` barrel
   - Global stores that X legitimately contributes to

### Rule 3: Responsibility Ownership Matrix

Before any cross-feature interaction, fill in:

| Question | Must Point To |
|---|---|
| **Who owns the data?** | Source-of-truth store |
| **Who owns the behavior?** | Module deciding what happens on state change |
| **Who owns the UI?** | Module rendering the visual result |

All three MUST point to the SAME feature for a given concern.

| Data | Behavior | UI | Verdict |
|---|---|---|---|
| A | A | A | Correct — self-contained |
| A | B | B | Correct — B observes A |
| A | A | B | Wrong — A pushes UI into B |
| A | B | A | Wrong — mixed ownership |

### Rule 4: Cross-Cutting Feature Protocol

For features reacting to events across multiple features:

1. **Identify state sources** — list store fields needed
2. **Verify store availability** — if in local `useState` and >1 consumer needs it, lift to store
3. **External subscription** — `store.subscribe(selector, listener)` from YOUR module
4. **Pure predicates** — each reaction: `(stateSnapshot) => boolean`
5. **Feature flag** — cross-cutting features MUST be flaggable

### Rule 5: Data Flow Audit

```
Allowed:  Feature -> reads -> Store (via barrel or subscribe)
Allowed:  Feature -> writes -> Own Store
Allowed:  Store -> reads -> Service -> Infrastructure

Forbidden: Feature A -> writes -> Feature B's Store
Forbidden: Feature A -> requires -> B to call A's hook
Forbidden: Feature A -> modifies -> B's container/component
```

### Rule 6: High-Level App State Rule

High-level app states MUST be in a global state manager (browser: `stores/useUIStore.ts`; backend: app-level service; Electron: main process state; extension: background state).

| Category | Where | Examples |
|---|---|---|
| Active page/route | Global state manager | 'chat', 'skills', '/api/users' |
| Primary dialog/modal | Global state manager | 'settings', 'prompt-tester', null |
| Domain-derived state | Domain state manager | Unlock modal, Tutorial welcome, auth state |
| Contextual/ephemeral | Local state (container, handler) | Confirm dialogs, form values, loading |

### Rule 7: "Who Changes When" Test

> "When the imported module's API changes, does my module need to change?"

| Dependency type | Risk | Acceptable? |
|---|---|---|
| Store field selector | Low (TS enforces) | Yes |
| Store action call | Low | Yes |
| Hook import into container | Medium | Evaluate case-by-case |
| Hook wrapping MY callback | High (coupling) | No — inverted dependency |

## Step-by-Step Protocol

Run this checklist for ANY new feature interaction:

```
1. IDENTIFY: What state do I need from other modules?
   -> List store fields, not file paths

2. DIRECTION TEST (Rule 1): Observing state or requiring action?
   -> Requiring action: STOP, redesign

3. REMOVAL TEST (Rule 2): Delete my feature — what files change?
   -> Files outside my dir change: STOP, redesign

4. OWNERSHIP MATRIX (Rule 3): Data, behavior, UI owners?
   -> All must point to MY module for MY concern

5. STORE AVAILABILITY (Rule 4.2): Is needed state in a store?
   -> If not and >1 consumer: lift to store

6. SUBSCRIBE (Rule 4.3): Use external subscription
   -> store.subscribe(), not hooks in other modules

7. FEATURE FLAG (Rule 4.5): Can this be toggled off cleanly?
   -> Adding flag: 5 min. Removing spaghetti: hours.
```

## Anti-Patterns

| Anti-Pattern | Example | Correct Pattern |
|---|---|---|
| Callback wrapping | Hook wraps another feature's callbacks | Subscribe to store externally |
| Feature-in-feature UI | "Replay Tutorial" button inside Settings | Own UI surface (sidebar icon) |
| Unobservable state | Dialog open/close in local useState | Lift to UIStore |
| Dead hook exports | Hook exported but never imported anywhere | Don't export hooks for other features |
| Missing feature flag | Feature can't be disabled without code changes | Register in feature flag registry |
| Event bus coupling | Feature emits event, other listens | Store subscription (no events needed) |
