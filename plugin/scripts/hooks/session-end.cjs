#!/usr/bin/env node
/**
 * Stop Hook (Session End) - Persist learnings when session ends
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs when Claude session ends. Creates/updates session log file
 * with timestamp for continuity tracking.
 */

const path = require('path');
const fs = require('fs');
const {
  getSessionsDir,
  getDateString,
  getTimeString,
  ensureDir,
  writeFile,
  replaceInFile,
  readStdinJson,
  log
} = require('../lib/utils.cjs');
const { logTelemetry } = require('../lib/hook-telemetry.cjs');

async function main() {
  const start = Date.now();
  // Skip advisory hooks inside subagents — only fire for top-level Claude sessions
  const hookInput = await readStdinJson().catch(() => ({}));
  if (hookInput.agent_id) {
    logTelemetry({ hook: 'session-end', event: 'SessionEnd', outcome: 'skipped', reason: 'subagent', duration_ms: Date.now() - start });
    process.exit(0);
  }
  const sessionsDir = getSessionsDir();
  const today = getDateString();
  const sessionFile = path.join(sessionsDir, `${today}-session.tmp`);

  ensureDir(sessionsDir);

  const currentTime = getTimeString();

  // If session file exists for today, update the end time
  if (fs.existsSync(sessionFile)) {
    const success = replaceInFile(
      sessionFile,
      /\*\*Last Updated:\*\*.*/,
      `**Last Updated:** ${currentTime}`
    );

    if (success) {
      log(`[SessionEnd] Updated session file: ${sessionFile}`);
      logTelemetry({ hook: 'session-end', event: 'SessionEnd', outcome: 'fired', reason: 'updated session file', duration_ms: Date.now() - start });
    }
  } else {
    // Create new session file with template
    const template = `# Session: ${today}
**Date:** ${today}
**Started:** ${currentTime}
**Last Updated:** ${currentTime}

---

## Current State

[Session context goes here]

### Completed
- [ ]

### In Progress
- [ ]

### Notes for Next Session
-

### Context to Load
\`\`\`
[relevant files]
\`\`\`
`;

    writeFile(sessionFile, template);
    log(`[SessionEnd] Created session file: ${sessionFile}`);
    logTelemetry({ hook: 'session-end', event: 'SessionEnd', outcome: 'fired', reason: 'created session file', duration_ms: Date.now() - start });
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[SessionEnd] Error:', err.message);
  process.exit(0);
});
