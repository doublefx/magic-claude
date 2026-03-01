#!/usr/bin/env node
/**
 * PreCompact Hook - Save state before context compaction
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs before Claude compacts context, giving you a chance to
 * preserve important state that might get lost in summarization.
 */

const fs = require('fs');
const path = require('path');
const {
  getSessionsDir,
  getDateTimeString,
  getTimeString,
  findFiles,
  ensureDir,
  appendFile,
  log
} = require('../lib/utils.cjs');

function main() {
  const sessionsDir = getSessionsDir();
  const compactionLog = path.join(sessionsDir, 'compaction-log.txt');

  ensureDir(sessionsDir);

  // Log compaction event with timestamp
  const timestamp = getDateTimeString();
  appendFile(compactionLog, `[${timestamp}] Context compaction triggered\n`);

  // If there's an active session file, note the compaction
  const sessions = findFiles(sessionsDir, '*.tmp');

  if (sessions.length > 0) {
    const activeSession = sessions[0].path;
    const timeStr = getTimeString();
    appendFile(activeSession, `\n---\n**[Compaction occurred at ${timeStr}]** - Context was summarized\n`);
  }

  // Check for active orchestration state and remind Claude to preserve it
  const stateFile = path.join(process.cwd(), '.claude', 'orchestration-state.md');
  if (fs.existsSync(stateFile)) {
    const stateContent = fs.readFileSync(stateFile, 'utf8');
    const phaseMatch = stateContent.match(/^Phase:\s*(.+)$/m);
    const featureMatch = stateContent.match(/^Feature:\s*(.+)$/m);
    const phase = phaseMatch ? phaseMatch[1].trim() : 'unknown';
    const feature = featureMatch ? featureMatch[1].trim() : 'unknown';

    log(`[PreCompact] Active orchestration detected: "${feature}" at ${phase}`);
    log('[PreCompact] IMPORTANT: After compaction, read .claude/orchestration-state.md to restore pipeline context.');
    log('[PreCompact] The approved plan is at the path specified in the state file.');
  }

  log('[PreCompact] State saved before compaction');
  process.exit(0);
}

main().catch(err => {
  console.error('[PreCompact] Error:', err.message);
  process.exit(0);
});
