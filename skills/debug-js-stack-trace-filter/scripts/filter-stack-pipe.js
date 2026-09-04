/**
 * filter-stack-pipe.js
 *
 * Stdin -> stdout pipe wrapper around filterTestOutput().
 * Usage: <test-command> 2>&1 | node filter-stack-pipe.js
 */

import { filterTestOutput } from './filter-stack.js';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => { process.stdout.write(filterTestOutput(input)); });
