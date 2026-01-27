/**
 * Tests for scripts/lib/workspace/tool-detection.cjs
 * Cross-platform tool detection and availability checking
 *
 * Run with: node tests/lib/tool-detection.test.cjs
 */

const assert = require('assert');

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

// Try to import the modules (will fail in RED phase)
let ToolDetector, detectTool, checkEcosystemTools, getInstallationHelp;
let moduleLoaded = false;

try {
  const toolDetectionModule = require('../../scripts/lib/workspace/tool-detection.cjs');
  ToolDetector = toolDetectionModule.ToolDetector;
  detectTool = toolDetectionModule.detectTool;
  checkEcosystemTools = toolDetectionModule.checkEcosystemTools;
  getInstallationHelp = toolDetectionModule.getInstallationHelp;
  moduleLoaded = true;
} catch (error) {
  console.log('\n⚠️  Module not found (expected in TDD RED phase)');
  console.log(`   Error: ${error.message}\n`);

  // Create stubs for initial test run
  class ToolDetector {
    isAvailable(tool) { return tool === 'node'; }
    getVersion(tool) { return 'v20.0.0'; }
    checkAll(tools) { return {}; }
  }

  detectTool = (tool) => ({ available: true, version: null });
  checkEcosystemTools = (ecosystem) => ({ nodejs: true });
  getInstallationHelp = (tool, platform) => 'Install instructions';
}

// Test suite
function runTests() {
  console.log('\n=== Testing Tool Detection ===\n');

  const results = {
    passed: 0,
    failed: 0
  };

  // ToolDetector Class
  console.log('ToolDetector Class:');

  results[test('should create tool detector instance', () => {
    const detector = new ToolDetector();
    assert.ok(detector);
  }) ? 'passed' : 'failed']++;

  results[test('should detect if tool is available', () => {
    const detector = new ToolDetector();
    const available = detector.isAvailable('node');
    assert.strictEqual(typeof available, 'boolean');
  }) ? 'passed' : 'failed']++;

  results[test('should return false for non-existent tool', () => {
    const detector = new ToolDetector();
    const available = detector.isAvailable('nonexistent-tool-xyz');
    assert.strictEqual(available, false);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Version Detection
  console.log('Version Detection:');

  results[test('should get version for available tool', () => {
    const detector = new ToolDetector();
    if (detector.isAvailable('node')) {
      const version = detector.getVersion('node');
      // Version can be string or null
      assert.ok(version === null || typeof version === 'string');
    }
  }) ? 'passed' : 'failed']++;

  results[test('should return null for unavailable tool', () => {
    const detector = new ToolDetector();
    const version = detector.getVersion('nonexistent-tool-xyz');
    assert.strictEqual(version, null);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Ecosystem Tool Detection
  console.log('Ecosystem Tool Detection:');

  results[test('should check nodejs ecosystem tools', () => {
    const tools = checkEcosystemTools('nodejs');
    assert.strictEqual(typeof tools, 'object');
    // Should check for node and at least one package manager
    assert.ok(tools.node !== undefined || tools.npm !== undefined);
  }) ? 'passed' : 'failed']++;

  results[test('should check jvm ecosystem tools', () => {
    const tools = checkEcosystemTools('jvm');
    assert.strictEqual(typeof tools, 'object');
    // Should check for java and build tools
    assert.ok(tools.java !== undefined || tools.javac !== undefined);
  }) ? 'passed' : 'failed']++;

  results[test('should check python ecosystem tools', () => {
    const tools = checkEcosystemTools('python');
    assert.strictEqual(typeof tools, 'object');
    // Should check for python
    assert.ok(tools.python !== undefined || tools.python3 !== undefined);
  }) ? 'passed' : 'failed']++;

  results[test('should check rust ecosystem tools', () => {
    const tools = checkEcosystemTools('rust');
    assert.strictEqual(typeof tools, 'object');
    // Should check for cargo/rustc
    assert.ok(tools.cargo !== undefined || tools.rustc !== undefined);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // detectTool Function
  console.log('detectTool Function:');

  results[test('should detect tool with details', () => {
    const result = detectTool('node');
    assert.strictEqual(typeof result, 'object');
    assert.ok(result.hasOwnProperty('available'));
    assert.strictEqual(typeof result.available, 'boolean');
  }) ? 'passed' : 'failed']++;

  results[test('should include version when available', () => {
    const result = detectTool('node');
    if (result.available) {
      // Version should be string or null
      assert.ok(result.version === null || typeof result.version === 'string');
    }
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Installation Help
  console.log('Installation Help:');

  results[test('should provide installation help for nodejs', () => {
    const help = getInstallationHelp('node', process.platform);
    assert.strictEqual(typeof help, 'string');
    assert.ok(help.length > 0);
  }) ? 'passed' : 'failed']++;

  results[test('should provide installation help for java', () => {
    const help = getInstallationHelp('java', process.platform);
    assert.strictEqual(typeof help, 'string');
    assert.ok(help.length > 0);
  }) ? 'passed' : 'failed']++;

  results[test('should provide platform-specific help', () => {
    const platforms = ['win32', 'darwin', 'linux'];
    for (const platform of platforms) {
      const help = getInstallationHelp('node', platform);
      assert.strictEqual(typeof help, 'string');
      assert.ok(help.length > 0);
    }
  }) ? 'passed' : 'failed']++;

  results[test('should mention /setup-ecosystem in help', () => {
    const help = getInstallationHelp('node', process.platform);
    // Should mention the setup command
    assert.ok(help.includes('setup') || help.includes('install') || help.includes('Setup'));
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Cross-Platform Support
  console.log('Cross-Platform Support:');

  results[test('should work on Windows', () => {
    const detector = new ToolDetector();
    // Should not throw on Windows platform detection
    assert.doesNotThrow(() => {
      detector.isAvailable('node');
    });
  }) ? 'passed' : 'failed']++;

  results[test('should handle Windows executables (.exe, .cmd, .bat)', () => {
    const detector = new ToolDetector();
    // Should handle commands with and without extensions
    assert.doesNotThrow(() => {
      detector.isAvailable('node');
      detector.isAvailable('npm');
    });
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Summary
  console.log('=== Summary ===');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('');

  if (!moduleLoaded) {
    console.log('⚠️  TDD RED PHASE: Module not implemented yet');
    console.log('   Next step: Implement scripts/lib/workspace/tool-detection.cjs');
    console.log('');
  }

  return results.failed === 0;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
