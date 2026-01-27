/**
 * Tests for scripts/lib/ecosystems/ modules
 * Ecosystem registry and ecosystem-specific modules (Node.js, JVM, Python, Rust)
 *
 * Run with: node tests/lib/ecosystems.test.cjs
 */

const assert = require('assert');
const path = require('path');

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
let Ecosystem, getEcosystem, detectEcosystem, ECOSYSTEMS;
let moduleLoaded = false;

try {
  const ecosystemModule = require('../../scripts/lib/ecosystems/index.cjs');
  Ecosystem = ecosystemModule.Ecosystem;
  getEcosystem = ecosystemModule.getEcosystem;
  detectEcosystem = ecosystemModule.detectEcosystem;
  ECOSYSTEMS = ecosystemModule.ECOSYSTEMS;
  moduleLoaded = true;
} catch (error) {
  console.log('\n⚠️  Module not found (expected in TDD RED phase)');
  console.log(`   Error: ${error.message}\n`);

  // Create stubs for initial test run
  ECOSYSTEMS = {
    NODEJS: 'nodejs',
    JVM: 'jvm',
    PYTHON: 'python',
    RUST: 'rust',
    UNKNOWN: 'unknown'
  };

  class Ecosystem {
    constructor(type, config = {}) {
      this.type = type;
      this.config = config;
    }
    getType() { return this.type; }
    getName() { return 'Node.js'; }
    getIndicators() { return []; }
    getPackageManagerCommands() { return {}; }
    getBuildCommand() { return null; }
    getTestCommand() { return null; }
    getFormatCommand() { return null; }
    getLintCommand() { return null; }
  }

  getEcosystem = (type) => new Ecosystem(type);
  detectEcosystem = (dir) => ECOSYSTEMS.NODEJS;
}

