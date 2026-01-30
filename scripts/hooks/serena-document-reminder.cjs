#!/usr/bin/env node
/**
 * PostToolUse Hook: Document exploration findings
 *
 * Reminder to use /after-exploring
 *
 * Triggers on: Serena exploration tools (excludes memory management tools)
 */

const { isSerenaEnabled } = require('../lib/serena.cjs');

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

  const output = {
    ...input,
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `
📝 DOCUMENTATION CHECKPOINT

Exploration complete. If findings were significant:
→ Use /after-exploring to document in memory

Significant = architecture, patterns, integrations, workflows
Not significant = trivial code, already documented, debugging artifacts
`
    }
  };

  console.log(JSON.stringify(output));
  process.exit(0);
});
