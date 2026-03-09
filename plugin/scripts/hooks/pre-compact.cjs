#!/usr/bin/env node
/**
 * PreCompact Hook - Save state and enrich craft pipeline state before compaction
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs before Claude compacts context:
 * 1. Logs compaction event
 * 2. Migrates legacy orchestration-state.md -> craft-state.md
 * 3. Enriches craft-state.md with Resume Directive for post-compaction recovery
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
  readStdinJson,
  log
} = require('../lib/utils.cjs');
const { logTelemetry } = require('../lib/hook-telemetry.cjs');

const STATE_FILENAME = 'craft-state.md';
const LEGACY_STATE_FILENAME = 'orchestration-state.md';

const LITE_PHASES = ['QUICK DISCOVER', 'TDD', 'VERIFY', 'REVIEW'];
const FULL_PHASES = ['QUICK DISCOVER', 'DISCOVER', 'PLAN', 'CRITIC', 'TDD', 'VERIFY', 'REVIEW+HARDEN', 'SIMPLIFY', 'DELIVER'];

/**
 * Normalize a Phase field value to match a known pipeline phase name.
 * Handles between-phase states like "PLAN APPROVED", "TDD — baseline verification", etc.
 */
function normalizePhase(rawPhase) {
  if (!rawPhase) return null;
  const phase = rawPhase.trim().toUpperCase();

  // Between-phase state mappings
  if (phase.startsWith('PLAN APPROVED')) return 'PLAN';
  if (phase.startsWith('BASELINE')) return 'TDD';

  // Strip detail suffix (e.g., "TDD — baseline verification" -> "TDD")
  const baseName = phase.split(/\s*[—–-]\s*/)[0].trim();

  // Match against known phases (longest first to prevent "REVIEW" matching before "REVIEW+HARDEN")
  const allPhases = [...new Set([...LITE_PHASES, ...FULL_PHASES])].sort((a, b) => b.length - a.length);
  for (const known of allPhases) {
    if (baseName === known || baseName.startsWith(known)) return known;
  }

  return null;
}

/**
 * Compute Resume Directive content from parsed state fields.
 */
function computeResumeDirective(phase, mode, currentTask) {
  const normalizedPhase = normalizePhase(phase);
  const phases = (mode || '').toUpperCase().includes('LITE') ? LITE_PHASES : FULL_PHASES;

  let nextAction;
  let remaining;

  if (normalizedPhase) {
    const idx = phases.indexOf(normalizedPhase);
    if (idx >= 0 && idx < phases.length - 1) {
      const nextPhase = phases[idx + 1];
      nextAction = currentTask
        ? `Continue ${normalizedPhase} (${currentTask.trim()}), then proceed to ${nextPhase}`
        : `Proceed to ${nextPhase}`;
      remaining = phases.slice(idx + 1).join(' -> ');
    } else if (idx === phases.length - 1) {
      nextAction = `Complete ${normalizedPhase}`;
      remaining = 'final phase';
    } else {
      nextAction = 'Read .claude/craft-state.md and determine current position';
      remaining = 'unknown — read state file';
    }
  } else {
    nextAction = 'Read .claude/craft-state.md and determine current position';
    remaining = 'unknown — read state file';
  }

  return `## Resume Directive\nNEXT ACTION: ${nextAction}\nREMAINING: ${remaining}\nINVOKE: magic-claude:craft to continue the pipeline`;
}

/**
 * Generate Pipeline Position diagram with arrow at current phase.
 */
function computePipelinePosition(phase, mode) {
  const normalizedPhase = normalizePhase(phase);
  const isLite = (mode || '').toUpperCase().includes('LITE');
  const phases = isLite ? LITE_PHASES : FULL_PHASES;
  const label = isLite ? 'LITE' : 'FULL';

  const line = `${label}:  ${phases.join(' -> ')}`;
  if (!normalizedPhase) return `## Pipeline Position\n${line}`;

  const idx = phases.indexOf(normalizedPhase);
  if (idx < 0) return `## Pipeline Position\n${line}`;

  // Compute arrow position
  const prefix = `${label}:  `;
  const beforePhase = phases.slice(0, idx).join(' -> ');
  const offset = prefix.length + (beforePhase ? beforePhase.length + ' -> '.length : 0);
  const arrow = ' '.repeat(offset) + '^ HERE';

  return `## Pipeline Position\n${line}\n${arrow}`;
}

/**
 * Enrich the craft state file with Resume Directive and Pipeline Position.
 * Returns true if enrichment was performed.
 */
