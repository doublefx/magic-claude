#!/usr/bin/env node
/**
 * PostToolUse Hook: Evaluate memories on task completion
 *
 * Runs when: TaskUpdate with status=completed
 * Pattern: Same as evaluate-session.cjs (continuous-learning)
 *
 * Does NOT run on every Edit/Write (too noisy)
 *
 * Triggers on: TaskUpdate tool calls
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

  const toolInput = input.tool_input || {};

  // Only trigger on task completion
  if (toolInput.status !== 'completed') {
    console.log(data);
    process.exit(0);
  }

  const output = {
    ...input,
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `
✅ Task Completed - Memory Check

If significant code exploration occurred during this task:
→ Use /after-exploring to preserve findings

Memory consolidation status:
→ Will check for 5+ related memories after documentation
`
    }
  };

  console.log(JSON.stringify(output));
  process.exit(0);
});
