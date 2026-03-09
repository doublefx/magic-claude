#!/usr/bin/env node
/**
 * Inject Prompt Context - Add dynamic context to user prompts
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on UserPromptSubmit event.
 * Injects branch, pending tasks, time, and other context.
 */

const { execSync } = require('child_process');
const { logTelemetry } = require('../lib/hook-telemetry.cjs');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  const start = Date.now();
  try {
    const input = JSON.parse(data);
    const contextParts = [];

    // Get current time
    contextParts.push(`Time: ${new Date().toISOString()}`);

    // Get git branch if in a repo
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      contextParts.push(`Branch: ${branch}`);

      // Check for uncommitted changes
      const status = execSync('git status --porcelain', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();

      if (status) {
        const lines = status.split('\n').length;
        contextParts.push(`Uncommitted changes: ${lines} file(s)`);
      }
    } catch {
      // Not a git repo, skip
    }

    // Check for pending tasks in session
    const taskCount = process.env.CLAUDE_PENDING_TASKS;
    if (taskCount) {
      contextParts.push(`Pending tasks: ${taskCount}`);
    }

    // Get package manager if detected
    const pkgManager = process.env.CLAUDE_PACKAGE_MANAGER || process.env.DETECTED_PKG_MANAGER;
    if (pkgManager) {
      contextParts.push(`Package manager: ${pkgManager}`);
    }

    // Build output with additionalContext
    const output = {
      ...input,
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: contextParts.join('\n')
      }
    };

    logTelemetry({ hook: 'inject-prompt-context', event: 'UserPromptSubmit', outcome: 'fired', reason: `${contextParts.length} context parts`, duration_ms: Date.now() - start });
    console.log(JSON.stringify(output));
  } catch (error) {
    console.error(`[PromptContext] Error: ${error.message}`);
    logTelemetry({ hook: 'inject-prompt-context', event: 'UserPromptSubmit', outcome: 'error', reason: error.message, duration_ms: Date.now() - start });
    // Pass through on error
    console.log(data);
  }
});
