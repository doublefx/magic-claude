#!/usr/bin/env node
/**
 * PR URL Logger - Extract and log PR URLs after gh pr create
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on PostToolUse for Bash commands.
 * Filters internally for "gh pr create" commands.
 */

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const cmd = input.tool_input?.command || '';

    // Only process gh pr create commands
    if (/gh pr create/.test(cmd)) {
      const output = input.tool_output?.output || '';
      const match = output.match(/https:\/\/github.com\/[^/]+\/[^/]+\/pull\/\d+/);

      if (match) {
        const prUrl = match[0];
        const repoMatch = prUrl.match(/https:\/\/github.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);

        if (repoMatch) {
          const repo = repoMatch[1];
          const prNumber = repoMatch[2];

          console.error(`[Hook] PR created: ${prUrl}`);
          console.error(`[Hook] To review: gh pr review ${prNumber} --repo ${repo}`);
        }
      }
    }

    // Pass through unchanged
    console.log(data);
  } catch (error) {
    console.error(`[PRLogger] Error: ${error.message}`);
    console.log(data);
  }
});
