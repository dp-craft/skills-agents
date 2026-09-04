import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterStack,
  filterTestOutput,
  stripAnsi,
  stripRunnerBanners,
  stripPassingTests,
  stripTimingNoise,
  stripCoverageSummary,
  filterStackFrames,
  checkCoverageThresholds,
} from './filter-stack.js';

/**
 * Run tests with:
 *   node --test ".claude/skills/debug-js-stack-trace-filter/scripts/filter-stack.test.js"
 */

// ===========================================================================
// stripAnsi
// ===========================================================================

test('stripAnsi: removes color codes', () => {
  const lines = ['\x1B[31mError: boom\x1B[0m', '    at myFn (/project/src/index.js:10:3)'];
  assert.deepStrictEqual(stripAnsi(lines), ['Error: boom', '    at myFn (/project/src/index.js:10:3)']);
});

test('stripAnsi: removes bold and underline codes', () => {
  const lines = ['\x1B[1m\x1B[4mFAIL\x1B[0m src/test.ts'];
  assert.deepStrictEqual(stripAnsi(lines), ['FAIL src/test.ts']);
});

test('stripAnsi: removes OSC sequences (hyperlinks)', () => {
  const lines = ['\x1B]8;;https://example.com\x07link text\x1B]8;;\x07'];
  assert.deepStrictEqual(stripAnsi(lines), ['link text']);
});

test('stripAnsi: passes through plain text unchanged', () => {
  const lines = ['Error: boom', '    at myFn (/project/src/index.js:10:3)'];
  assert.deepStrictEqual(stripAnsi(lines), lines);
});

// ===========================================================================
// stripRunnerBanners
// ===========================================================================

test('stripRunnerBanners: removes Vitest DEV banner', () => {
  const lines = [' DEV v4.0.18 /project', '', 'FAIL src/test.ts'];
  assert.deepStrictEqual(stripRunnerBanners(lines), ['', 'FAIL src/test.ts']);
});

test('stripRunnerBanners: removes Vitest RUN banner', () => {
  const lines = [' RUN v4.0.18 /project', 'FAIL src/test.ts'];
  assert.deepStrictEqual(stripRunnerBanners(lines), ['FAIL src/test.ts']);
});

test('stripRunnerBanners: removes Jest summary lines', () => {
  const lines = [
    'Test Suites: 1 failed, 2 passed, 3 total',
    'Tests: 1 failed, 5 passed, 6 total',
    'Snapshots: 0 total',
    'Time: 1.234s',
    'Ran all test suites matching /test/',
  ];
  assert.deepStrictEqual(stripRunnerBanners(lines), []);
});

test('stripRunnerBanners: removes Jest PASS file lines', () => {
  const lines = ['PASS src/utils/parser.test.ts', 'FAIL src/services/api.test.ts'];
  assert.deepStrictEqual(stripRunnerBanners(lines), ['FAIL src/services/api.test.ts']);
});

test('stripRunnerBanners: removes Vitest file-level pass summary', () => {
  const lines = [' ✓ src/test.ts (5 tests)', ' ✗ src/fail.ts'];
  assert.deepStrictEqual(stripRunnerBanners(lines), [' ✗ src/fail.ts']);
});

test('stripRunnerBanners: removes Vitest Test Files summary', () => {
  const lines = [' Test Files  3 passed (3)', 'FAIL output here'];
  assert.deepStrictEqual(stripRunnerBanners(lines), ['FAIL output here']);
});

test('stripRunnerBanners: keeps failure output', () => {
  const lines = ['FAIL src/test.ts', '  > expected true to be false'];
  assert.deepStrictEqual(stripRunnerBanners(lines), ['FAIL src/test.ts', '  > expected true to be false']);
});

// ===========================================================================
// stripPassingTests
// ===========================================================================

test('stripPassingTests: removes checkmark lines', () => {
  const lines = ['  ✓ should add numbers', '  ✗ should subtract numbers'];
  assert.deepStrictEqual(stripPassingTests(lines), ['  ✗ should subtract numbers']);
});

test('stripPassingTests: removes Windows checkmark lines', () => {
  const lines = ['  √ should add numbers', '  ✗ should subtract numbers'];
  assert.deepStrictEqual(stripPassingTests(lines), ['  ✗ should subtract numbers']);
});