// Test suite
function runTests() {
  console.log('\n=== Testing Ecosystem Modules ===\n');

  const results = {
    passed: 0,
    failed: 0
  };

  // ECOSYSTEMS Constants
  console.log('ECOSYSTEMS Constants:');

  results[test('should have all ecosystem types defined', () => {
    assert.ok(ECOSYSTEMS.NODEJS);
    assert.ok(ECOSYSTEMS.JVM);
    assert.ok(ECOSYSTEMS.PYTHON);
    assert.ok(ECOSYSTEMS.RUST);
    assert.ok(ECOSYSTEMS.UNKNOWN);
  }) ? 'passed' : 'failed']++;

  results[test('should use lowercase ecosystem names', () => {
    assert.strictEqual(ECOSYSTEMS.NODEJS, 'nodejs');
    assert.strictEqual(ECOSYSTEMS.JVM, 'jvm');
    assert.strictEqual(ECOSYSTEMS.PYTHON, 'python');
    assert.strictEqual(ECOSYSTEMS.RUST, 'rust');
    assert.strictEqual(ECOSYSTEMS.UNKNOWN, 'unknown');
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Ecosystem Class
  console.log('Ecosystem Class:');

  results[test('should create ecosystem instance', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    assert.ok(eco);
    assert.strictEqual(eco.type, ECOSYSTEMS.NODEJS);
  }) ? 'passed' : 'failed']++;

  results[test('should return ecosystem type', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    assert.strictEqual(eco.getType(), ECOSYSTEMS.NODEJS);
  }) ? 'passed' : 'failed']++;

  results[test('should return human-readable name', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const name = eco.getName();
    assert.strictEqual(typeof name, 'string');
    assert.ok(name.length > 0);
  }) ? 'passed' : 'failed']++;

  results[test('should return file indicators', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const indicators = eco.getIndicators();
    assert.ok(Array.isArray(indicators));
  }) ? 'passed' : 'failed']++;

  results[test('should return package manager commands', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const commands = eco.getPackageManagerCommands();
    assert.strictEqual(typeof commands, 'object');
  }) ? 'passed' : 'failed']++;

  results[test('should return build command', () => {
    const eco = getEcosystem(ECOSYSTEMS.JVM);
    const command = eco.getBuildCommand();
    assert.ok(command === null || typeof command === 'string');
  }) ? 'passed' : 'failed']++;

  results[test('should return test command', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const command = eco.getTestCommand();
    assert.ok(command === null || typeof command === 'string');
  }) ? 'passed' : 'failed']++;

  console.log('');

  // getEcosystem Factory
  console.log('getEcosystem Factory:');

  results[test('should return nodejs ecosystem', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    assert.ok(eco);
    assert.strictEqual(eco.getType(), ECOSYSTEMS.NODEJS);
  }) ? 'passed' : 'failed']++;

  results[test('should return jvm ecosystem', () => {
    const eco = getEcosystem(ECOSYSTEMS.JVM);
    assert.ok(eco);
    assert.strictEqual(eco.getType(), ECOSYSTEMS.JVM);
  }) ? 'passed' : 'failed']++;

  results[test('should return python ecosystem', () => {
    const eco = getEcosystem(ECOSYSTEMS.PYTHON);
    assert.ok(eco);
    assert.strictEqual(eco.getType(), ECOSYSTEMS.PYTHON);
  }) ? 'passed' : 'failed']++;

  results[test('should return rust ecosystem', () => {
    const eco = getEcosystem(ECOSYSTEMS.RUST);
    assert.ok(eco);
    assert.strictEqual(eco.getType(), ECOSYSTEMS.RUST);
  }) ? 'passed' : 'failed']++;

  results[test('should handle unknown ecosystem type', () => {
    const eco = getEcosystem('invalid');
    assert.ok(eco);
    assert.strictEqual(eco.getType(), ECOSYSTEMS.UNKNOWN);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // detectEcosystem Function
  console.log('detectEcosystem Function:');

  results[test('should detect ecosystem from directory', () => {
    const type = detectEcosystem(process.cwd());
    assert.strictEqual(typeof type, 'string');
    assert.ok(Object.values(ECOSYSTEMS).includes(type));
  }) ? 'passed' : 'failed']++;

  results[test('should return unknown for non-existent directory', () => {
    const type = detectEcosystem('/nonexistent/path/that/does/not/exist');
    assert.strictEqual(type, ECOSYSTEMS.UNKNOWN);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Node.js Ecosystem Specifics
  console.log('Node.js Ecosystem:');

  results[test('nodejs should have package.json indicator', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const indicators = eco.getIndicators();
    assert.ok(indicators.includes('package.json'));
  }) ? 'passed' : 'failed']++;

  results[test('nodejs should have npm commands', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const commands = eco.getPackageManagerCommands();
    assert.ok(commands.npm || commands.install);
  }) ? 'passed' : 'failed']++;

  results[test('nodejs should have test command', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const command = eco.getTestCommand();
    assert.ok(command);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // JVM Ecosystem Specifics
  console.log('JVM Ecosystem:');

  results[test('jvm should have pom.xml or build.gradle indicator', () => {
    const eco = getEcosystem(ECOSYSTEMS.JVM);
    const indicators = eco.getIndicators();
    assert.ok(indicators.includes('pom.xml') || indicators.includes('build.gradle'));
  }) ? 'passed' : 'failed']++;

  results[test('jvm should have maven or gradle commands', () => {
    const eco = getEcosystem(ECOSYSTEMS.JVM);
    const commands = eco.getPackageManagerCommands();
    // Should have build and test commands regardless of maven/gradle
    assert.ok(commands.build);
    assert.ok(commands.test);
  }) ? 'passed' : 'failed']++;

  results[test('jvm should have build command', () => {
    const eco = getEcosystem(ECOSYSTEMS.JVM);
    const command = eco.getBuildCommand();
    assert.ok(command);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Python Ecosystem Specifics
  console.log('Python Ecosystem:');

  results[test('python should have requirements.txt or pyproject.toml indicator', () => {
    const eco = getEcosystem(ECOSYSTEMS.PYTHON);
    const indicators = eco.getIndicators();
    assert.ok(
      indicators.includes('requirements.txt') ||
      indicators.includes('pyproject.toml')
    );
  }) ? 'passed' : 'failed']++;

  results[test('python should have pip or poetry commands', () => {
    const eco = getEcosystem(ECOSYSTEMS.PYTHON);
    const commands = eco.getPackageManagerCommands();
    // Should have install and test commands regardless of pip/poetry
    assert.ok(commands.install);
    assert.ok(commands.test);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Rust Ecosystem Specifics
  console.log('Rust Ecosystem:');

  results[test('rust should have Cargo.toml indicator', () => {
    const eco = getEcosystem(ECOSYSTEMS.RUST);
    const indicators = eco.getIndicators();
    assert.ok(indicators.includes('Cargo.toml'));
  }) ? 'passed' : 'failed']++;

  results[test('rust should have cargo commands', () => {
    const eco = getEcosystem(ECOSYSTEMS.RUST);
    const commands = eco.getPackageManagerCommands();
    assert.ok(commands.cargo || commands.build);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Summary
  console.log('=== Summary ===');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('');

  if (!moduleLoaded) {
    console.log('⚠️  TDD RED PHASE: Module not implemented yet');
    console.log('   Next step: Implement scripts/lib/ecosystems/');
    console.log('');
  }

  return results.failed === 0;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
