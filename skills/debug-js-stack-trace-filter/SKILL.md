---
name: debug-js-stack-trace-filter
description: >-
  Composable filter pipeline for LLM-optimized test output. Strips ANSI escape codes,
  runner banners (Vitest/Jest), passing test lines, timing noise, coverage summaries,
  and noisy stack frames. Use as a pipe filter for any test command to get clean,
  token-efficient output for debugging.
compatibility:
  tools:
    - node (v18+)
---

<purpose>
Apply a composable filter pipeline to raw test runner output. The pipeline strips noise
in this order: ANSI codes → runner banners → passing tests → timing noise → coverage
summaries → noisy stack frames. All other lines are returned unchanged.
</purpose>

<script_location>
The filtering logic lives in:
  @skills/debug-js-stack-trace-filter/scripts/filter-stack.js

Pipe wrapper for stdin → stdout:
  @skills/debug-js-stack-trace-filter/scripts/filter-stack-pipe.js
</script_location>

<usage>
Pipe any test command through the filter:

```bash
npx vitest run --reporter=dot --no-color 2>&1 | node .claude/skills/debug-js-stack-trace-filter/scripts/filter-stack-pipe.js
```

Or import and call programmatically:

```js
import { filterTestOutput } from '.claude/skills/debug-js-stack-trace-filter/scripts/filter-stack.js';
console.log(filterTestOutput(rawTestOutput));
```

Individual filters are also exported for selective use:
- `stripAnsi(lines)` — remove ANSI escape sequences
- `stripRunnerBanners(lines)` — remove Vitest/Jest banners and summaries
- `stripPassingTests(lines)` — remove passing test lines
- `stripTimingNoise(lines)` — remove timing and heap usage lines
- `stripCoverageSummary(lines)` — remove coverage table output
- `filterStackFrames(lines)` — remove noisy stack frames (tier 1 + tier 2)

The backward-compatible `filterStack(input)` alias is preserved.
</usage>