test('stripPassingTests: removes PASS lines', () => {
  const lines = ['PASS src/test.ts', 'FAIL src/other.ts'];
  assert.deepStrictEqual(stripPassingTests(lines), ['FAIL src/other.ts']);
});

test('stripPassingTests: removes dot reporter dots', () => {
  const lines = ['...........', 'FAIL src/other.ts'];
  assert.deepStrictEqual(stripPassingTests(lines), ['FAIL src/other.ts']);
});

test('stripPassingTests: keeps failure lines', () => {
  const lines = ['  ✗ should subtract numbers', '    Expected: 3', '    Received: 5'];
  assert.deepStrictEqual(stripPassingTests(lines), lines);
});

// ===========================================================================
// stripTimingNoise
// ===========================================================================

test('stripTimingNoise: removes Time summary lines', () => {
  const lines = ['Time: 1.234s', 'FAIL src/test.ts'];
  assert.deepStrictEqual(stripTimingNoise(lines), ['FAIL src/test.ts']);
});

test('stripTimingNoise: removes slow test suite warnings', () => {
  const lines = ['Slow test suite detected: src/heavy.test.ts', 'FAIL output'];
  assert.deepStrictEqual(stripTimingNoise(lines), ['FAIL output']);
});

test('stripTimingNoise: removes heap usage lines', () => {
  const lines = ['Heap usage: 42 MB', 'FAIL output'];
  assert.deepStrictEqual(stripTimingNoise(lines), ['FAIL output']);
});

test('stripTimingNoise: removes standalone duration lines', () => {
  const lines = ['  (123ms)', 'FAIL output'];
  assert.deepStrictEqual(stripTimingNoise(lines), ['FAIL output']);
});

test('stripTimingNoise: keeps lines with timing embedded in content', () => {
  const lines = ['  ✗ should complete in under 100ms (took 200ms)'];
  assert.deepStrictEqual(stripTimingNoise(lines), lines);
});

// ===========================================================================
// stripCoverageSummary
// ===========================================================================

test('stripCoverageSummary: removes coverage table', () => {
  const lines = [
    '----------|---------|----------|---------|---------|',
    'File      | % Stmts | % Branch | % Funcs | % Lines |',
    '----------|---------|----------|---------|---------|',
    'All files |   95.5  |   90.0   |  100.0  |   95.5  |',
    ' src/a.ts |   95.5  |   90.0   |  100.0  |   95.5  |',
    '----------|---------|----------|---------|---------|',
    'FAIL output here',
  ];
  assert.deepStrictEqual(stripCoverageSummary(lines), ['FAIL output here']);
});

test('stripCoverageSummary: removes Coverage summary header', () => {
  const lines = ['Coverage summary', 'FAIL output'];
  assert.deepStrictEqual(stripCoverageSummary(lines), ['FAIL output']);
});

test('stripCoverageSummary: keeps non-coverage lines', () => {
  const lines = ['Error: boom', '    at myFn (/project/src/index.js:10:3)'];
  assert.deepStrictEqual(stripCoverageSummary(lines), lines);
});

// ===========================================================================
// filterStackFrames (refactored line-array API)
// ===========================================================================

test('filterStackFrames: drops native V8 frames', () => {
  const lines = [
    'Error: boom',
    '    at Array.prototype.map (<anonymous>)',
    '    at myFn (/project/src/index.js:10:3)',
  ];
  assert.deepStrictEqual(filterStackFrames(lines), [
    'Error: boom',
    '    at myFn (/project/src/index.js:10:3)',
  ]);
});

test('filterStackFrames: drops node: protocol frames', () => {
  const lines = [
    'Error: boom',
    '    at processTicksAndRejections (node:internal/process/task_queues:95:5)',
    '    at myFn (/project/src/index.js:10:3)',
  ];
  assert.deepStrictEqual(filterStackFrames(lines), [
    'Error: boom',
    '    at myFn (/project/src/index.js:10:3)',
  ]);
});

test('filterStackFrames: drops jest internals not at throw site', () => {
  const lines = [
    'Error: boom',
    '    at myFn (/project/src/index.js:10:3)',
    '    at Object.<anonymous> (/project/node_modules/jest-circus/build/run.js:120:9)',
  ];
  assert.deepStrictEqual(filterStackFrames(lines), [
    'Error: boom',
    '    at myFn (/project/src/index.js:10:3)',
  ]);
});

