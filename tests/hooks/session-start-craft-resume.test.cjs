/**
 * Tests for session-start.cjs craft pipeline resume injection
 *
 * Tests the readCraftStateResume() function that extracts the Resume Directive
 * from craft-state.md and injects it into SessionStart additionalContext.
 *
 * Run with: node tests/hooks/session-start-craft-resume.test.cjs
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

const STATE_FILENAME = 'craft-state.md';
const LEGACY_STATE_FILENAME = 'orchestration-state.md';

/**
 * Re-implementation of readCraftStateResume from session-start.cjs for testing.
 * Takes an explicit base directory instead of using process.cwd().
 * Checks .claude/craft/craft-state.md first, falls back to legacy locations.
 */
function readCraftStateResume(baseDir) {
  const claudeDir = path.join(baseDir, '.claude');
  const craftDir = path.join(claudeDir, 'craft');

  let stateFilePath = path.join(craftDir, STATE_FILENAME);

  if (!fs.existsSync(stateFilePath)) {
    stateFilePath = path.join(claudeDir, STATE_FILENAME);
    if (!fs.existsSync(stateFilePath)) {
      stateFilePath = path.join(claudeDir, LEGACY_STATE_FILENAME);
      if (!fs.existsSync(stateFilePath)) {
        return null;
      }
    }
  }

  try {
    const rawContent = fs.readFileSync(stateFilePath, 'utf8');
    const content = rawContent.replace(/\r\n/g, '\n');

    const match = content.match(/## Resume Directive\n([\s\S]*?)(?=\n## |$)/);
    if (!match) return null;

    const resumeContent = match[1].trim();
    if (!resumeContent) return null;

    return resumeContent;
  } catch {
    return null;
  }
}

function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'session-start-test-'));
  const claudeDir = path.join(tmpDir, '.claude');
  const craftDir = path.join(claudeDir, 'craft');
  fs.mkdirSync(craftDir, { recursive: true });
  return tmpDir;
}