function enrichStateFile(stateFilePath) {
  const rawContent = fs.readFileSync(stateFilePath, 'utf8');
  // Normalize CRLF -> LF for reliable regex parsing (WSL2)
  const content = rawContent.replace(/\r\n/g, '\n');

  // Step 0: Skip if already enriched
  if (content.includes('## Resume Directive')) {
    return false;
  }

  // Step 1: Parse fields
  const phaseMatch = content.match(/^Phase:\s*(.+)$/m);
  const modeMatch = content.match(/^Mode:\s*(.+)$/m);
  const taskMatch = content.match(/^Task:\s*(.+)$/m);

  const phase = phaseMatch ? phaseMatch[1].trim() : null;
  const mode = modeMatch ? modeMatch[1].trim() : 'FULL';
  const currentTask = taskMatch ? taskMatch[1].trim() : null;

  // Stale detection: warn if Phase Summary and Phase header are inconsistent
  const phaseSummaryMatch = content.match(/^- VERIFY:\s*completed/m);
  if (phaseSummaryMatch && phase && !phase.toUpperCase().includes('VERIFY') &&
      !phase.toUpperCase().includes('REVIEW') && !phase.toUpperCase().includes('DELIVER') &&
      !phase.toUpperCase().includes('SIMPLIFY')) {
    log('[PreCompact] WARNING: Phase Summary shows VERIFY completed but Phase header is at an earlier stage — state may be stale');
  }

  // Step 4-5: Compute sections
  const resumeDirective = computeResumeDirective(phase, mode, currentTask);
  const pipelinePosition = computePipelinePosition(phase, mode);

  // Step 6: Append sections before the end of content
  const enrichedContent = content.trimEnd() + '\n\n' + pipelinePosition + '\n\n' + resumeDirective + '\n';

  // Step 7: Atomic write
  const tmpPath = stateFilePath + '.tmp';
  fs.writeFileSync(tmpPath, enrichedContent, 'utf8');
  fs.renameSync(tmpPath, stateFilePath);

  return true;
}

async function main() {
  const start = Date.now();
  // Skip advisory hooks inside subagents — only fire for top-level Claude sessions
  const hookInput = await readStdinJson().catch(() => ({}));
  if (hookInput.agent_id) {
    logTelemetry({ hook: 'pre-compact', event: 'PreCompact', outcome: 'skipped', reason: 'subagent', duration_ms: Date.now() - start });
    process.exit(0);
  }
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

  // Migration: rename legacy orchestration-state.md -> craft-state.md
  const claudeDir = path.join(process.cwd(), '.claude');
  const stateFile = path.join(claudeDir, STATE_FILENAME);
  const legacyStateFile = path.join(claudeDir, LEGACY_STATE_FILENAME);

  if (!fs.existsSync(stateFile) && fs.existsSync(legacyStateFile)) {
    try {
      fs.renameSync(legacyStateFile, stateFile);
      log(`[PreCompact] Migrated ${LEGACY_STATE_FILENAME} -> ${STATE_FILENAME}`);
    } catch (err) {
      log(`[PreCompact] Migration failed: ${err.message}`);
    }
  }

  // Check for active craft state and enrich before compaction
  if (fs.existsSync(stateFile)) {
    const stateContent = fs.readFileSync(stateFile, 'utf8');
    const phaseMatch = stateContent.match(/^Phase:\s*(.+)$/m);
    const featureMatch = stateContent.match(/^Feature:\s*(.+)$/m);
    const phase = phaseMatch ? phaseMatch[1].trim() : 'unknown';
    const feature = featureMatch ? featureMatch[1].trim() : 'unknown';

    log(`[PreCompact] Active craft pipeline detected: "${feature}" at ${phase}`);
    log(`[PreCompact] State file: .claude/${STATE_FILENAME}`);
    log('[PreCompact] The approved plan is at the path specified in the state file.');

    // Enrich state file with Resume Directive for post-compaction recovery
    try {
      const enriched = enrichStateFile(stateFile);
      if (enriched) {
        log('[PreCompact] State file enriched with Resume Directive and Pipeline Position');
      } else {
        log('[PreCompact] State file already has Resume Directive — skipping enrichment');
      }
    } catch (err) {
      log(`[PreCompact] Enrichment failed (non-blocking): ${err.message}`);
    }
  }

  log('[PreCompact] State saved before compaction');
  const hasCraftState = fs.existsSync(stateFile);
  logTelemetry({ hook: 'pre-compact', event: 'PreCompact', outcome: 'fired', reason: hasCraftState ? 'state saved (active craft pipeline)' : 'state saved', duration_ms: Date.now() - start });
  process.exit(0);
}

main().catch(err => {
  console.error('[PreCompact] Error:', err.message);
  process.exit(0);
});