test('filterStackFrames: keeps jest frame when it IS the throw site', () => {
  const lines = [
    'Error: boom',
    '    at runTest (/project/node_modules/jest-circus/build/run.js:120:9)',
    '    at myFn (/project/src/index.js:10:3)',
  ];
  assert.deepStrictEqual(filterStackFrames(lines), lines);
});

test('filterStackFrames: keeps async user frames', () => {
  const lines = [
    'Error: boom',
    '    at doWork (/project/src/worker.js:15:9)',
    '    at async processQueue (/project/src/queue.js:33:5)',
  ];
  assert.deepStrictEqual(filterStackFrames(lines), lines);
});

// ===========================================================================
// filterTestOutput / filterStack (full pipeline, backward compat)
// ===========================================================================

test('filterStack backward compat: same as filterTestOutput', () => {
  const input = 'Error: boom\n    at myFn (/project/src/index.js:10:3)';
  assert.strictEqual(filterStack(input), filterTestOutput(input));
});

test('filterTestOutput: strips ANSI + banners + passing + timing + coverage + stack noise', () => {
  const input = [
    '\x1B[1m DEV v4.0.18 /project\x1B[0m',
    '',
    ' \x1B[32m✓\x1B[0m should add numbers',
    ' \x1B[31m✗\x1B[0m should subtract numbers',
    '',
    'Error: Expected 3, received 5',
    '    at myFn (/project/src/math.js:10:3)',
    '    at processTicksAndRejections (node:internal/process/task_queues:95:5)',
    '    at Object.<anonymous> (/project/node_modules/vitest/dist/runner.js:55:3)',
    '',
    'Time: 1.234s',
    'Test Suites: 1 failed, 1 total',
    '----------|---------|',
    'All files |  95.5%  |',
    '----------|---------|',
  ].join('\n');

  const result = filterTestOutput(input);
  // Should keep: the failure marker, error message, user stack frame
  assert.ok(result.includes('should subtract numbers'), 'keeps failure line');
  assert.ok(result.includes('Error: Expected 3, received 5'), 'keeps error message');
  assert.ok(result.includes('at myFn (/project/src/math.js:10:3)'), 'keeps user frame');
  // Should strip:
  assert.ok(!result.includes('DEV v4.0.18'), 'strips Vitest banner');
  assert.ok(!result.includes('should add numbers'), 'strips passing test');
  assert.ok(!result.includes('processTicksAndRejections'), 'strips node: frame');
  assert.ok(!result.includes('node_modules/vitest'), 'strips vitest frame');
  assert.ok(!result.includes('Time:'), 'strips timing');
  assert.ok(!result.includes('Test Suites:'), 'strips Jest summary');
  assert.ok(!result.includes('All files'), 'strips coverage');
  assert.ok(!result.includes('\x1B'), 'strips ANSI codes');
});

test('filterTestOutput: collapses consecutive blank lines', () => {
  const input = 'line1\n\n\n\nline2';
  const result = filterTestOutput(input);
  assert.ok(!result.includes('\n\n\n'), 'no triple blanks');
  assert.ok(result.includes('line1\n\nline2'), 'single blank preserved');
});

test('filterTestOutput: invalid input returns empty string', () => {
  assert.strictEqual(filterTestOutput(123), '');
  assert.strictEqual(filterTestOutput(undefined), '');
});

// ===========================================================================
// Original filterStack tests (backward compatibility)
// ===========================================================================

test('drops native V8 frames: fn (<anonymous>)', () => {
  assert.strictEqual(
    filterStack(
`Error: boom
    at Array.prototype.map (<anonymous>)
    at myFn (/project/src/index.js:10:3)`),
`Error: boom
    at myFn (/project/src/index.js:10:3)`);
});

test('drops node: protocol frames', () => {
  assert.strictEqual(
    filterStack(
`Error: boom
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at myFn (/project/src/index.js:10:3)`),
`Error: boom
    at myFn (/project/src/index.js:10:3)`);
});

test('drops bare anonymous frames with no location', () => {
  assert.strictEqual(
    filterStack(
`Error: boom
    at <anonymous>
    at myFn (/project/src/index.js:10:3)`),
`Error: boom
    at myFn (/project/src/index.js:10:3)`);
});

test('drops Promise internal frames', () => {
  assert.strictEqual(
    filterStack(
`Error: boom
    at new Promise (<anonymous>)
    at myFn (/project/src/index.js:10:3)`),
`Error: boom
    at myFn (/project/src/index.js:10:3)`);
});

