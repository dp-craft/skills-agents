/**
 * filter-stack.js
 *
 * Composable filter pipeline for LLM-optimized test output.
 * Strips ANSI codes, runner banners, passing tests, timing noise,
 * coverage summaries, and noisy stack frames.
 *
 * Based on research: docs/research/2026-02-20-stack-frame-filtering-deep-dive.md
 *
 * Filter pipeline (applied in order):
 *   stripAnsi → stripRunnerBanners → stripPassingTests →
 *   stripTimingNoise → stripCoverageSummary → filterStackFrames
 *
 * Stack frame tiers (from original):
 *   Tier 1 — Always drop: V8 native, node: protocol, Promise/Generator internals
 *   Tier 2 — Drop UNLESS throw site: jest/vitest/mocha/jasmine in node_modules
 */

import { mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Debug logging
// ---------------------------------------------------------------------------

const DEBUG = true;

function debugLog(timestamp, kind, content) {
  const dir = join(process.cwd(), 'log', 'filter-stack-trace');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${timestamp}-${kind}.txt`);
  appendFileSync(file, content + '\n', 'utf8');
}

function makeTimestamp() {
  const d = new Date();
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// ---------------------------------------------------------------------------
// Compose utility
// ---------------------------------------------------------------------------

/**
 * Left-to-right function composition for line-array filters.
 * @param  {...(lines: string[]) => string[]} fns
 * @returns {(lines: string[]) => string[]}
 */
const compose = (...fns) => (lines) => fns.reduce((acc, fn) => fn(acc), lines);

// ---------------------------------------------------------------------------
// Filter: stripAnsi
// ---------------------------------------------------------------------------

/** ANSI escape: CSI sequences, OSC sequences, single ESC codes */
const ANSI_RE = /\x1B(?:\[[0-9;]*[A-Za-z]|\][^\x07]*\x07|\[[0-9;]*m)/g;

/**
 * Remove all ANSI escape sequences from each line.
 * @param {string[]} lines
 * @returns {string[]}
 */
export const stripAnsi = (lines) => lines.map((line) => line.replace(ANSI_RE, ''));

// ---------------------------------------------------------------------------
// Filter: stripRunnerBanners
// ---------------------------------------------------------------------------

const BANNER_PATTERNS = [
  /^\s*DEV\s+v\d/,                           // Vitest "DEV v4.0.18 ..."
  /^\s*RUN\s+v\d/,                           // Vitest "RUN v4.0.18 ..."
  /^\s*Test Suites:/,                         // Jest summary header
  /^\s*Tests:\s+\d/,                          // Jest "Tests: 5 passed"
  /^\s*Snapshots:/,                           // Jest "Snapshots: 0 total"
  /^\s*Time:\s+[\d.]+\s*(m?s|seconds?)\s*$/,  // Jest/Vitest timing summary
  /^\s*Ran all test suites/,                  // Jest "Ran all test suites"
  /^\s*PASS\s+\S/,                            // Jest "PASS src/..."
  /^\s*Test Files\s/,                         // Vitest "Test Files  3 passed"
  /^\s*Start at\s/,                           // Vitest "Start at ..."
  /^\s*Duration\s/,                           // Vitest "Duration ..."
  /^\s*Vitest\s+v?\d/i,                       // Vitest version banner
  /^\s*jest\s+v?\d/i,                         // Jest version banner
  /^\s*Using\s.*vitest/i,                     // Vitest config line
  /^\s*Resolved\s.*config/i,                  // Vitest resolved config
  /^\s*✓\s+.*\(\d+ tests?\)$/,               // Vitest file-level pass summary "✓ file.test.ts (5 tests)"
  /^\s*√\s+.*\(\d+ tests?\)$/,               // Same with √ on Windows
];

/**
 * Remove runner startup banners and summary lines.
 * @param {string[]} lines
 * @returns {string[]}
 */
export const stripRunnerBanners = (lines) =>
  lines.filter((line) => !BANNER_PATTERNS.some((re) => re.test(line)));

// ---------------------------------------------------------------------------
// Filter: stripPassingTests
// ---------------------------------------------------------------------------

const PASS_PATTERNS = [
  /^\s*[✓√]\s/,          // ✓ test name / √ test name
  /^\s*PASS\s/,           // PASS src/file.test.ts
  /^\s*✅\s/,             // emoji checkmark
  /^\s*[·.]+\s*$/,        // dot reporter dots (line of only dots)
];

/**
 * Remove lines reporting passing tests.
 * @param {string[]} lines
 * @returns {string[]}
 */
export const stripPassingTests = (lines) =>
  lines.filter((line) => !PASS_PATTERNS.some((re) => re.test(line)));

// ---------------------------------------------------------------------------
// Filter: stripTimingNoise
// ---------------------------------------------------------------------------

const TIMING_PATTERNS = [
  /^\s*Time:\s+[\d.]+\s*(m?s|seconds?)/,   // "Time: 1.234s"
  /^\s*Slow test suite/i,                    // "Slow test suite ..."
  /^\s*Heap usage:/i,                        // "Heap usage: 42 MB"
  /^\s*\([\d.]+ ?m?s\)\s*$/,                // standalone "(123ms)"
];

/**
 * Remove timing-only and performance noise lines.
 * @param {string[]} lines
 * @returns {string[]}
 */
export const stripTimingNoise = (lines) =>
  lines.filter((line) => !TIMING_PATTERNS.some((re) => re.test(line)));

// ---------------------------------------------------------------------------
// Filter: stripCoverageSummary
// ---------------------------------------------------------------------------

const COVERAGE_PATTERNS = [
  /^\s*-{3,}\s*\|/,                  // table border "---|---|---"
  /^\s*\|?\s*(Stmts|Branch|Funcs|Lines)\s*\|/i,  // coverage header
  /^\s*\|?\s*All files/i,            // "All files" summary row
  /^\s*File\s+\|?\s*%/i,             // "File  | % ..."
  /^\s*[\w./]+\s*\|(?:\s*[\d.]+\s*%?\s*\|){2,}/,  // data row with 2+ numeric columns: "src/foo.ts | 95.5% | 90.0% |"
  /^\s*%\s*(Stmts|Branch|Funcs|Lines)/i,  // "% Stmts" header variant
  /^\s*Coverage summary/i,           // "Coverage summary"
];

/**
 * Remove coverage table output.
 * @param {string[]} lines
 * @returns {string[]}
 */
export const stripCoverageSummary = (lines) =>
  lines.filter((line) => !COVERAGE_PATTERNS.some((re) => re.test(line)));

// ---------------------------------------------------------------------------
// Filter: filterStackFrames (refactored from original filterStack)
// ---------------------------------------------------------------------------

// Tier 1 — always drop
const TIER1 = [
  /^\s+at new Promise \(<anonymous>\)/,
  /^\s+at Generator\.next \(<anonymous>\)/,
  /^\s+at process\.processTicksAndRejections/,
  /^\s+at <anonymous>\s*$/,
  /^\s+at .+ \(<anonymous>\)\s*$/,   // fn (<anonymous>) — V8 native with no real file
  /\(node:[^)]+\)/,                  // (node:internal/...)
];

// Tier 2 — drop unless throw site (first "at ..." line)
const TIER2 = /node_modules[\\/](jest|@jest|vitest|@vitest|mocha|jasmine)/;

/**
 * Remove noisy stack frames using tiered logic.
 * Non-"at" lines (error messages etc.) are always kept.
 * @param {string[]} lines
 * @returns {string[]}
 */
export const filterStackFrames = (lines) => {
  let firstFrameSeen = false;
  return lines.filter((line) => {
    const isFrame = line.trimStart().startsWith('at ');
    if (!isFrame) return true;

    // Tier 1 — always drop
    if (TIER1.some((re) => re.test(line))) return false;

    // Tier 2 — drop unless this is the first frame (throw site)
    if (!firstFrameSeen) {
      firstFrameSeen = true;
      return true;
    }
    if (TIER2.test(line)) return false;

    return true;
  });
};

// ---------------------------------------------------------------------------
// Composed pipeline
// ---------------------------------------------------------------------------

/**
 * Full test output filter pipeline.
 * Takes raw test output string, returns filtered string.
 * @param {string} input — raw test runner output
 * @returns {string}
 */
const pipeline = compose(
  stripAnsi,
  stripRunnerBanners,
  stripPassingTests,
  stripTimingNoise,
  stripCoverageSummary,
  filterStackFrames,
);

export function filterTestOutput(input) {
  if (typeof input !== 'string') return '';

  const ts = DEBUG ? makeTimestamp() : null;
  if (DEBUG) debugLog(ts, 'input', input);

  const lines = input.split('\n');
  const filtered = pipeline(lines);
  // Remove consecutive blank lines (collapse to single blank)
  const collapsed = filtered.reduce((acc, line) => {
    if (line.trim() === '' && acc.length > 0 && acc[acc.length - 1].trim() === '') {
      return acc;
    }
    return [...acc, line];
  }, []);
  const result = collapsed.join('\n');

  if (DEBUG) debugLog(ts, 'output', result);
  return result;
}

/**
 * Backward-compatible alias — original API.
 * @param {string} stack
 * @returns {string}
 */
export const filterStack = filterTestOutput;

// ---------------------------------------------------------------------------
// Coverage threshold checking
// ---------------------------------------------------------------------------

const COVERAGE_METRICS = ['lines', 'statements', 'branches', 'functions'];
const DEFAULT_THRESHOLDS = { lines: 90 };

/**
 * Parse coverage-summary.json and check against thresholds.
 * @param {string} jsonString — raw JSON from coverage/coverage-summary.json
 * @param {Record<string, number>} [thresholds] — e.g., { lines: 90, branches: 80 }
 * @returns {{ pass: boolean, summary: string }}
 */
export function checkCoverageThresholds(jsonString, thresholds = DEFAULT_THRESHOLDS) {
  const effectiveThresholds = Object.keys(thresholds).length === 0
    ? DEFAULT_THRESHOLDS
    : thresholds;

  /** @type {Record<string, unknown>} */
  let data;
  try {
    data = JSON.parse(jsonString);
  } catch {
    return { pass: false, summary: 'COVERAGE ERROR: invalid JSON in coverage-summary.json' };
  }

  const total = data?.total;
  if (!total || typeof total !== 'object') {
    return { pass: false, summary: 'COVERAGE ERROR: missing "total" in coverage-summary.json' };
  }

  const failures = [];
  const passed = [];

  COVERAGE_METRICS
    .filter((metric) => effectiveThresholds[metric] !== undefined)
    .forEach((metric) => {
      const required = effectiveThresholds[metric];
      const metricData = total[metric];
      const actual = metricData?.pct ?? -1;

      if (actual < required) {
        failures.push({ metric, actual, required });
      } else {
        passed.push({ metric, actual, required });
      }
    });

  if (failures.length === 0) {
    const details = [...passed]
      .map(({ metric, actual, required }) => `${metric} ${actual}% (>= ${required}%)`)
      .join(', ');
    return { pass: true, summary: `Coverage OK: ${details}` };
  }

  // Find uncovered files from per-file data
  const uncoveredFiles = findUncoveredFiles(data, effectiveThresholds);

  const failDetails = failures
    .map(({ metric, actual, required }) => `${metric} ${actual}% (need ${required}%)`)
    .join(', ');
  const uncoveredSuffix = uncoveredFiles.length > 0
    ? ` — ${uncoveredFiles.join(', ')}`
    : '';

  return {
    pass: false,
    summary: `COVERAGE BELOW THRESHOLD: ${failDetails}${uncoveredSuffix}`,
  };
}

/**
 * Find files with coverage below any of the failed thresholds.
 * @param {Record<string, unknown>} data — parsed coverage-summary.json
 * @param {Record<string, number>} thresholds
 * @returns {string[]} — list of "file (metric%)" entries
 */
function findUncoveredFiles(data, thresholds) {
  return Object.entries(data)
    .filter(([key]) => key !== 'total')
    .filter(([, fileData]) =>
      COVERAGE_METRICS.some((metric) => {
        const required = thresholds[metric];
        if (required === undefined) return false;
        const pct = fileData?.[metric]?.pct ?? 100;
        return pct < required;
      }),
    )
    .map(([filePath, fileData]) => {
      // Report the worst failing metric for this file
      const worstMetric = COVERAGE_METRICS
        .filter((metric) => thresholds[metric] !== undefined)
        .filter((metric) => (fileData?.[metric]?.pct ?? 100) < thresholds[metric])
        .reduce((worst, metric) => {
          const pct = fileData?.[metric]?.pct ?? 0;
          return worst === null || pct < worst.pct ? { metric, pct } : worst;
        }, null);
      const short = filePath.replace(/^.*?[/\\]src[/\\]/, 'src/');
      const pct = worstMetric?.pct ?? 0;
      return `${short} (${pct}%)`;
    });
}
