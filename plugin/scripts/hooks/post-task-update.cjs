#!/usr/bin/env node
/**
 * Post TaskUpdate Hook - Suggest code review when tasks complete
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs after TaskUpdate tool to detect task completion.
 * Uses hookSpecificOutput.additionalContext to inject visible context
 * that Claude will surface to the user.
 */

const { log } = require('../lib/utils.cjs');
const { debugHook, wrapHookMain } = require('../lib/hook-debug.cjs');

/**
 * Get list of source files modified in current session
 */
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

wrapHookMain('post-task-update', (input) => {
  // Skip advisory hooks inside subagents — only fire for top-level Claude sessions
  if (input.agent_id) return;
  // Check if this was a task completion
  const toolInput = input.tool_input || {};
  const status = toolInput.status;

  // Only trigger on task completion
  if (status !== 'completed') {
    debugHook('post-task-update', 'process', 'Skipping — status is not completed', status);
    process.exit(0);
  }

  // Check for modified source files
  const modifiedFiles = getModifiedSourceFiles();

  if (modifiedFiles.length === 0) {
    debugHook('post-task-update', 'process', 'No modified source files');
    process.exit(0);
  }

  // Task completed with source file changes - inject context for Claude
  log(`[TaskComplete] Task completed with ${modifiedFiles.length} source file(s) modified`);

  const fileList = modifiedFiles.slice(0, 5).join(', ') + (modifiedFiles.length > 5 ? '...' : '');
  debugHook('post-task-update', 'output', 'Writing review recommendation', { fileCount: modifiedFiles.length });
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `[Code Review Recommended] Task completed with ${modifiedFiles.length} source file(s) modified: ${fileList}. Consider running code-reviewer agent to verify code quality and security before committing. You should inform the user about this recommendation.`
    }
  }));

  process.exit(0);
});