test('drops Generator.next internal frames', () => {
  assert.strictEqual(
    filterStack(
`Error: boom
    at Generator.next (<anonymous>)
    at myFn (/project/src/index.js:10:3)`),
`Error: boom
    at myFn (/project/src/index.js:10:3)`);
});

test('drops jest internals that are not the throw site', () => {
  assert.strictEqual(
    filterStack(
`Error: boom
    at myFn (/project/src/index.js:10:3)
    at Object.<anonymous> (/project/node_modules/jest-circus/build/run.js:120:9)`),
`Error: boom
    at myFn (/project/src/index.js:10:3)`);
});

test('drops vitest internals that are not the throw site', () => {
  assert.strictEqual(
    filterStack(
`Error: boom
    at myFn (/project/src/index.js:10:3)
    at runTest (/project/node_modules/vitest/dist/runner.js:55:3)`),
`Error: boom
    at myFn (/project/src/index.js:10:3)`);
});

test('drops vitest-worker internals that are not the throw site', () => {
  assert.strictEqual(
    filterStack(
`Error: boom
    at myFn (/project/src/index.js:10:3)
    at runTest (/project/node_modules/vitest-worker/dist/runner.js:55:3)`),
`Error: boom
    at myFn (/project/src/index.js:10:3)`);
});

test('keeps jest-internal frame when it IS the throw site (first at-line)', () => {
  assert.strictEqual(
    filterStack(
`Error: boom
    at runTest (/project/node_modules/jest-circus/build/run.js:120:9)
    at myFn (/project/src/index.js:10:3)`),
`Error: boom
    at runTest (/project/node_modules/jest-circus/build/run.js:120:9)
    at myFn (/project/src/index.js:10:3)`);
});

test('keeps async user frames unchanged', () => {
  assert.strictEqual(
    filterStack(
`Error: boom
    at doWork (/project/src/worker.js:15:9)
    at async processQueue (/project/src/queue.js:33:5)
    at async runAll (/project/src/main.js:8:3)`),
`Error: boom
    at doWork (/project/src/worker.js:15:9)
    at async processQueue (/project/src/queue.js:33:5)
    at async runAll (/project/src/main.js:8:3)`);
});

test('keeps Promise.all index marker unchanged', () => {
  assert.strictEqual(
    filterStack(
`Error: boom
    at doWork (/project/src/worker.js:15:9)
    at async Promise.all (index 2)
    at async runAll (/project/src/main.js:8:3)`),
`Error: boom
    at doWork (/project/src/worker.js:15:9)
    at async Promise.all (index 2)
    at async runAll (/project/src/main.js:8:3)`);
});

test('keeps error message line unchanged', () => {
  assert.strictEqual(
    filterStack(
`TypeError: Cannot read properties of undefined
    at myFn (/project/src/index.js:10:3)`),
`TypeError: Cannot read properties of undefined
    at myFn (/project/src/index.js:10:3)`);
});

test('passes through stack with no noise unchanged', () => {
  const stack =
`Error: boom
    at myFn (/project/src/index.js:10:3)
    at otherFn (/project/src/other.js:20:5)`;
  assert.strictEqual(filterStack(stack), stack);
});

test('removes all noise types in one stack, keeps user frames', () => {
  assert.strictEqual(
    filterStack(
`Error: boom
    at myFn (/project/src/index.js:10:3)
    at otherFn (/project/src/other.js:20:5)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at new Promise (<anonymous>)
    at Object.<anonymous> (/project/node_modules/jest-circus/build/run.js:120:9)`),
`Error: boom
    at myFn (/project/src/index.js:10:3)
    at otherFn (/project/src/other.js:20:5)`);
});

test('invalid input', () => {
  assert.strictEqual(filterStack(123), '');
  assert.strictEqual(filterStack(undefined), '');
});

// ===========================================================================
// checkCoverageThresholds
// ===========================================================================

const MOCK_COVERAGE_PASSING = JSON.stringify({
  total: {
    lines: { total: 100, covered: 95, skipped: 0, pct: 95 },
    statements: { total: 100, covered: 95, skipped: 0, pct: 95 },
    branches: { total: 50, covered: 45, skipped: 0, pct: 90 },
    functions: { total: 30, covered: 28, skipped: 0, pct: 93.33 },
  },
  '/project/src/features/chat/service.ts': {
    lines: { total: 50, covered: 48, skipped: 0, pct: 96 },
  },
  '/project/src/db/idb.ts': {
    lines: { total: 50, covered: 47, skipped: 0, pct: 94 },
  },
});

