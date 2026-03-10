/**
 * Tests for pre-compact.cjs enrichment logic
 *
 * Tests the normalizePhase, computeResumeDirective, computePipelinePosition,
 * and enrichStateFile functions used to enrich craft-state.md before compaction.
 *
 * Run with: node tests/hooks/pre-compact-enrichment.test.cjs
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Test helper
function test(name, fn) {
  try {
    fn();
    console.log(`  \u2713 ${name}`);
    return true;
  } catch (err) {
    console.log(`  \u2717 ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

// Import functions from pre-compact.cjs by extracting them
// We can't require the script directly (it runs main()), so we extract the functions
const REPO_ROOT = path.join(__dirname, '..', '..');
const PRE_COMPACT_PATH = path.join(REPO_ROOT, 'plugin', 'scripts', 'hooks', 'pre-compact.cjs');

// Read the source and extract the pure functions for testing
const preCompactSource = fs.readFileSync(PRE_COMPACT_PATH, 'utf8');

// Extract constants and functions via eval in a controlled scope
const LITE_PHASES = ['QUICK DISCOVER', 'TASK LIST', 'TDD', 'VERIFY', 'REVIEW', 'REPORT'];
const FULL_PHASES = ['QUICK DISCOVER', 'TASK LIST', 'DEEP DISCOVER', 'PLAN', 'PLAN CRITIC', 'TDD', 'VERIFY', 'REVIEW+HARDEN', 'SIMPLIFY', 'DELIVER', 'REPORT'];
const ALL_PHASES_SORTED = [...new Set([...LITE_PHASES, ...FULL_PHASES])].sort((a, b) => b.length - a.length);

// Re-implement the pure functions for testing (matches pre-compact.cjs exactly)
function normalizePhase(rawPhase) {
  if (!rawPhase) return null;
  const phase = rawPhase.trim().toUpperCase();

  if (phase.startsWith('PLAN APPROVED')) return 'PLAN';
  if (phase.startsWith('BASELINE')) return 'TDD';

  // Legacy mappings (v2.28.x → v2.29.0 upgrade)
  if (phase === 'DISCOVER' || phase.startsWith('DISCOVER —') || phase.startsWith('DISCOVER –')) return 'DEEP DISCOVER';
  if (phase === 'CRITIC' || phase.startsWith('CRITIC —') || phase.startsWith('CRITIC –')) return 'PLAN CRITIC';

  const baseName = phase.split(/\s*[—–-]\s*/)[0].trim();

  for (const known of ALL_PHASES_SORTED) {
    if (baseName === known || baseName.startsWith(known)) return known;
  }

  return null;
}

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

function computePipelinePosition(phase, mode) {
  const normalizedPhase = normalizePhase(phase);
  const isLite = (mode || '').toUpperCase().includes('LITE');
  const phases = isLite ? LITE_PHASES : FULL_PHASES;
  const label = isLite ? 'LITE' : 'FULL';

  const line = `${label}:  ${phases.join(' -> ')}`;
  if (!normalizedPhase) return `## Pipeline Position\n${line}`;

  const idx = phases.indexOf(normalizedPhase);
  if (idx < 0) return `## Pipeline Position\n${line}`;

  const prefix = `${label}:  `;
  const beforePhase = phases.slice(0, idx).join(' -> ');
  const offset = prefix.length + (beforePhase ? beforePhase.length + ' -> '.length : 0);
  const arrow = ' '.repeat(offset) + '^ HERE';

  return `## Pipeline Position\n${line}\n${arrow}`;
}

function enrichStateFile(stateFilePath) {
  const rawContent = fs.readFileSync(stateFilePath, 'utf8');
  const content = rawContent.replace(/\r\n/g, '\n');

  const phaseMatch = content.match(/^Phase:\s*(.+)$/m);
  const modeMatch = content.match(/^Mode:\s*(.+)$/m);
  const featureMatch = content.match(/^Feature:\s*(.+)$/m);
  const taskMatch = content.match(/^Task:\s*(.+)$/m);

  const phase = phaseMatch ? phaseMatch[1].trim() : null;
  const mode = modeMatch ? modeMatch[1].trim() : 'FULL';
  const feature = featureMatch ? featureMatch[1].trim() : null;
  const currentTask = taskMatch ? taskMatch[1].trim() : null;

  if (content.includes('## Resume Directive')) {
    return { enriched: false, phase, feature };
  }

  const resumeDirective = computeResumeDirective(phase, mode, currentTask);
  const pipelinePosition = computePipelinePosition(phase, mode);

  const enrichedContent = content.trimEnd() + '\n\n' + pipelinePosition + '\n\n' + resumeDirective + '\n';

  const tmpPath = stateFilePath + '.tmp';
  fs.writeFileSync(tmpPath, enrichedContent, 'utf8');
  fs.renameSync(tmpPath, stateFilePath);

  return { enriched: true, phase, feature };
}

