import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCliThresholds, parseThresholdsFromConfig } from './parse-coverage-thresholds.js';

/**
 * Run tests with:
 *   node --test ".claude/skills/debug-js-stack-trace-filter/scripts/parse-coverage-thresholds.test.js"
 */

// ===========================================================================
// parseCliThresholds
// ===========================================================================

test('parseCliThresholds: parses --lines=90', () => {
  assert.deepStrictEqual(parseCliThresholds(['--lines=90']), { lines: 90 });
});

test('parseCliThresholds: parses multiple metrics', () => {
  assert.deepStrictEqual(
    parseCliThresholds(['--lines=90', '--branches=80', '--functions=75']),
    { lines: 90, branches: 80, functions: 75 },
  );
});

test('parseCliThresholds: parses decimal values', () => {
  assert.deepStrictEqual(parseCliThresholds(['--lines=90.5']), { lines: 90.5 });
});

test('parseCliThresholds: ignores invalid metric names', () => {
  assert.deepStrictEqual(parseCliThresholds(['--coverage=90', '--foo=50']), {});
});

test('parseCliThresholds: ignores malformed args', () => {
  assert.deepStrictEqual(parseCliThresholds(['--lines', 'lines=90', '-lines=90', '90']), {});
});

test('parseCliThresholds: returns empty for empty args', () => {
  assert.deepStrictEqual(parseCliThresholds([]), {});
});

test('parseCliThresholds: ignores non-flag args mixed in', () => {
  assert.deepStrictEqual(
    parseCliThresholds(['somefile.js', '--lines=90', '--verbose']),
    { lines: 90 },
  );
});

test('parseCliThresholds: parses statements metric', () => {
  assert.deepStrictEqual(parseCliThresholds(['--statements=85']), { statements: 85 });
});

// ===========================================================================
// parseThresholdsFromConfig
// ===========================================================================

test('parseThresholdsFromConfig: extracts lines from vite config', () => {
  const config = `
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 90,
      },
    },
  },
});`;
  assert.deepStrictEqual(parseThresholdsFromConfig(config), { lines: 90 });
});

test('parseThresholdsFromConfig: extracts multiple metrics', () => {
  const config = `
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 90,
        branches: 80,
        functions: 75,
        statements: 85,
      },
    },
  },
});`;
  assert.deepStrictEqual(parseThresholdsFromConfig(config), {
    lines: 90,
    branches: 80,
    functions: 75,
    statements: 85,
  });
});

test('parseThresholdsFromConfig: handles decimal thresholds', () => {
  const config = `thresholds: { lines: 90.5 }`;
  assert.deepStrictEqual(parseThresholdsFromConfig(config), { lines: 90.5 });
});

test('parseThresholdsFromConfig: returns empty when no thresholds block', () => {
  const config = `
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
    },
  },
});`;
  assert.deepStrictEqual(parseThresholdsFromConfig(config), {});
});

test('parseThresholdsFromConfig: returns empty for empty string', () => {
  assert.deepStrictEqual(parseThresholdsFromConfig(''), {});
});

test('parseThresholdsFromConfig: handles jest config format', () => {
  const config = `
module.exports = {
  coverageThreshold: {
    global: {
      thresholds: { branches: 80, lines: 90 },
    },
  },
};`;
  assert.deepStrictEqual(parseThresholdsFromConfig(config), { branches: 80, lines: 90 });
});

test('parseThresholdsFromConfig: handles compact single-line format', () => {
  const config = `thresholds: { lines: 90, branches: 80 }`;
  assert.deepStrictEqual(parseThresholdsFromConfig(config), { lines: 90, branches: 80 });
});
