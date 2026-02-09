#!/usr/bin/env node
/**
 * Stop Validation - Check for debug statements in modified files after each response
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on Stop event (after each Claude response).
 * Checks git diff for modified files with debug statements:
 * - JS/TS: console.log
 * - Python: print()
 * - Java/Kotlin: System.out.println, e.printStackTrace()
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

    try {
      const allFiles = execSync('git diff --name-only HEAD', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).split('\n').filter(f => f && fs.existsSync(f));

      let hasDebugStatements = false;

      // Check JS/TS files for console.log
      const jsFiles = allFiles.filter(f => /\.(ts|tsx|js|jsx)$/.test(f));
      for (const f of jsFiles) {
        if (fs.readFileSync(f, 'utf8').includes('console.log')) {
          console.error(`[Hook] WARNING: console.log found in ${f}`);
          hasDebugStatements = true;
        }
      }

      // Check Python files for print()
      const pyFiles = allFiles.filter(f => /\.py$/.test(f));
      for (const f of pyFiles) {
        const content = fs.readFileSync(f, 'utf8');
        if (/\bprint\s*\(/.test(content)) {
          console.error(`[Hook] WARNING: print() found in ${f}`);
          hasDebugStatements = true;
        }
      }

      // Check Java/Kotlin files for System.out.println and e.printStackTrace()
      const jvmFiles = allFiles.filter(f => /\.(java|kt|kts)$/.test(f));
      for (const f of jvmFiles) {
        const content = fs.readFileSync(f, 'utf8');
        if (/System\.(out|err)\.(println|print)\b/.test(content) || /\.printStackTrace\s*\(/.test(content)) {
          console.error(`[Hook] WARNING: Debug statements found in ${f}`);
          hasDebugStatements = true;
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
