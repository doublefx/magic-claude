#!/usr/bin/env node
/**
 * TypeScript Checker - Run tsc after editing TypeScript files
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on PostToolUse for Edit commands.
 * Filters internally for .ts/.tsx files.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { debugHook, wrapHookMain } = require('../lib/hook-debug.cjs');

wrapHookMain('typescript-checker', (input) => {
  const filePath = input.tool_input?.file_path;

  // Only process TypeScript files
  if (!filePath || !/\.(ts|tsx)$/.test(filePath) || !fs.existsSync(filePath)) {
    debugHook('typescript-checker', 'process', 'Skipping — not a TS file or missing', filePath);
    process.exit(0);
  }

  // Find tsconfig.json by walking up directories
  let dir = path.dirname(filePath);
  while (dir !== path.dirname(dir) && !fs.existsSync(path.join(dir, 'tsconfig.json'))) {
    dir = path.dirname(dir);
  }

  if (!fs.existsSync(path.join(dir, 'tsconfig.json'))) {
    debugHook('typescript-checker', 'process', 'No tsconfig.json found');
    process.exit(0);
  }

  let errorLines = [];
  try {
    debugHook('typescript-checker', 'process', 'Running tsc --noEmit', { cwd: dir });
    const result = execSync('npx tsc --noEmit --pretty false 2>&1', {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    errorLines = result.split('\n').filter(line => line.includes(filePath)).slice(0, 10);
  } catch (error) {
    // tsc exits non-zero when there are errors
    const stdout = error.stdout || '';
    errorLines = stdout.split('\n').filter(line => line.includes(filePath)).slice(0, 10);
  }

  if (errorLines.length) {
    console.error('[TypeScript] Type errors found:');
    console.error(errorLines.join('\n'));

    debugHook('typescript-checker', 'output', 'Writing type errors', errorLines.length);
    // Inject errors as context for Claude
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `[TypeScript] Type errors in ${path.basename(filePath)}:\n${errorLines.join('\n')}`
      }
    }));
    return;
  }

  debugHook('typescript-checker', 'exit', 'No errors — clean exit');
  process.exit(0);
});