const MOCK_COVERAGE_FAILING = JSON.stringify({
  total: {
    lines: { total: 100, covered: 78, skipped: 0, pct: 78.3 },
    statements: { total: 100, covered: 80, skipped: 0, pct: 80 },
    branches: { total: 50, covered: 40, skipped: 0, pct: 80 },
    functions: { total: 30, covered: 25, skipped: 0, pct: 83.33 },
  },
  '/project/src/features/chat/service.ts': {
    lines: { total: 50, covered: 35, skipped: 0, pct: 70 },
  },
  '/project/src/db/idb.ts': {
    lines: { total: 50, covered: 43, skipped: 0, pct: 86 },
  },
});

test('checkCoverageThresholds: passes when all metrics above thresholds', () => {
  const result = checkCoverageThresholds(MOCK_COVERAGE_PASSING, { lines: 90 });
  assert.strictEqual(result.pass, true);
  assert.ok(result.summary.includes('Coverage OK'));
  assert.ok(result.summary.includes('lines 95%'));
});

test('checkCoverageThresholds: fails when lines below threshold', () => {
  const result = checkCoverageThresholds(MOCK_COVERAGE_FAILING, { lines: 90 });
  assert.strictEqual(result.pass, false);
  assert.ok(result.summary.includes('COVERAGE BELOW THRESHOLD'));
  assert.ok(result.summary.includes('lines 78.3%'));
  assert.ok(result.summary.includes('need 90%'));
});

test('checkCoverageThresholds: reports uncovered files', () => {
  const result = checkCoverageThresholds(MOCK_COVERAGE_FAILING, { lines: 90 });
  assert.strictEqual(result.pass, false);
  assert.ok(result.summary.includes('service.ts'), 'includes service.ts as uncovered');
  assert.ok(result.summary.includes('idb.ts'), 'includes idb.ts as uncovered');
});

test('checkCoverageThresholds: checks multiple metrics', () => {
  const result = checkCoverageThresholds(MOCK_COVERAGE_PASSING, { lines: 90, branches: 95 });
  assert.strictEqual(result.pass, false);
  assert.ok(result.summary.includes('branches 90%'));
  assert.ok(result.summary.includes('need 95%'));
});

test('checkCoverageThresholds: handles invalid JSON gracefully', () => {
  const result = checkCoverageThresholds('not json at all', { lines: 90 });
  assert.strictEqual(result.pass, false);
  assert.ok(result.summary.includes('COVERAGE ERROR'));
  assert.ok(result.summary.includes('invalid JSON'));
});

test('checkCoverageThresholds: handles missing total gracefully', () => {
  const result = checkCoverageThresholds(JSON.stringify({ foo: 'bar' }), { lines: 90 });
  assert.strictEqual(result.pass, false);
  assert.ok(result.summary.includes('COVERAGE ERROR'));
  assert.ok(result.summary.includes('missing "total"'));
});

test('checkCoverageThresholds: defaults to 90% lines when empty thresholds', () => {
  const result = checkCoverageThresholds(MOCK_COVERAGE_PASSING, {});
  assert.strictEqual(result.pass, true);
  assert.ok(result.summary.includes('lines 95%'));
});

test('checkCoverageThresholds: defaults to 90% lines when no thresholds arg', () => {
  const result = checkCoverageThresholds(MOCK_COVERAGE_PASSING);
  assert.strictEqual(result.pass, true);
  assert.ok(result.summary.includes('lines 95%'));
});

test('checkCoverageThresholds: reports files failing branches even when lines pass', () => {
  const data = JSON.stringify({
    total: {
      lines: { pct: 95 },
      branches: { pct: 70 },
    },
    '/project/src/features/chat/service.ts': {
      lines: { pct: 96 },
      branches: { pct: 50 },
    },
    '/project/src/db/idb.ts': {
      lines: { pct: 94 },
      branches: { pct: 92 },
    },
  });
  const result = checkCoverageThresholds(data, { branches: 80 });
  assert.strictEqual(result.pass, false);
  assert.ok(result.summary.includes('service.ts'), 'lists file with low branches');
  assert.ok(!result.summary.includes('idb.ts'), 'excludes file with passing branches');
});
