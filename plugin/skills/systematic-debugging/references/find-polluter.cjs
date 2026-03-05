#!/usr/bin/env node
/**
 * Test Pollution Bisection Script
 *
 * Finds which test file creates unwanted state that causes another test to fail.
 * Cross-platform (Windows, macOS, Linux).
 *
 * Usage:
 *   node find-polluter.cjs --victim <test-file> --suite <test-command> [--suspects <glob>] [--dry-run] [--help]
 *
 * Examples:
 *   node find-polluter.cjs --victim tests/auth.test.js --suite "npm test"
 *   node find-polluter.cjs --victim tests/auth.test.js --suite "npx jest" --suspects "tests/*.test.js"
 *   node find-polluter.cjs --victim tests/auth.test.js --suite "npm test" --dry-run
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Try to load utils from the plugin, fall back to inline implementations
let log, output;
try {
  const utils = require(path.join(__dirname, '..', '..', 'scripts', 'lib', 'utils.cjs'));
  log = utils.log;
  output = utils.output;
} catch {
  log = (msg) => process.stderr.write(`[find-polluter] ${msg}\n`);
  output = (msg) => process.stdout.write(`${msg}\n`);
}

// --- Argument Parsing ---

function parseArgs(argv) {
  const args = {
    victim: null,
    suite: null,
    suspects: null,
    dryRun: false,
    help: false
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--victim' && i + 1 < argv.length) {
      args.victim = argv[++i];
    } else if (arg === '--suite' && i + 1 < argv.length) {
      args.suite = argv[++i];
    } else if (arg === '--suspects' && i + 1 < argv.length) {
      args.suspects = argv[++i];
    }
  }

  return args;
}

function printHelp() {
  output(`
find-polluter.cjs - Test Pollution Bisection

Finds which test file creates state that causes another test to fail.
Uses binary bisection to minimize the number of test runs.

USAGE:
  node find-polluter.cjs --victim <test-file> --suite <test-command> [options]

REQUIRED:
  --victim <file>     The test file that fails when run after the polluter
  --suite <command>    The test command to run (e.g., "npm test", "npx jest")

OPTIONS:
  --suspects <glob>   Glob pattern for suspect test files (default: auto-detect from suite)
  --dry-run           Show what would be executed without running tests
  --help, -h          Show this help message

ALGORITHM:
  1. Verify victim passes in isolation
  2. Verify victim fails when run with all suspects
  3. Binary bisect suspects until the polluter is found

EXAMPLES:
  node find-polluter.cjs --victim tests/auth.test.js --suite "npx jest"
  node find-polluter.cjs --victim tests/auth.test.js --suite "npm test" --suspects "tests/*.test.js"
  node find-polluter.cjs --victim tests/auth.test.js --suite "npm test" --dry-run

OUTPUT:
  JSON object: { "polluter": ["file.test.js"], "victim": "auth.test.js", "iterations": 5 }
`.trim());
}

// --- Test Execution ---

function runTests(suiteCommand, testFiles, dryRun) {
  // Note: suite command is split on spaces. Avoid paths with spaces in the command.
  // The `--` separator works with Jest, Vitest, and Mocha. For other runners
  // (pytest, gradle), pass the full command including file args via --suite.
  const cmdParts = suiteCommand.split(' ');
  const filesArg = testFiles.join(' ');
  const fullCommand = `${suiteCommand} -- ${filesArg}`;

  if (dryRun) {
    log(`[dry-run] Would execute: ${fullCommand}`);
    return { success: true, dryRun: true };
  }

  log(`Running: ${fullCommand}`);

  const result = spawnSync(cmdParts[0], [
    ...cmdParts.slice(1),
    '--',
    ...testFiles
  ], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 120000,
    shell: false
  });

  return {
    success: result.status === 0,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    dryRun: false
  };
}

// --- File Discovery ---

function discoverTestFiles(suspectsGlob, victim) {
  if (!suspectsGlob) {
    log('No --suspects glob provided. Looking for test files in current directory...');
    const patterns = [
      'tests/**/*.test.js',
      'tests/**/*.test.ts',
      'tests/**/*.test.cjs',
      'test/**/*.test.js',
      'test/**/*.test.ts',
      'src/**/*.test.js',
      'src/**/*.test.ts',
      'src/**/*.spec.js',
      'src/**/*.spec.ts'
    ];

    const files = [];
    for (const pattern of patterns) {
      const found = findFilesMatchingGlob(pattern);
      files.push(...found);
    }

    if (files.length === 0) {
      log('ERROR: No test files found. Use --suspects to specify a glob pattern.');
      process.exit(1);
    }

    return files.filter(f => path.resolve(f) !== path.resolve(victim));
  }

  const files = findFilesMatchingGlob(suspectsGlob);
  return files.filter(f => path.resolve(f) !== path.resolve(victim));
}

function findFilesMatchingGlob(pattern) {
  // Use Node.js built-in fs to walk directories with simple glob matching
  const files = [];
  const parts = pattern.split('/');
  const baseDir = parts[0] === '**' ? '.' : parts[0];

  if (!fs.existsSync(baseDir)) return files;

  walkDir(baseDir, (filePath) => {
    if (matchSimpleGlob(filePath, pattern)) {
      files.push(filePath);
    }
  });

  return files;
}

