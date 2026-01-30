#!/usr/bin/env node
/**
 * SubagentStop Hook: Enforce documentation
 *
 * CAN force continuation (exit code 2 + stderr)
 * Check stop_hook_active to prevent infinite loops
 *
 * Triggers on: SubagentStop event
 */

const { isSerenaInstalled } = require('../lib/serena.cjs');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  if (!isSerenaInstalled()) {
    process.exit(0);
  }

  let input;
  try {
    input = JSON.parse(data);
  } catch {
    process.exit(0);
  }

  // Prevent infinite loops
  if (input.stop_hook_active) {
    process.exit(0);
  }

  // Check if exploration was active
  if (process.env.SERENA_EXPLORATION_ACTIVE !== 'true') {
    process.exit(0);
  }

  const agentId = input.agent_id || process.env.SERENA_EXPLORATION_AGENT_ID || 'unknown';

  // Output documentation reminder
  const output = {
    hookSpecificOutput: {
      hookEventName: 'SubagentStop',
      additionalContext: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 EXPLORATION COMPLETE - DOCUMENT FINDINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Agent ${agentId} completed exploration.

REQUIRED: Use /after-exploring NOW to document findings.

If findings were significant (architecture, patterns, integrations):
→ Create or update Serena memory

If trivial (debugging, already documented):
→ You may skip documentation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    }
  };

  console.log(JSON.stringify(output));
  process.exit(0);
});
