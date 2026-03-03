#!/usr/bin/env node
/**
 * Pyright Checker - Run pyright after editing Python files
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on PostToolUse for Edit commands.
 * Filters internally for .py files.
 * Mirrors typescript-checker.cjs behavior for Python ecosystem.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { debugHook, wrapHookMain } = require('../lib/hook-debug.cjs');

wrapHookMain('pyright-checker', (input) => {
  const filePath = input.tool_input?.file_path;

  // Only process Python files
  if (!filePath || !/\.py$/.test(filePath) || !fs.existsSync(filePath)) {
    debugHook('pyright-checker', 'process', 'Skipping — not a .py file or missing', filePath);
    process.exit(0);
  }

  // Find pyproject.toml or pyrightconfig.json by walking up directories
  let dir = path.dirname(filePath);
  while (
    dir !== path.dirname(dir) &&
    !fs.existsSync(path.join(dir, 'pyproject.toml')) &&
    !fs.existsSync(path.join(dir, 'pyrightconfig.json'))
  ) {
    dir = path.dirname(dir);
  }

  const hasPyproject = fs.existsSync(path.join(dir, 'pyproject.toml'));
  const hasPyrightConfig = fs.existsSync(path.join(dir, 'pyrightconfig.json'));

  if (!hasPyproject && !hasPyrightConfig) {
    debugHook('pyright-checker', 'process', 'No pyproject.toml or pyrightconfig.json found');
    process.exit(0);
  }

  // Check if pyright is available
  let pyrightAvailable = false;
  try {
    execSync('which pyright', { stdio: 'pipe' });
    pyrightAvailable = true;
  } catch {
    try {
      execSync('npx pyright --version', { stdio: 'pipe', timeout: 10000 });
      pyrightAvailable = true;
    } catch {
      // pyright not available at all
    }
  }

  if (!pyrightAvailable) {
    debugHook('pyright-checker', 'process', 'Pyright not available — skipping');
    process.exit(0);
  }

  let errorLines = [];
  try {
    debugHook('pyright-checker', 'process', 'Running pyright', { file: filePath, cwd: dir });
    const result = execSync(`pyright "${filePath}" 2>&1`, {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000
    });

    errorLines = result.split('\n').filter(line =>
      line.includes('error:') && line.includes(filePath)
    ).slice(0, 10);
  } catch (error) {
    // pyright exits non-zero when there are errors
    const stdout = error.stdout || '';
    errorLines = stdout.split('\n').filter(line =>
      line.includes('error:') && line.includes(filePath)
    ).slice(0, 10);
  }

  if (errorLines.length) {
    console.error('[Pyright] Type errors found:');
    console.error(errorLines.join('\n'));

    debugHook('pyright-checker', 'output', 'Writing type errors', errorLines.length);
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `[Pyright] Type errors in ${path.basename(filePath)}:\n${errorLines.join('\n')}`
      }
    }));
    return;
  }

  debugHook('pyright-checker', 'exit', 'No errors — clean exit');
  process.exit(0);
});