function walkDir(dir, callback) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        walkDir(fullPath, callback);
      } else if (entry.isFile()) {
        callback(fullPath);
      }
    }
  } catch (err) {
    if (err.code === 'EACCES' || err.code === 'EPERM') {
      // Skip directories we can't read
    } else {
      throw err;
    }
  }
}

function matchSimpleGlob(filePath, pattern) {
  // Convert simple glob to regex
  // Order: replace **/ as a unit first, then escape dots, then expand single *
  const normalized = filePath.replace(/\\/g, '/');
  const regexStr = pattern
    .replace(/\*\*\//g, '<<<GLOBSTAR_SLASH>>>')  // **/ -> zero or more dirs
    .replace(/\*\*/g, '<<<GLOBSTAR>>>')           // standalone ** (rare)
    .replace(/\./g, '\\.')                         // escape dots before * expansion
    .replace(/\*/g, '[^/]*')                       // single * -> non-slash chars
    .replace(/<<<GLOBSTAR_SLASH>>>/g, '(?:.+/)?')  // zero or more path segments
    .replace(/<<<GLOBSTAR>>>/g, '.*');              // match anything
  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(normalized);
}

// --- Bisection Algorithm ---

function bisect(suiteCommand, victim, suspects, dryRun) {
  let iterations = 0;
  let current = [...suspects];

  log(`Starting bisection with ${current.length} suspects`);

  while (current.length > 1) {
    iterations++;
    const mid = Math.ceil(current.length / 2);
    const firstHalf = current.slice(0, mid);
    const secondHalf = current.slice(mid);

    log(`\nIteration ${iterations}: ${current.length} suspects remaining`);
    log(`  Testing first half (${firstHalf.length} files)...`);

    const firstResult = runTests(suiteCommand, [...firstHalf, victim], dryRun);

    if (dryRun) {
      log(`  [dry-run] Testing second half (${secondHalf.length} files)...`);
      runTests(suiteCommand, [...secondHalf, victim], dryRun);
      log(`  [dry-run] Cannot bisect further without actual test results`);
      return { polluter: current, victim, iterations, dryRun: true };
    }

    if (!firstResult.success) {
      // Victim fails with first half -- polluter is in first half
      log(`  Victim FAILS with first half. Polluter is in first half.`);
      current = firstHalf;
    } else {
      // Victim passes with first half -- polluter is in second half
      log(`  Victim PASSES with first half. Polluter is in second half.`);
      current = secondHalf;
    }
  }

  return { polluter: current, victim, iterations, dryRun: false };
}

// --- Main ---

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.victim || !args.suite) {
    log('ERROR: --victim and --suite are required. Use --help for usage.');
    process.exit(1);
  }

  const victimPath = path.resolve(args.victim);
  if (!fs.existsSync(victimPath)) {
    log(`ERROR: Victim file not found: ${victimPath}`);
    process.exit(1);
  }

  log(`Victim: ${args.victim}`);
  log(`Suite command: ${args.suite}`);
  if (args.dryRun) log('Mode: DRY RUN');

  // Step 1: Discover suspect test files
  const suspects = discoverTestFiles(args.suspects, args.victim);
  log(`Found ${suspects.length} suspect test files`);

  if (suspects.length === 0) {
    log('ERROR: No suspect test files found.');
    process.exit(1);
  }

  // Step 2: Verify victim passes in isolation
  log('\n--- Step 1: Verify victim passes in isolation ---');
  const isolationResult = runTests(args.suite, [args.victim], args.dryRun);

  if (!args.dryRun && !isolationResult.success) {
    log('ERROR: Victim test FAILS in isolation. This is not a pollution issue.');
    log('The test has its own bug. Fix the test first.');
    process.exit(1);
  }
  if (!args.dryRun) log('Victim passes in isolation. Good.');

  // Step 3: Verify victim fails with all suspects
  log('\n--- Step 2: Verify victim fails with all suspects ---');
  const fullResult = runTests(args.suite, [...suspects, args.victim], args.dryRun);

  if (!args.dryRun && fullResult.success) {
    log('NOTE: Victim passes even with all suspects. Pollution may be intermittent.');
    log('Try running multiple times or check for timing-dependent pollution.');
    process.exit(0);
  }
  if (!args.dryRun) log('Victim fails with all suspects. Pollution confirmed.');

  // Step 4: Binary bisect
  log('\n--- Step 3: Binary bisection ---');
  const result = bisect(args.suite, args.victim, suspects, args.dryRun);

  // Output result
  const resultJson = JSON.stringify({
    polluter: result.polluter,
    victim: result.victim,
    iterations: result.iterations
  }, null, 2);

  if (result.dryRun) {
    log('\n[dry-run] Bisection would produce a result like:');
    output(resultJson);
    process.exit(0);
  }

  log(`\n--- Result ---`);
  log(`Found polluter in ${result.iterations} iterations:`);
  output(resultJson);

  process.exit(result.polluter.length > 0 ? 1 : 0);
}

main();
