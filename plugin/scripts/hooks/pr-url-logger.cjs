#!/usr/bin/env node
/**
 * PR URL Logger - Extract and log PR URLs after gh pr create
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on PostToolUse for Bash commands.
 * Filters internally for "gh pr create" commands.
 */

const { debugHook, wrapHookMain } = require('../lib/hook-debug.cjs');

wrapHookMain('pr-url-logger', (input) => {
  // Skip advisory hooks inside subagents — only fire for top-level Claude sessions
  if (input.agent_id) return;
  const cmd = input.tool_input?.command || '';

  // Only process gh pr create commands
  if (!/gh pr create/.test(cmd)) {
    debugHook('pr-url-logger', 'process', 'Skipping — not a gh pr create command');
    process.exit(0);
  }

  const output = input.tool_response?.output || '';
  const match = output.match(/https:\/\/github.com\/[^/]+\/[^/]+\/pull\/\d+/);

  if (match) {
    const prUrl = match[0];
    const repoMatch = prUrl.match(/https:\/\/github.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);

    if (repoMatch) {
      const repo = repoMatch[1];
      const prNumber = repoMatch[2];

      console.error(`[Hook] PR created: ${prUrl}`);
      console.error(`[Hook] To review: gh pr review ${prNumber} --repo ${repo}`);

      debugHook('pr-url-logger', 'output', 'Writing PR URL context', prUrl);
      // Inject PR URL as context for Claude
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: `PR created: ${prUrl}. To review: gh pr review ${prNumber} --repo ${repo}`
        }
      }));
      return;
    }
  }

  debugHook('pr-url-logger', 'exit', 'No PR URL found — clean exit');
  // Nothing to report — exit cleanly
  process.exit(0);
});
