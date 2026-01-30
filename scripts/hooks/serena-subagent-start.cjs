#!/usr/bin/env node
/**
 * SubagentStart Hook: Track exploration agents
 *
 * Cannot block (agent already spawning)
 * Sets flag for later use by SubagentStop/PostToolUse
 *
 * Triggers on: SubagentStart event
 */

const { isSerenaInstalled, isExplorationAgent } = require('../lib/serena.cjs');
const fs = require('fs');

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

  const agentType = input.agent_type || '';
  const agentId = input.agent_id || '';

  // Only track exploration agents
  if (!isExplorationAgent(agentType)) {
    process.exit(0);
  }

  // Set environment flag for later hooks
  if (process.env.CLAUDE_ENV_FILE) {
    try {
      fs.appendFileSync(process.env.CLAUDE_ENV_FILE,
        `export SERENA_EXPLORATION_ACTIVE="true"\n` +
        `export SERENA_EXPLORATION_AGENT_ID="${agentId}"\n` +
        `export SERENA_EXPLORATION_AGENT_TYPE="${agentType}"\n`
      );
    } catch {
      // Non-fatal - best effort
    }
  }

  // Log for visibility (stderr goes to verbose mode)
  console.error(`[Serena] Exploration agent started: ${agentType} (${agentId})`);
  process.exit(0);
});
