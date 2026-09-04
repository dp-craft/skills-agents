#!/usr/bin/env node

/**
 * parse-coverage-thresholds.js
 *
 * Standalone CLI that reads Vitest/Jest coverage-summary.json,
 * checks against thresholds from vite.config.ts (or CLI args),
 * and prints a structured pass/fail result.
 *
 * Usage:
 *   node .claude/skills/debug-js-stack-trace-filter/scripts/parse-coverage-thresholds.js
 *   node .claude/skills/debug-js-stack-trace-filter/scripts/parse-coverage-thresholds.js --lines=90 --branches=80
 *
 * Exit codes:
 *   0 = coverage passes all thresholds
 *   1 = coverage below threshold or error reading data
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkCoverageThresholds } from './filter-stack.js';

/**
 * Parse CLI args like --lines=90 --branches=80 into { lines: 90, branches: 80 }
 * @param {string[]} args
 * @returns {Record<string, number>}
 */
export function parseCliThresholds(args) {
  const validMetrics = ['lines', 'statements', 'branches', 'functions'];

  return args
    .filter((arg) => arg.startsWith('--'))
    .reduce((acc, arg) => {
      const match = arg.match(/^--(\w+)=(\d+(?:\.\d+)?)$/);
      if (match && validMetrics.includes(match[1])) {
        return { ...acc, [match[1]]: Number(match[2]) };
      }
      return acc;
    }, {});
}

/**
 * Extract thresholds from a vite/jest config string using regex.
 * Looks for the `thresholds:` block inside `coverage:` config.
 * @param {string} configContent — raw config file content
 * @returns {Record<string, number>}
 */
export function parseThresholdsFromConfig(configContent) {
  const thresholdsBlock = configContent.match(/thresholds:\s*\{([^}]+)\}/);
  if (!thresholdsBlock) return {};

  const block = thresholdsBlock[1];
  const metricRe = /(\w+):\s*(\d+(?:\.\d+)?)/g;
  const thresholds = {};
  let match;
  while ((match = metricRe.exec(block)) !== null) {
    thresholds[match[1]] = Number(match[2]);
  }
  return thresholds;
}

/**
 * Read thresholds from vite.config.ts at cwd.
 * @returns {Record<string, number>}
 */
function readThresholdsFromViteConfig() {
  try {
    const content = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8');
    return parseThresholdsFromConfig(content);
  } catch {
    return {};
  }
}

/**
 * Run the CLI. Reads coverage data, checks thresholds, prints result.
 * Separated from module scope so tests can import without side effects.
 */
export function main() {
  // 1. Determine thresholds: CLI args take precedence over vite.config.ts
  const cliThresholds = parseCliThresholds(process.argv.slice(2));
  const thresholds = Object.keys(cliThresholds).length > 0
    ? cliThresholds
    : readThresholdsFromViteConfig();

  if (Object.keys(thresholds).length === 0) {
    console.log('COVERAGE ERROR: no thresholds found in CLI args or vite.config.ts');
    process.exit(1);
  }

  // 2. Read coverage-summary.json
  const coveragePath = join(process.cwd(), 'coverage', 'coverage-summary.json');
  let jsonString;
  try {
    jsonString = readFileSync(coveragePath, 'utf8');
  } catch (err) {
    console.log(`COVERAGE ERROR: cannot read ${coveragePath} — ${err.message}`);
    process.exit(1);
  }

  // 3. Check thresholds
  const result = checkCoverageThresholds(jsonString, thresholds);
  console.log(result.summary);
  process.exit(result.pass ? 0 : 1);
}

// Auto-run when executed directly (not imported)
const isDirectRun = process.argv[1]?.replace(/\\/g, '/').endsWith('parse-coverage-thresholds.js');
if (isDirectRun) {
  main();
}
