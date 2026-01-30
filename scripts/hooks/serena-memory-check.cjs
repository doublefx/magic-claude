#!/usr/bin/env node
/**
 * PreToolUse Hook: Force memory-first workflow
 *
 * Outputs STRONG reminder to use /before-exploring
 * Claude MUST acknowledge and use the skill
 *
 * Triggers on: Serena exploration tools (excludes memory management tools)
 */

const { isSerenaEnabled, isJetBrainsAvailable } = require('../lib/serena.cjs');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  // Check feature flag
  if (!isSerenaEnabled()) {
    console.log(data); // Pass through unchanged
    process.exit(0);
  }

  let input;
  try {
    input = JSON.parse(data);
  } catch {
    console.log(data);
    process.exit(0);
  }

  const toolName = input.tool_name || '';

  // Detect if JetBrains available for tool selection hint
  const useJetBrains = isJetBrainsAvailable();

  const output = {
    ...input,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  MEMORY-FIRST WORKFLOW REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are about to use Serena exploration tool: ${toolName}

BEFORE PROCEEDING, you MUST:

1. Use /before-exploring skill NOW
   - This checks existing memories for the answer
   - May return answer immediately (saves tokens!)
   - Only explores if memories insufficient

2. Tool Selection:
   ${useJetBrains ? '✅ JetBrains tools available (faster)' : '📌 Using LSP tools'}

Do NOT skip this step. Memory-first workflow is MANDATORY.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    }
  };

  console.log(JSON.stringify(output));
  process.exit(0);
});
