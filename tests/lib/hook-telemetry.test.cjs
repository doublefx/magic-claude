/**
 * Tests for scripts/lib/hook-telemetry.cjs
 *
 * Run with: node tests/lib/hook-telemetry.test.cjs
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Test helper
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

// Create a temp dir for telemetry tests (avoid polluting real config)
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-telemetry-test-'));
const testTelemetryFile = path.join(tmpDir, 'hook-telemetry.jsonl');

// Override CLAUDE_CONFIG_DIR before loading the module
process.env.CLAUDE_CONFIG_DIR = tmpDir;

const { logTelemetry, withTelemetry, generateReport, TELEMETRY_FILE } = require('../../plugin/scripts/lib/hook-telemetry.cjs');

function runTests() {
  console.log('\n=== Testing hook-telemetry.cjs ===\n');

  let passed = 0;
  let failed = 0;

  // --- Module Exports ---
  console.log('Module Exports:');

  if (test('logTelemetry is a function', () => {
    assert.strictEqual(typeof logTelemetry, 'function');
  })) passed++; else failed++;

  if (test('withTelemetry is a function', () => {
    assert.strictEqual(typeof withTelemetry, 'function');
  })) passed++; else failed++;

  if (test('generateReport is a function', () => {
    assert.strictEqual(typeof generateReport, 'function');
  })) passed++; else failed++;

  if (test('TELEMETRY_FILE uses CLAUDE_CONFIG_DIR', () => {
    assert.ok(TELEMETRY_FILE.startsWith(tmpDir), `Expected ${TELEMETRY_FILE} to start with ${tmpDir}`);
    assert.ok(TELEMETRY_FILE.endsWith('hook-telemetry.jsonl'));
  })) passed++; else failed++;

  // --- logTelemetry ---
  console.log('\nlogTelemetry:');

  // Clean up before writing tests
  try { fs.unlinkSync(testTelemetryFile); } catch { /* ok */ }

  if (test('writes a JSONL line to file', () => {
    logTelemetry({ hook: 'test-hook', event: 'PostToolUse', outcome: 'fired', reason: 'test reason' });
    assert.ok(fs.existsSync(testTelemetryFile), 'Telemetry file should exist');
    const content = fs.readFileSync(testTelemetryFile, 'utf8').trim();
    const lines = content.split('\n');
    assert.strictEqual(lines.length, 1);
  })) passed++; else failed++;

  if (test('writes valid JSON per line', () => {
    const content = fs.readFileSync(testTelemetryFile, 'utf8').trim();
    const record = JSON.parse(content);
    assert.strictEqual(record.hook, 'test-hook');
    assert.strictEqual(record.event, 'PostToolUse');
    assert.strictEqual(record.outcome, 'fired');
    assert.strictEqual(record.reason, 'test reason');
  })) passed++; else failed++;

  if (test('includes timestamp (ts) field', () => {
    const content = fs.readFileSync(testTelemetryFile, 'utf8').trim();
    const record = JSON.parse(content);
    assert.ok(record.ts, 'Should have ts field');
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(record.ts), 'ts should be ISO format');
  })) passed++; else failed++;

  if (test('includes optional duration_ms when provided', () => {
    logTelemetry({ hook: 'test-hook', event: 'Stop', outcome: 'skipped', reason: 'test', duration_ms: 42 });
    const lines = fs.readFileSync(testTelemetryFile, 'utf8').trim().split('\n');
    const record = JSON.parse(lines[lines.length - 1]);
    assert.strictEqual(record.duration_ms, 42);
  })) passed++; else failed++;

  if (test('omits duration_ms when not provided', () => {
    const lines = fs.readFileSync(testTelemetryFile, 'utf8').trim().split('\n');
    const record = JSON.parse(lines[0]);
    assert.strictEqual(record.duration_ms, undefined);
  })) passed++; else failed++;

  if (test('includes file basename when provided', () => {
    logTelemetry({ hook: 'test-hook', event: 'PostToolUse', outcome: 'fired', reason: 'fmt', file: '/home/user/src/index.ts' });
    const lines = fs.readFileSync(testTelemetryFile, 'utf8').trim().split('\n');
    const record = JSON.parse(lines[lines.length - 1]);
    assert.strictEqual(record.file, 'index.ts');
  })) passed++; else failed++;

  if (test('includes tool when provided', () => {
    logTelemetry({ hook: 'test-hook', event: 'PostToolUse', outcome: 'fired', reason: 'ok', tool: 'Edit' });
    const lines = fs.readFileSync(testTelemetryFile, 'utf8').trim().split('\n');
    const record = JSON.parse(lines[lines.length - 1]);
    assert.strictEqual(record.tool, 'Edit');
  })) passed++; else failed++;

  if (test('defaults event to "unknown" when missing', () => {
    logTelemetry({ hook: 'test-hook', outcome: 'skipped', reason: 'no event' });
    const lines = fs.readFileSync(testTelemetryFile, 'utf8').trim().split('\n');
    const record = JSON.parse(lines[lines.length - 1]);
    assert.strictEqual(record.event, 'unknown');
  })) passed++; else failed++;

  if (test('defaults outcome to "unknown" when missing', () => {
    logTelemetry({ hook: 'test-hook', event: 'Stop', reason: 'no outcome' });
    const lines = fs.readFileSync(testTelemetryFile, 'utf8').trim().split('\n');
    const record = JSON.parse(lines[lines.length - 1]);
    assert.strictEqual(record.outcome, 'unknown');
  })) passed++; else failed++;

  if (test('appends multiple entries', () => {
    // Clean and write 3 entries
    fs.unlinkSync(testTelemetryFile);
    logTelemetry({ hook: 'h1', event: 'e1', outcome: 'fired', reason: 'r1' });
    logTelemetry({ hook: 'h2', event: 'e2', outcome: 'skipped', reason: 'r2' });
    logTelemetry({ hook: 'h3', event: 'e3', outcome: 'error', reason: 'r3' });
    const lines = fs.readFileSync(testTelemetryFile, 'utf8').trim().split('\n');
    assert.strictEqual(lines.length, 3);
    assert.strictEqual(JSON.parse(lines[0]).hook, 'h1');
    assert.strictEqual(JSON.parse(lines[1]).outcome, 'skipped');
    assert.strictEqual(JSON.parse(lines[2]).outcome, 'error');
  })) passed++; else failed++;

  // --- withTelemetry ---
  console.log('\nwithTelemetry:');

  if (test('wraps handler and logs telemetry from return value', () => {
    fs.unlinkSync(testTelemetryFile);
    const handler = () => ({ outcome: 'fired', reason: 'wrapped ok' });
    const wrapped = withTelemetry('wrap-test', 'PostToolUse', handler);
    wrapped({ tool_name: 'Edit', tool_input: { file_path: '/a/b.ts' } });
    const lines = fs.readFileSync(testTelemetryFile, 'utf8').trim().split('\n');
    assert.strictEqual(lines.length, 1);
    const record = JSON.parse(lines[0]);
    assert.strictEqual(record.hook, 'wrap-test');
    assert.strictEqual(record.event, 'PostToolUse');
    assert.strictEqual(record.outcome, 'fired');
    assert.strictEqual(record.reason, 'wrapped ok');
    assert.ok(record.duration_ms !== undefined);
  })) passed++; else failed++;

  if (test('logs "skipped" when handler returns nothing', () => {
    fs.unlinkSync(testTelemetryFile);
    const handler = () => {};
    const wrapped = withTelemetry('wrap-test', 'Stop', handler);
    wrapped({});
    const lines = fs.readFileSync(testTelemetryFile, 'utf8').trim().split('\n');
    const record = JSON.parse(lines[0]);
    assert.strictEqual(record.outcome, 'skipped');
    assert.strictEqual(record.reason, 'no return value');
  })) passed++; else failed++;

  if (test('logs "error" when handler throws', () => {
    fs.unlinkSync(testTelemetryFile);
    const handler = () => { throw new Error('boom'); };
    const wrapped = withTelemetry('wrap-test', 'PostToolUse', handler);
    assert.throws(() => wrapped({}), /boom/);
    const lines = fs.readFileSync(testTelemetryFile, 'utf8').trim().split('\n');
    const record = JSON.parse(lines[0]);
    assert.strictEqual(record.outcome, 'error');
    assert.strictEqual(record.reason, 'boom');
  })) passed++; else failed++;

  if (test('extracts file and tool from input', () => {
    fs.unlinkSync(testTelemetryFile);
    const handler = () => ({ outcome: 'fired', reason: 'ok' });
    const wrapped = withTelemetry('wrap-test', 'PostToolUse', handler);
    wrapped({ tool_name: 'Write', tool_input: { file_path: '/x/y/z.py' } });
    const lines = fs.readFileSync(testTelemetryFile, 'utf8').trim().split('\n');
    const record = JSON.parse(lines[0]);
    assert.strictEqual(record.tool, 'Write');
    assert.strictEqual(record.file, 'z.py');
  })) passed++; else failed++;

  // --- generateReport ---
  console.log('\ngenerateReport:');

  if (test('returns "no data" message when file does not exist', () => {
    try { fs.unlinkSync(testTelemetryFile); } catch { /* ok */ }
    const report = generateReport(7);
    assert.ok(report.includes('No telemetry data found'));
  })) passed++; else failed++;

  if (test('generates report from telemetry data', () => {
    // Write some test data
    const now = new Date().toISOString();
    const entries = [
      { ts: now, hook: 'formatter', event: 'PostToolUse', outcome: 'fired', reason: 'formatted', duration_ms: 100 },
      { ts: now, hook: 'formatter', event: 'PostToolUse', outcome: 'skipped', reason: 'no formatter', duration_ms: 5 },
      { ts: now, hook: 'formatter', event: 'PostToolUse', outcome: 'fired', reason: 'formatted', duration_ms: 80 },
      { ts: now, hook: 'checker', event: 'PostToolUse', outcome: 'skipped', reason: 'not .ts', duration_ms: 2 },
      { ts: now, hook: 'checker', event: 'PostToolUse', outcome: 'error', reason: 'crash', duration_ms: 10 },
    ];
    fs.writeFileSync(testTelemetryFile, entries.map(e => JSON.stringify(e)).join('\n') + '\n');

    const report = generateReport(1);
    assert.ok(report.includes('Hook Telemetry Report'), 'Should have title');
    assert.ok(report.includes('formatter'), 'Should list formatter hook');
    assert.ok(report.includes('checker'), 'Should list checker hook');
    assert.ok(report.includes('5 events'), 'Should count 5 events');
  })) passed++; else failed++;

  if (test('report shows fire rate', () => {
    const report = generateReport(1);
    // formatter: 2 fired out of 3 total = 67%
    assert.ok(report.includes('67%'), `Should show 67% fire rate, got:\n${report}`);
  })) passed++; else failed++;

  if (test('report shows never-fired hooks', () => {
    const report = generateReport(1);
    assert.ok(report.includes('Never fired') && report.includes('checker'), 'Should list checker as never fired');
  })) passed++; else failed++;

  if (test('report respects days filter', () => {
    // Write an old entry (8 days ago)
    const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const entries = [
      { ts: oldDate, hook: 'old-hook', event: 'Stop', outcome: 'fired', reason: 'old' },
    ];
    fs.writeFileSync(testTelemetryFile, entries.map(e => JSON.stringify(e)).join('\n') + '\n');
    const report = generateReport(7);
    assert.ok(report.includes('No telemetry data in the last 7'), 'Old entry should be filtered out');
  })) passed++; else failed++;

  if (test('report handles malformed lines gracefully', () => {
    fs.writeFileSync(testTelemetryFile, '{"ts":"' + new Date().toISOString() + '","hook":"ok","event":"Stop","outcome":"fired","reason":"ok"}\nnot json\n{"broken\n');
    const report = generateReport(1);
    assert.ok(report.includes('ok'), 'Should include valid entry');
    assert.ok(report.includes('1 events'), 'Should count only valid entry');
  })) passed++; else failed++;

  // --- File rotation ---
  console.log('\nFile Rotation:');

  if (test('rotates file when exceeding MAX_FILE_SIZE', () => {
    // Create a file just over 5MB
    const bigContent = 'x'.repeat(5 * 1024 * 1024 + 100);
    fs.writeFileSync(testTelemetryFile, bigContent);

    logTelemetry({ hook: 'rotation-test', event: 'Stop', outcome: 'fired', reason: 'trigger rotation' });

    // Original file should now have only the new entry
    const content = fs.readFileSync(testTelemetryFile, 'utf8').trim();
    const record = JSON.parse(content);
    assert.strictEqual(record.hook, 'rotation-test');

    // Rotated file should exist
    const rotatedFiles = fs.readdirSync(tmpDir).filter(f => f.match(/hook-telemetry\.\d+\.jsonl/));
    assert.ok(rotatedFiles.length > 0, 'Should have created a rotated file');
  })) passed++; else failed++;

  // --- Hook instrumentation verification ---
  console.log('\nHook Instrumentation:');

  const hooksDir = path.join(__dirname, '..', '..', 'plugin', 'scripts', 'hooks');
  const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.cjs') || f.endsWith('.js'));

  if (test('all hook scripts use telemetry (direct import or via wrapHookMain)', () => {
    const missing = [];
    for (const file of hookFiles) {
      const content = fs.readFileSync(path.join(hooksDir, file), 'utf8');
      const hasDirectImport = content.includes('logTelemetry');
      const usesWrapHookMain = content.includes('wrapHookMain');
      if (!hasDirectImport && !usesWrapHookMain) {
        missing.push(file);
      }
    }
    assert.strictEqual(missing.length, 0, `Hooks missing telemetry: ${missing.join(', ')}`);
  })) passed++; else failed++;

  if (test('CJS hooks using wrapHookMain do not need direct logTelemetry calls', () => {
    // wrapHookMain in hook-debug.cjs already calls logTelemetry
    const debugContent = fs.readFileSync(
      path.join(__dirname, '..', '..', 'plugin', 'scripts', 'lib', 'hook-debug.cjs'), 'utf8'
    );
    assert.ok(debugContent.includes('logTelemetry'), 'hook-debug.cjs should import logTelemetry');
    assert.ok(debugContent.includes("require('./hook-telemetry.cjs')"), 'hook-debug.cjs should require hook-telemetry');
  })) passed++; else failed++;

  if (test('ESM hook-utils.js re-exports logTelemetry', () => {
    const utilsContent = fs.readFileSync(
      path.join(__dirname, '..', '..', 'plugin', 'scripts', 'lib', 'hook-utils.js'), 'utf8'
    );
    assert.ok(utilsContent.includes('logTelemetry'), 'hook-utils.js should reference logTelemetry');
  })) passed++; else failed++;

  // --- Cleanup ---
  try {
    const files = fs.readdirSync(tmpDir);
    for (const f of files) {
      fs.unlinkSync(path.join(tmpDir, f));
    }
    fs.rmdirSync(tmpDir);
  } catch { /* ok */ }

  // Results
  console.log(`\n=== Test Results ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);

  if (failed > 0) process.exit(1);
}

runTests();
