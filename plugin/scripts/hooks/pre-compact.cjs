#!/usr/bin/env node
/**
 * PreCompact Hook - Save state and enrich craft pipeline state before compaction
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs before Claude compacts context:
 * 1. Logs compaction event
 * 2. Migrates legacy state files -> .claude/craft/craft-state.md
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

const LITE_PHASES = ['QUICK DISCOVER', 'TASK LIST', 'TDD', 'VERIFY', 'REVIEW', 'REPORT'];
const FULL_PHASES = ['QUICK DISCOVER', 'TASK LIST', 'DEEP DISCOVER', 'PLAN', 'PLAN CRITIC', 'TDD', 'VERIFY', 'REVIEW+HARDEN', 'SIMPLIFY', 'DELIVER', 'REPORT'];
// Precomputed: longest-first for startsWith matching (REVIEW+HARDEN before REVIEW)
const ALL_PHASES_SORTED = [...new Set([...LITE_PHASES, ...FULL_PHASES])].sort((a, b) => b.length - a.length);

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

  // Legacy mappings (v2.28.x → v2.29.0 upgrade)
  if (phase === 'DISCOVER' || phase.startsWith('DISCOVER —') || phase.startsWith('DISCOVER –')) return 'DEEP DISCOVER';
  if (phase === 'CRITIC' || phase.startsWith('CRITIC —') || phase.startsWith('CRITIC –')) return 'PLAN CRITIC';

  // Strip detail suffix (e.g., "TDD — baseline verification" -> "TDD")
  const baseName = phase.split(/\s*[—–-]\s*/)[0].trim();

  for (const known of ALL_PHASES_SORTED) {
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
      nextAction = 'Read .claude/craft/craft-state.md and determine current position';
      remaining = 'unknown — read state file';
    }
  } else {
    nextAction = 'Read .claude/craft/craft-state.md and determine current position';
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
 * Returns { enriched, phase, feature } — enriched=false if already has Resume Directive.
 */
function enrichStateFile(stateFilePath) {
  const rawContent = fs.readFileSync(stateFilePath, 'utf8');
  // Normalize CRLF -> LF for reliable regex parsing (WSL2)
  const content = rawContent.replace(/\r\n/g, '\n');

  // Parse fields (needed for both logging and enrichment)
  const phaseMatch = content.match(/^Phase:\s*(.+)$/m);
  const modeMatch = content.match(/^Mode:\s*(.+)$/m);
  const featureMatch = content.match(/^Feature:\s*(.+)$/m);
  const taskMatch = content.match(/^Task:\s*(.+)$/m);

  const phase = phaseMatch ? phaseMatch[1].trim() : null;
  const mode = modeMatch ? modeMatch[1].trim() : 'FULL';
  const feature = featureMatch ? featureMatch[1].trim() : null;
  const currentTask = taskMatch ? taskMatch[1].trim() : null;

  // Skip if already enriched
  if (content.includes('## Resume Directive')) {
    return { enriched: false, phase, feature };
  }

  // Stale detection: warn if Phase Summary and Phase header are inconsistent
  const phaseSummaryMatch = content.match(/^- VERIFY:\s*completed/m);
  if (phaseSummaryMatch && phase && !phase.toUpperCase().includes('VERIFY') &&
      !phase.toUpperCase().includes('REVIEW') && !phase.toUpperCase().includes('DELIVER') &&
      !phase.toUpperCase().includes('SIMPLIFY')) {
    log('[PreCompact] WARNING: Phase Summary shows VERIFY completed but Phase header is at an earlier stage — state may be stale');
  }

  // Compute and append sections
  const resumeDirective = computeResumeDirective(phase, mode, currentTask);
  const pipelinePosition = computePipelinePosition(phase, mode);
  const enrichedContent = content.trimEnd() + '\n\n' + pipelinePosition + '\n\n' + resumeDirective + '\n';

  // Atomic write
  const tmpPath = stateFilePath + '.tmp';
  fs.writeFileSync(tmpPath, enrichedContent, 'utf8');
  fs.renameSync(tmpPath, stateFilePath);

  return { enriched: true, phase, feature };
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

  // Migration: move legacy state files -> .claude/craft/craft-state.md
  const claudeDir = path.join(process.cwd(), '.claude');
  const craftDir = path.join(claudeDir, 'craft');
  const stateFile = path.join(craftDir, STATE_FILENAME);

  // Legacy locations (oldest to newest)
  const legacyOrchestration = path.join(claudeDir, LEGACY_STATE_FILENAME);
  const legacyCraftState = path.join(claudeDir, STATE_FILENAME);

  if (!fs.existsSync(stateFile)) {
    // Try migrating from legacy locations (newest legacy first)
    const legacySource = fs.existsSync(legacyCraftState) ? legacyCraftState
      : fs.existsSync(legacyOrchestration) ? legacyOrchestration
      : null;

    if (legacySource) {
      try {
        ensureDir(craftDir);
        fs.renameSync(legacySource, stateFile);
        log(`[PreCompact] Migrated ${path.basename(legacySource)} -> craft/${STATE_FILENAME}`);
      } catch (err) {
        log(`[PreCompact] Migration failed: ${err.message}`);
      }
    }
  }

  // Check for active craft state and enrich before compaction (single read)
  if (fs.existsSync(stateFile)) {
    try {
      const result = enrichStateFile(stateFile);
      const feature = result.feature || 'unknown';
      const phase = result.phase || 'unknown';

      log(`[PreCompact] Active craft pipeline detected: "${feature}" at ${phase}`);
      log(`[PreCompact] State file: .claude/craft/${STATE_FILENAME}`);
      log('[PreCompact] The approved plan is at the path specified in the state file.');

      if (result.enriched) {
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
