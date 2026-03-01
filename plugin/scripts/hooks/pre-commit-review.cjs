#!/usr/bin/env node
/**
 * Pre-Commit Review - Suggest code review before git commit
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on PreToolUse for git commit commands.
 * Suggests running code-reviewer agent as a safety net.
 *
 * Part of the multi-trigger code quality review system:
 * 1. Task completion - logical unit of work completed
 * 2. Before git commit (this script) - safety net
 * 3. Explicit /review command - user control
 */

const { log } = require('../lib/utils.cjs');

/**
 * Read hook input from stdin (JSON format)
 */
function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
  });
}

/**
 * Get list of staged source files
 */
function getStagedSourceFiles() {
  try {
    const { execSync } = require('child_process');
    const files = execSync('git diff --cached --name-only', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim().split('\n').filter(f => f.length > 0);

    // Filter to source code files only
    const sourceExtensions = /\.(ts|tsx|js|jsx|py|java|kt|go|rs|rb|php|cs|cpp|c|h)$/;
    return files.filter(f => sourceExtensions.test(f));
  } catch {
    return [];
  }
}

/**
 * Check if code review was recently done (within last 5 tool calls)
 * This prevents nagging if review was just performed
 */
function wasReviewRecentlyDone() {
  // Check environment for recent review marker
  // This would be set by code-reviewer agent
  return process.env.CLAUDE_RECENT_CODE_REVIEW === 'true';
}

async function main() {
  const input = await readStdin();

  // Get the command being executed
  const command = input.tool_input?.command || '';

  // Only trigger for actual git commit (not amend, not other git commands)
  if (!/^git\s+commit\b/.test(command) || /--amend/.test(command)) {
    // Not a fresh commit, pass through
    console.log(JSON.stringify(input));
    process.exit(0);
  }

  // Check for staged source files
  const stagedFiles = getStagedSourceFiles();

  if (stagedFiles.length === 0) {
    // No source files being committed, skip review suggestion
    log('[PreCommit] Commit has no source files staged');
    console.log(JSON.stringify(input));
    process.exit(0);
  }

  // Check if review was recently done
  if (wasReviewRecentlyDone()) {
    log('[PreCommit] Code review was recently performed, skipping suggestion');
    console.log(JSON.stringify(input));
    process.exit(0);
  }

  // Staged source files - suggest review (but don't block)
  // PreToolUse hooks do NOT support additionalContext, so we log to stderr for visibility
  log(`[PreCommit] ${stagedFiles.length} source file(s) about to be committed`);
  log(`[PreCommit] Files: ${stagedFiles.slice(0, 3).join(', ')}${stagedFiles.length > 3 ? '...' : ''}`);
  log('[PreCommit] Tip: Run code-reviewer agent before commit for quality assurance');

  // Pass through unchanged (don't block the commit)
  console.log(JSON.stringify(input));
  process.exit(0);
}

main().catch(err => {
  console.error('[PreCommit] Error:', err.message);
  // On error, pass through without blocking
  process.stdin.resume();
  let data = '';
  process.stdin.on('data', c => data += c);
  process.stdin.on('end', () => {
    console.log(data || '{}');
    process.exit(0);
  });
});
