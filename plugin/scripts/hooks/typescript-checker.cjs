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

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = input.tool_input?.file_path;

    // Only process TypeScript files
    if (filePath && /\.(ts|tsx)$/.test(filePath) && fs.existsSync(filePath)) {
      // Find tsconfig.json by walking up directories
      let dir = path.dirname(filePath);
      while (dir !== path.dirname(dir) && !fs.existsSync(path.join(dir, 'tsconfig.json'))) {
        dir = path.dirname(dir);
      }

      if (fs.existsSync(path.join(dir, 'tsconfig.json'))) {
        try {
          const result = execSync('npx tsc --noEmit --pretty false 2>&1', {
            cwd: dir,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
          });

          // Filter to errors in this file only
          const lines = result.split('\n').filter(line => line.includes(filePath)).slice(0, 10);
          if (lines.length) {
            console.error('[TypeScript] Type errors found:');
            console.error(lines.join('\n'));
          }
        } catch (error) {
          // tsc exits non-zero when there are errors
          const stdout = error.stdout || '';
          const lines = stdout.split('\n').filter(line => line.includes(filePath)).slice(0, 10);
          if (lines.length) {
            console.error('[TypeScript] Type errors found:');
            console.error(lines.join('\n'));
          }
        }
      }
    }

    // Pass through unchanged
    console.log(data);
  } catch (error) {
    console.error(`[TypeScript] Error: ${error.message}`);
    console.log(data);
  }
});
