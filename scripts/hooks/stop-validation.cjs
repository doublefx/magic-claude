#!/usr/bin/env node
/**
 * Stop Validation - Check for debug statements in modified files after each response
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on Stop event (after each Claude response).
 * Debug patterns are aggregated from the ecosystem registry — adding a new
 * ecosystem automatically extends detection.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const { getAllDebugPatterns } = require('../lib/ecosystems/index.cjs');

const DEBUG_PATTERNS = getAllDebugPatterns();

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

    try {
      const allFiles = execSync('git diff --name-only HEAD', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).split('\n').filter(f => f && fs.existsSync(f));

      let hasDebugStatements = false;

      for (const f of allFiles) {
        for (const dp of DEBUG_PATTERNS) {
          if (!dp.extensions.test(f)) continue;
          const content = fs.readFileSync(f, 'utf8');
          if (dp.pattern.test(content)) {
            console.error(`[Hook] WARNING: ${dp.name} found in ${f}`);
            hasDebugStatements = true;
          }
        }
      }

      if (hasDebugStatements) {
        console.error('[Hook] Remove debug statements before committing');
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
