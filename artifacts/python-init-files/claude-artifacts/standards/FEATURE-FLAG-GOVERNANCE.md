<!-- LLM-PRIMARY: Feature flag governance — creation, usage, lifecycle, and persistence rules. -->

# Feature Flag Governance

- Every non-trivial new feature MUST be gated behind a feature flag. Non-trivial = any feature that adds new UI surfaces, changes user-facing behavior, or introduces new data flows. Simple improvements, bugfixes, and minor modifications (config changes, copy updates, style tweaks) are EXEMPT
- Flags MUST default to `false` (disabled) unless the feature is universally safe and non-disruptive
- Consumers that change based on a flag MUST read from the flag state manager — not from raw persistence
- When a flag controls visibility of a resource (e.g., providers), toggling OFF MUST include fallback logic to reset any active selection that becomes invisible

## Flag Registration

Feature flags MUST be registered in the target's flag registry with:

| Field | Required | Example |
|---|---|---|
| Unique key (`FeatureFlagKey`) | Yes | `web-search-enabled` |
| Default value (boolean) | Yes | `false` |
| i18n keys (if UI-exposed) | Yes (browser/Electron renderer) | `featureFlags.{key}-name`, `featureFlags.{key}-description` |

## Persistence Strategy

**Runtime-only**: flags are persisted and loaded at app startup via the target's native storage. No build-time flag compilation.

| Target | Persistence | State Manager | Key Format |
|---|---|---|---|
| Browser (PWA) | IDB `appSettings` store | `useFeatureFlagStore` (Zustand) | `ff-{key}` |
| Node Backend | Database table (`feature_flags`) | Feature flag service (singleton) | `{key}` |
| Electron Main | SQLite or `electron-store` | Feature flag service (module-level) | `{key}` |
| Electron Renderer | Reads from main via IPC | `useFeatureFlagStore` (Zustand) | `ff-{key}` |
| Chrome Extension | `chrome.storage.sync` | Background state manager | `ff-{key}` |

**Rationale**: Runtime-only keeps all flags in one persistence layer per target, avoids build-time/runtime split complexity, and supports user-facing toggles (Settings UI). If build-time gating becomes necessary (e.g., dead-code elimination for bundle size), upgrade to a layered strategy: build-time for permanent gates, runtime for user toggles.

## Flag Lifecycle

| Phase | Action |
|---|---|
| Creation | Register in flag registry, add i18n keys (if UI-exposed), default `false` |
| Development | Gate all new UI/behavior behind flag checks |
| Stabilization | After feature passes UAT and has been enabled for 2+ releases without issues, flag is eligible for graduation |
| Graduation | Remove flag from registry, remove all flag checks, make feature always-on. Clean up i18n keys. Commit as `chore: graduate feature flag {key}` |
