#!/usr/bin/env node
/**
 * TaskCompleted Hook - Quality gate for task completion
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Fires when a task is being marked as completed (via TaskUpdate or when
 * agent team teammates finish with in-progress tasks). Advisory only -
 * exits 0 to allow completion but logs recommendations via stderr.
 *
 * Note: This complements the PostToolUse/TaskUpdate hook (post-task-update.cjs)
 * which also fires on task completion. This hook provides quality gate
 * enforcement at the event level rather than the tool level, which is
 * especially useful for Agent Teams where teammates complete tasks.
 */

const { log } = require('../lib/utils.cjs');

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

function getModifiedSourceFiles() {
  try {
    const { execSync } = require('child_process');
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    const files = execSync('git diff --name-only HEAD 2>/dev/null || git diff --name-only', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim().split('\n').filter(f => f.length > 0);

    const sourceExtensions = /\.(ts|tsx|js|jsx|py|java|kt|go|rs|rb|php|cs|cpp|c|h)$/;
    return files.filter(f => sourceExtensions.test(f));
  } catch {
    return [];
  }
}

async function main() {
  const input = await readStdin();

  const taskSubject = input.task_subject || 'unknown';
  const taskId = input.task_id || '';
  const teammateName = input.teammate_name || '';

  const modifiedFiles = getModifiedSourceFiles();

  if (modifiedFiles.length > 0) {
    const context = teammateName
      ? `Teammate "${teammateName}" completing task`
      : 'Task completing';

    log(`[TaskCompleted] ${context}: "${taskSubject}" with ${modifiedFiles.length} modified source file(s)`);
    log('[TaskCompleted] Consider verifying tests pass and running code review');
  }

  // Advisory only - always allow completion
  process.exit(0);
}

main().catch(err => {
  console.error('[TaskCompleted] Error:', err.message);
  process.exit(0);
});
