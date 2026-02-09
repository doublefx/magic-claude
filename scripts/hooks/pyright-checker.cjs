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

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = input.tool_input?.file_path;

    // Only process Python files
    if (filePath && /\.py$/.test(filePath) && fs.existsSync(filePath)) {
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

      if (hasPyproject || hasPyrightConfig) {
        // Check if pyright is available
        try {
          execSync('which pyright', { stdio: 'pipe' });
        } catch {
          // pyright not installed, try npx
          try {
            execSync('npx pyright --version', { stdio: 'pipe', timeout: 10000 });
          } catch {
            // pyright not available at all, skip silently
            console.log(data);
            return;
          }
        }

        try {
          const result = execSync(`pyright "${filePath}" 2>&1`, {
            cwd: dir,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 30000
          });

          // Filter to errors only
          const errorLines = result.split('\n').filter(line =>
            line.includes('error:') && line.includes(filePath)
          ).slice(0, 10);

          if (errorLines.length) {
            console.error('[Pyright] Type errors found:');
            console.error(errorLines.join('\n'));
          }
        } catch (error) {
          // pyright exits non-zero when there are errors
          const stdout = error.stdout || '';
          const errorLines = stdout.split('\n').filter(line =>
            line.includes('error:') && line.includes(filePath)
          ).slice(0, 10);

          if (errorLines.length) {
            console.error('[Pyright] Type errors found:');
            console.error(errorLines.join('\n'));
          }
        }
      }
    }

    // Pass through unchanged
    console.log(data);
  } catch (error) {
    console.error(`[Pyright] Error: ${error.message}`);
    console.log(data);
  }
});
