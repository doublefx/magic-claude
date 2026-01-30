#!/usr/bin/env node
/**
 * PreToolUse Hook: Check Task agent type
 *
 * Only triggers for Explore and general-purpose agents
 * Other agents (Bash, Plan, etc.) pass through
 *
 * Triggers on: Task tool calls
 */

const { isSerenaEnabled, isExplorationAgent } = require('../lib/serena.cjs');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  if (!isSerenaEnabled()) {
    console.log(data);
    process.exit(0);
  }

  let input;
  try {
    input = JSON.parse(data);
  } catch {
    console.log(data);
    process.exit(0);
  }

  const toolInput = input.tool_input || {};
  const subagentType = toolInput.subagent_type || '';

  // Only check for exploration-type agents
  if (!isExplorationAgent(subagentType)) {
    console.log(data);
    process.exit(0);
  }

  const output = {
    ...input,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  STOP! Use /before-exploring FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're about to spawn a ${subagentType} agent.

MEMORY-FIRST WORKFLOW REQUIRED:

1. Use /before-exploring NOW
   - Checks if memories already have the answer
   - Returns consolidated knowledge if sufficient
   - Saves significant tokens!

2. Only spawn agent if memories insufficient

3. After agent completes, use /after-exploring

This is NOT optional. Check memories FIRST.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    }
  };

  console.log(JSON.stringify(output));
  process.exit(0);
});