function runTests() {
  let passed = 0;
  let failed = 0;

  // ─── readCraftStateResume ───
  console.log('\n  readCraftStateResume');

  if (test('returns Resume Directive content from .claude/craft/craft-state.md', () => {
    const tmpDir = createTempProject();
    const stateFile = path.join(tmpDir, '.claude', 'craft', STATE_FILENAME);
    fs.writeFileSync(stateFile, [
      '# Craft State',
      'Feature: test feature',
      'Phase: TDD',
      'Mode: FULL',
      '',
      '## Resume Directive',
      'NEXT ACTION: Proceed to VERIFY',
      'REMAINING: VERIFY -> REVIEW+HARDEN -> SIMPLIFY -> DELIVER -> REPORT',
      'INVOKE: magic-claude:craft to continue the pipeline',
      '',
      '## Key Decisions',
      '| When | Decision | Rationale |',
      ''
    ].join('\n'));

    const result = readCraftStateResume(tmpDir);
    assert.ok(result, 'Should return non-null');
    assert.ok(result.includes('NEXT ACTION: Proceed to VERIFY'));
    assert.ok(result.includes('REMAINING: VERIFY'));
    assert.ok(result.includes('INVOKE: magic-claude:craft'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('returns null when no state file exists', () => {
    const tmpDir = createTempProject();
    const result = readCraftStateResume(tmpDir);
    assert.strictEqual(result, null);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('returns null when state file has no Resume Directive section', () => {
    const tmpDir = createTempProject();
    const stateFile = path.join(tmpDir, '.claude', 'craft', STATE_FILENAME);
    fs.writeFileSync(stateFile, '# Craft State\nFeature: test\nPhase: TDD\n');

    const result = readCraftStateResume(tmpDir);
    assert.strictEqual(result, null);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('falls back to legacy orchestration-state.md', () => {
    const tmpDir = createTempProject();
    const legacyFile = path.join(tmpDir, '.claude', LEGACY_STATE_FILENAME);
    fs.writeFileSync(legacyFile, [
      '# Orchestration State',
      'Phase: PLAN',
      '',
      '## Resume Directive',
      'NEXT ACTION: Proceed to PLAN CRITIC',
      'REMAINING: PLAN CRITIC -> TDD -> VERIFY',
      'INVOKE: magic-claude:craft to continue the pipeline',
      ''
    ].join('\n'));

    const result = readCraftStateResume(tmpDir);
    assert.ok(result, 'Should fall back to legacy file');
    assert.ok(result.includes('NEXT ACTION: Proceed to PLAN CRITIC'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('falls back to legacy .claude/craft-state.md', () => {
    const tmpDir = createTempProject();
    // Write to legacy .claude/craft-state.md (not .claude/craft/)
    const legacyCraftFile = path.join(tmpDir, '.claude', STATE_FILENAME);
    fs.writeFileSync(legacyCraftFile, '# State\n\n## Resume Directive\nNEXT ACTION: From legacy craft\nREMAINING: test\nINVOKE: craft\n');

    const result = readCraftStateResume(tmpDir);
    assert.ok(result.includes('From legacy craft'), 'Should fall back to .claude/craft-state.md');
  })) passed++; else failed++;

  if (test('prefers .claude/craft/craft-state.md over legacy locations', () => {
    const tmpDir = createTempProject();
    const craftFile = path.join(tmpDir, '.claude', 'craft', STATE_FILENAME);
    const legacyFile = path.join(tmpDir, '.claude', STATE_FILENAME);

    fs.writeFileSync(craftFile, '# Craft State\n\n## Resume Directive\nNEXT ACTION: From craft dir\nREMAINING: test\nINVOKE: craft\n');
    fs.writeFileSync(legacyFile, '# State\n\n## Resume Directive\nNEXT ACTION: From legacy\nREMAINING: test\nINVOKE: craft\n');

    const result = readCraftStateResume(tmpDir);
    assert.ok(result.includes('From craft dir'), 'Should prefer .claude/craft/craft-state.md');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('handles CRLF line endings', () => {
    const tmpDir = createTempProject();
    const stateFile = path.join(tmpDir, '.claude', 'craft', STATE_FILENAME);
    fs.writeFileSync(stateFile, '# Craft State\r\nPhase: TDD\r\n\r\n## Resume Directive\r\nNEXT ACTION: Proceed to VERIFY\r\nREMAINING: VERIFY\r\nINVOKE: magic-claude:craft\r\n');

    const result = readCraftStateResume(tmpDir);
    assert.ok(result, 'Should handle CRLF');
    assert.ok(result.includes('NEXT ACTION: Proceed to VERIFY'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('returns null when .claude directory does not exist', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'session-start-test-'));
    // Don't create .claude dir
    const result = readCraftStateResume(tmpDir);
    assert.strictEqual(result, null);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  if (test('extracts only Resume Directive section (stops at next ##)', () => {
    const tmpDir = createTempProject();
    const stateFile = path.join(tmpDir, '.claude', 'craft', STATE_FILENAME);
    fs.writeFileSync(stateFile, [
      '# Craft State',
      '',
      '## Resume Directive',
      'NEXT ACTION: test action',
      'REMAINING: test remaining',
      'INVOKE: magic-claude:craft',
      '',
      '## Key Decisions',
      '| When | Decision |',
      '| now | something |',
      ''
    ].join('\n'));

    const result = readCraftStateResume(tmpDir);
    assert.ok(result.includes('NEXT ACTION: test action'));
    assert.ok(!result.includes('Key Decisions'), 'Should not include next section');
    assert.ok(!result.includes('something'), 'Should not include content from next section');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  })) passed++; else failed++;

  // ─── Summary ───
  console.log(`\n  ${passed} passed, ${failed} failed (${passed + failed} total)`);
  return { passed, failed };
}

// Run
console.log('\nsession-start-craft-resume.test.cjs');
const { passed, failed } = runTests();
process.exit(failed > 0 ? 1 : 0);