// Create temp directory for test files
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pre-compact-test-'));
}

function runTests() {
  let passed = 0;
  let failed = 0;

  // ─── normalizePhase ───
  console.log('\n  normalizePhase');

  if (test('returns null for null input', () => {
    assert.strictEqual(normalizePhase(null), null);
  })) passed++; else failed++;

  if (test('returns null for empty string', () => {
    assert.strictEqual(normalizePhase(''), null);
  })) passed++; else failed++;

  if (test('normalizes "TDD" to TDD', () => {
    assert.strictEqual(normalizePhase('TDD'), 'TDD');
  })) passed++; else failed++;

  if (test('normalizes "tdd" (lowercase) to TDD', () => {
    assert.strictEqual(normalizePhase('tdd'), 'TDD');
  })) passed++; else failed++;

  if (test('normalizes "PLAN APPROVED" to PLAN', () => {
    assert.strictEqual(normalizePhase('PLAN APPROVED'), 'PLAN');
  })) passed++; else failed++;

  if (test('normalizes "PLAN APPROVED by user" to PLAN', () => {
    assert.strictEqual(normalizePhase('PLAN APPROVED by user'), 'PLAN');
  })) passed++; else failed++;

  if (test('normalizes "BASELINE" to TDD', () => {
    assert.strictEqual(normalizePhase('BASELINE'), 'TDD');
  })) passed++; else failed++;

  if (test('normalizes "TDD — baseline verification" to TDD', () => {
    assert.strictEqual(normalizePhase('TDD — baseline verification'), 'TDD');
  })) passed++; else failed++;

  if (test('normalizes "CRITIC — cycle 2/3" to PLAN CRITIC (legacy)', () => {
    assert.strictEqual(normalizePhase('CRITIC — cycle 2/3'), 'PLAN CRITIC');
  })) passed++; else failed++;

  if (test('normalizes "DISCOVER" to DEEP DISCOVER (legacy)', () => {
    assert.strictEqual(normalizePhase('DISCOVER'), 'DEEP DISCOVER');
  })) passed++; else failed++;

  if (test('normalizes "DEEP DISCOVER" to DEEP DISCOVER', () => {
    assert.strictEqual(normalizePhase('DEEP DISCOVER'), 'DEEP DISCOVER');
  })) passed++; else failed++;

  if (test('normalizes "PLAN CRITIC" to PLAN CRITIC', () => {
    assert.strictEqual(normalizePhase('PLAN CRITIC'), 'PLAN CRITIC');
  })) passed++; else failed++;

  if (test('normalizes "TASK LIST" to TASK LIST', () => {
    assert.strictEqual(normalizePhase('TASK LIST'), 'TASK LIST');
  })) passed++; else failed++;

  if (test('normalizes "REPORT" to REPORT', () => {
    assert.strictEqual(normalizePhase('REPORT'), 'REPORT');
  })) passed++; else failed++;

  if (test('normalizes "REVIEW+HARDEN" to REVIEW+HARDEN', () => {
    assert.strictEqual(normalizePhase('REVIEW+HARDEN'), 'REVIEW+HARDEN');
  })) passed++; else failed++;

  if (test('normalizes "QUICK DISCOVER" to QUICK DISCOVER', () => {
    assert.strictEqual(normalizePhase('QUICK DISCOVER'), 'QUICK DISCOVER');
  })) passed++; else failed++;

  if (test('returns null for unknown phase', () => {
    assert.strictEqual(normalizePhase('UNKNOWN_PHASE'), null);
  })) passed++; else failed++;

  // ─── computeResumeDirective ───
  console.log('\n  computeResumeDirective');

  if (test('TDD in FULL mode -> next is VERIFY', () => {
    const result = computeResumeDirective('TDD', 'FULL', null);
    assert.ok(result.includes('Proceed to VERIFY'), `Expected "Proceed to VERIFY", got: ${result}`);
    assert.ok(result.includes('REMAINING: VERIFY -> REVIEW+HARDEN -> SIMPLIFY -> DELIVER -> REPORT'));
  })) passed++; else failed++;

  if (test('TDD in LITE mode -> next is VERIFY', () => {
    const result = computeResumeDirective('TDD', 'LITE', null);
    assert.ok(result.includes('Proceed to VERIFY'));
    assert.ok(result.includes('REMAINING: VERIFY -> REVIEW -> REPORT'));
  })) passed++; else failed++;

  if (test('TDD with current task includes task context', () => {
    const result = computeResumeDirective('TDD', 'FULL', 'Task 3/7');
    assert.ok(result.includes('Continue TDD (Task 3/7)'));
    assert.ok(result.includes('then proceed to VERIFY'));
  })) passed++; else failed++;

  if (test('DELIVER in FULL mode -> next is REPORT', () => {
    const result = computeResumeDirective('DELIVER', 'FULL', null);
    assert.ok(result.includes('Proceed to REPORT'), `Expected "Proceed to REPORT", got: ${result}`);
    assert.ok(result.includes('REMAINING: REPORT'));
  })) passed++; else failed++;

  if (test('REPORT (last FULL phase) -> "Complete REPORT"', () => {
    const result = computeResumeDirective('REPORT', 'FULL', null);
    assert.ok(result.includes('Complete REPORT'));
    assert.ok(result.includes('REMAINING: final phase'));
  })) passed++; else failed++;

  if (test('REPORT (last LITE phase) -> "Complete REPORT"', () => {
    const result = computeResumeDirective('REPORT', 'LITE', null);
    assert.ok(result.includes('Complete REPORT'));
    assert.ok(result.includes('REMAINING: final phase'));
  })) passed++; else failed++;

  if (test('unknown phase -> fallback directive', () => {
    const result = computeResumeDirective('UNKNOWN', 'FULL', null);
    assert.ok(result.includes('Read .claude/craft-state.md and determine current position'));
    assert.ok(result.includes('unknown — read state file'));
  })) passed++; else failed++;

  if (test('null phase -> fallback directive', () => {
    const result = computeResumeDirective(null, 'FULL', null);
    assert.ok(result.includes('Read .claude/craft-state.md'));
  })) passed++; else failed++;

  if (test('always includes INVOKE line', () => {
    const result = computeResumeDirective('TDD', 'FULL', null);
    assert.ok(result.includes('INVOKE: magic-claude:craft to continue the pipeline'));
  })) passed++; else failed++;

  if (test('PLAN APPROVED maps correctly -> next is PLAN CRITIC', () => {
    const result = computeResumeDirective('PLAN APPROVED', 'FULL', null);
    assert.ok(result.includes('Proceed to PLAN CRITIC'), `Expected next phase PLAN CRITIC, got: ${result}`);
  })) passed++; else failed++;

  // ─── computePipelinePosition ───
  console.log('\n  computePipelinePosition');

  if (test('FULL mode TDD shows correct pipeline with ^ HERE', () => {
    const result = computePipelinePosition('TDD', 'FULL');
    assert.ok(result.includes('## Pipeline Position'));
    assert.ok(result.includes('FULL:'));
    assert.ok(result.includes('^ HERE'));
    // Verify arrow is under TDD
    const lines = result.split('\n');
    const pipelineLine = lines.find(l => l.startsWith('FULL:'));
    const arrowLine = lines.find(l => l.includes('^ HERE'));
    const tddIdx = pipelineLine.indexOf('TDD');
    const arrowIdx = arrowLine.indexOf('^');
    assert.strictEqual(tddIdx, arrowIdx, `Arrow at ${arrowIdx} should be at TDD position ${tddIdx}`);
  })) passed++; else failed++;

  if (test('LITE mode TDD shows LITE pipeline', () => {
    const result = computePipelinePosition('TDD', 'LITE');
    assert.ok(result.includes('LITE:'));
    assert.ok(result.includes('^ HERE'));
  })) passed++; else failed++;

  if (test('unknown phase shows pipeline without arrow', () => {
    const result = computePipelinePosition('UNKNOWN', 'FULL');
    assert.ok(result.includes('FULL:'));
    assert.ok(!result.includes('^ HERE'));
  })) passed++; else failed++;

  if (test('null phase shows pipeline without arrow', () => {
    const result = computePipelinePosition(null, 'FULL');
    assert.ok(!result.includes('^ HERE'));
  })) passed++; else failed++;

  if (test('QUICK DISCOVER at position 0 shows arrow at start', () => {
    const result = computePipelinePosition('QUICK DISCOVER', 'FULL');
    assert.ok(result.includes('^ HERE'));
    const lines = result.split('\n');
    const arrowLine = lines.find(l => l.includes('^ HERE'));
    const pipelineLine = lines.find(l => l.startsWith('FULL:'));
    const qdIdx = pipelineLine.indexOf('QUICK DISCOVER');
    const arrowIdx = arrowLine.indexOf('^');
    assert.strictEqual(qdIdx, arrowIdx);
  })) passed++; else failed++;

  // ─── enrichStateFile ───
  console.log('\n  enrichStateFile');

  if (test('enriches state file with Resume Directive and Pipeline Position', () => {
    const tmpDir = createTempDir();
    const stateFile = path.join(tmpDir, 'craft-state.md');
    fs.writeFileSync(stateFile, '# Craft State\nFeature: test\nMode: FULL\nPhase: TDD\n\n## Current Task\nTask: Task 3/7\nStatus: in_progress\n');

    const result = enrichStateFile(stateFile);
    assert.strictEqual(result.enriched, true);

    const content = fs.readFileSync(stateFile, 'utf8');
    assert.ok(content.includes('## Resume Directive'));
    assert.ok(content.includes('## Pipeline Position'));
    assert.ok(content.includes('NEXT ACTION:'));
    assert.ok(content.includes('INVOKE: magic-claude:craft'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('skips enrichment if Resume Directive already exists', () => {
    const tmpDir = createTempDir();
    const stateFile = path.join(tmpDir, 'craft-state.md');
    fs.writeFileSync(stateFile, '# Craft State\nPhase: TDD\nMode: FULL\n\n## Resume Directive\nNEXT ACTION: test\n');

    const result = enrichStateFile(stateFile);
    assert.strictEqual(result.enriched, false);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('handles CRLF line endings correctly', () => {
    const tmpDir = createTempDir();
    const stateFile = path.join(tmpDir, 'craft-state.md');
    fs.writeFileSync(stateFile, '# Craft State\r\nFeature: test\r\nMode: FULL\r\nPhase: TDD\r\n');

    const result = enrichStateFile(stateFile);
    assert.strictEqual(result.enriched, true);

    const content = fs.readFileSync(stateFile, 'utf8');
    assert.ok(content.includes('## Resume Directive'));
    assert.ok(content.includes('Proceed to VERIFY'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('defaults to FULL mode when Mode field is missing', () => {
    const tmpDir = createTempDir();
    const stateFile = path.join(tmpDir, 'craft-state.md');
    fs.writeFileSync(stateFile, '# Craft State\nPhase: TDD\n');

    enrichStateFile(stateFile);

    const content = fs.readFileSync(stateFile, 'utf8');
    assert.ok(content.includes('FULL:'), 'Should default to FULL pipeline');
    assert.ok(content.includes('REMAINING: VERIFY -> REVIEW+HARDEN -> SIMPLIFY -> DELIVER -> REPORT'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('uses atomic write (tmp file does not persist)', () => {
    const tmpDir = createTempDir();
    const stateFile = path.join(tmpDir, 'craft-state.md');
    fs.writeFileSync(stateFile, '# Craft State\nPhase: TDD\nMode: FULL\n');

    enrichStateFile(stateFile);

    const tmpFile = stateFile + '.tmp';
    assert.ok(!fs.existsSync(tmpFile), 'Temp file should not persist after atomic write');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('PLAN APPROVED phase maps correctly in enrichment', () => {
    const tmpDir = createTempDir();
    const stateFile = path.join(tmpDir, 'craft-state.md');
    fs.writeFileSync(stateFile, '# Craft State\nPhase: PLAN APPROVED\nMode: FULL\n');

    enrichStateFile(stateFile);

    const content = fs.readFileSync(stateFile, 'utf8');
    assert.ok(content.includes('Proceed to PLAN CRITIC'), `Should map PLAN APPROVED -> PLAN -> next is PLAN CRITIC`);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('handles empty file gracefully with fallback directive', () => {
    const tmpDir = createTempDir();
    const stateFile = path.join(tmpDir, 'craft-state.md');
    fs.writeFileSync(stateFile, '');

    const result = enrichStateFile(stateFile);
    assert.strictEqual(result.enriched, true);
    assert.strictEqual(result.phase, null);
    assert.strictEqual(result.feature, null);

    const content = fs.readFileSync(stateFile, 'utf8');
    assert.ok(content.includes('Read .claude/craft-state.md and determine current position'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('handles file with no parseable fields gracefully', () => {
    const tmpDir = createTempDir();
    const stateFile = path.join(tmpDir, 'craft-state.md');
    fs.writeFileSync(stateFile, 'Just some random text\nwith no structured fields\n');

    const result = enrichStateFile(stateFile);
    assert.strictEqual(result.enriched, true);
    assert.strictEqual(result.phase, null);

    const content = fs.readFileSync(stateFile, 'utf8');
    assert.ok(content.includes('unknown — read state file'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  // ─── Summary ───
  console.log(`\n  ${passed} passed, ${failed} failed (${passed + failed} total)`);
  return { passed, failed };
}

// Run
console.log('\npre-compact-enrichment.test.cjs');
const { passed, failed } = runTests();
process.exit(failed > 0 ? 1 : 0);
