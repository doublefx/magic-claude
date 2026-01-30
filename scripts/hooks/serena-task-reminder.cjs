#!/usr/bin/env node
/**
 * PostToolUse Hook: Task agent completion reminder
 *
 * Reminder to document findings after Task agents complete
 *
 * Triggers on: Task tool calls (for Explore/general-purpose agents)
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

  // Only remind for exploration-type agents
  if (!isExplorationAgent(subagentType)) {
    console.log(data);
    process.exit(0);
  }

  const output = {
    ...input,
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 EXPLORATION COMPLETE - DOCUMENT FINDINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The ${subagentType} agent has completed exploration.

REQUIRED: Use /after-exploring NOW to document findings.

This ensures:
- Knowledge is preserved across sessions
- Future questions answered from memory (faster!)
- Token savings on repeated explorations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    }
  };

  console.log(JSON.stringify(output));
  process.exit(0);
});
