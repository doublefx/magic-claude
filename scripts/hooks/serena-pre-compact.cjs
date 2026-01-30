#!/usr/bin/env node
/**
 * PreCompact Hook: Preserve knowledge before context loss
 *
 * Critical checkpoint - context about to be compacted
 * Any undocumented exploration will be lost
 *
 * Triggers on: PreCompact event
 */

const { isSerenaEnabled } = require('../lib/serena.cjs');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  if (!isSerenaEnabled()) {
    // Exit silently
    process.exit(0);
  }

  // Log to stderr (PreCompact doesn't support hookSpecificOutput)
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  CONTEXT COMPACTION - PRESERVE KNOWLEDGE NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context is about to be compacted.

If you explored code in this session and haven't documented:
→ Use /after-exploring NOW before context is lost

This is your last chance to preserve session knowledge!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  process.exit(0);
});
