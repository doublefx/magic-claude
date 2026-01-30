#!/usr/bin/env node
/**
 * Stop Validation - Check for console.log in modified files after each response
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on Stop event (after each Claude response).
 * Checks git diff for modified JS/TS files with console.log.
 */

const { execSync } = require('child_process');
const fs = require('fs');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    // Check if we're in a git repo
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch {
      // Not a git repo, skip
      console.log(data);
      process.exit(0);
    }

    // Get modified JS/TS files
    try {
      const files = execSync('git diff --name-only HEAD', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).split('\n').filter(f => /\.(ts|tsx|js|jsx)$/.test(f) && fs.existsSync(f));

      let hasConsole = false;
      for (const f of files) {
        if (fs.readFileSync(f, 'utf8').includes('console.log')) {
          console.error(`[Hook] WARNING: console.log found in ${f}`);
          hasConsole = true;
        }
      }

      if (hasConsole) {
        console.error('[Hook] Remove console.log statements before committing');
      }
    } catch {
      // Git command failed, skip silently
    }

    // Pass through unchanged
    console.log(data);
  } catch (error) {
    console.error(`[StopValidation] Error: ${error.message}`);
    console.log(data);
  }
});
