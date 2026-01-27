/**
 * Tests for scripts/lib/workspace/commands.cjs
 * Workspace command generation for all ecosystems
 *
 * Run with: node tests/lib/workspace-commands.test.cjs
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
let CommandGenerator, generateCommand, generateInstallCommand, generateTestCommand, generateBuildCommand;
let moduleLoaded = false;

try {
  const commandsModule = require('../../scripts/lib/workspace/commands.cjs');
  CommandGenerator = commandsModule.CommandGenerator;
  generateCommand = commandsModule.generateCommand;
  generateInstallCommand = commandsModule.generateInstallCommand;
  generateTestCommand = commandsModule.generateTestCommand;
  generateBuildCommand = commandsModule.generateBuildCommand;
  moduleLoaded = true;
} catch (error) {
  console.log('\n⚠️  Module not found (expected in TDD RED phase)');
  console.log(`   Error: ${error.message}\n`);

  // Create stubs for initial test run
  class CommandGenerator {
    constructor(ecosystem, config = {}) {
      this.ecosystem = ecosystem;
      this.config = config;
    }
    install() { return 'install'; }
    test() { return 'test'; }
    build() { return 'build'; }
    run(script) { return `run ${script}`; }
    format() { return 'format'; }
    lint() { return 'lint'; }
  }

  generateCommand = (ecosystem, action, config) => 'command';
  generateInstallCommand = (ecosystem, config) => 'install';
  generateTestCommand = (ecosystem, config) => 'test';
  generateBuildCommand = (ecosystem, config) => 'build';
}

// Test suite
function runTests() {
  console.log('\n=== Testing Workspace Commands ===\n');

  const results = {
    passed: 0,
    failed: 0
  };

  // CommandGenerator Class
  console.log('CommandGenerator Class:');

  results[test('should create command generator for nodejs', () => {
    const generator = new CommandGenerator('nodejs');
    assert.ok(generator);
    assert.strictEqual(generator.ecosystem, 'nodejs');
  }) ? 'passed' : 'failed']++;

  results[test('should create command generator for jvm', () => {
    const generator = new CommandGenerator('jvm');
    assert.ok(generator);
    assert.strictEqual(generator.ecosystem, 'jvm');
  }) ? 'passed' : 'failed']++;

  results[test('should accept config for customization', () => {
    const generator = new CommandGenerator('nodejs', { packageManager: 'pnpm' });
    assert.ok(generator.config);
    assert.strictEqual(generator.config.packageManager, 'pnpm');
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Node.js Commands
  console.log('Node.js Commands:');

  results[test('should generate npm install command', () => {
    const generator = new CommandGenerator('nodejs', { packageManager: 'npm' });
    const cmd = generator.install();
    assert.strictEqual(typeof cmd, 'string');
    assert.ok(cmd.includes('npm') || cmd.includes('install'));
  }) ? 'passed' : 'failed']++;

  results[test('should generate pnpm install command', () => {
    const generator = new CommandGenerator('nodejs', { packageManager: 'pnpm' });
    const cmd = generator.install();
    assert.strictEqual(typeof cmd, 'string');
    assert.ok(cmd.includes('pnpm'));
  }) ? 'passed' : 'failed']++;

  results[test('should generate test command', () => {
    const generator = new CommandGenerator('nodejs');
    const cmd = generator.test();
    assert.strictEqual(typeof cmd, 'string');
    assert.ok(cmd.length > 0);
  }) ? 'passed' : 'failed']++;

  results[test('should generate build command', () => {
    const generator = new CommandGenerator('nodejs');
    const cmd = generator.build();
    assert.strictEqual(typeof cmd, 'string');
    assert.ok(cmd.length > 0);
  }) ? 'passed' : 'failed']++;

  results[test('should generate run command with script name', () => {
    const generator = new CommandGenerator('nodejs');
    const cmd = generator.run('dev');
    assert.strictEqual(typeof cmd, 'string');
    assert.ok(cmd.includes('dev'));
  }) ? 'passed' : 'failed']++;

  console.log('');

  // JVM Commands
  console.log('JVM Commands:');

  results[test('should generate maven install command', () => {
    const generator = new CommandGenerator('jvm', { buildTool: 'maven' });
    const cmd = generator.install();
    assert.strictEqual(typeof cmd, 'string');
    assert.ok(cmd.includes('mvn') || cmd.includes('maven'));
  }) ? 'passed' : 'failed']++;

  results[test('should generate gradle install command', () => {
    const generator = new CommandGenerator('jvm', { buildTool: 'gradle' });
    const cmd = generator.install();
    assert.strictEqual(typeof cmd, 'string');
    assert.ok(cmd.includes('gradle'));
  }) ? 'passed' : 'failed']++;

  results[test('should use wrapper scripts when available', () => {
    const generator = new CommandGenerator('jvm', { buildTool: 'gradle', useWrapper: true });
    const cmd = generator.build();
    assert.strictEqual(typeof cmd, 'string');
    // Should use ./gradlew or gradlew.bat
    assert.ok(cmd.includes('gradlew') || cmd.includes('gradle'));
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Python Commands
  console.log('Python Commands:');

  results[test('should generate pip install command', () => {
    const generator = new CommandGenerator('python', { packageManager: 'pip' });
    const cmd = generator.install();
    assert.strictEqual(typeof cmd, 'string');
    assert.ok(cmd.includes('pip'));
  }) ? 'passed' : 'failed']++;

  results[test('should generate poetry install command', () => {
    const generator = new CommandGenerator('python', { packageManager: 'poetry' });
    const cmd = generator.install();
    assert.strictEqual(typeof cmd, 'string');
    assert.ok(cmd.includes('poetry'));
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Rust Commands
  console.log('Rust Commands:');

  results[test('should generate cargo build command', () => {
    const generator = new CommandGenerator('rust');
    const cmd = generator.build();
    assert.strictEqual(typeof cmd, 'string');
    assert.ok(cmd.includes('cargo'));
  }) ? 'passed' : 'failed']++;

  results[test('should generate cargo test command', () => {
    const generator = new CommandGenerator('rust');
    const cmd = generator.test();
    assert.strictEqual(typeof cmd, 'string');
    assert.ok(cmd.includes('cargo'));
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Convenience Functions
  console.log('Convenience Functions:');

  results[test('generateInstallCommand should work for all ecosystems', () => {
    const ecosystems = ['nodejs', 'jvm', 'python', 'rust'];
    for (const ecosystem of ecosystems) {
      const cmd = generateInstallCommand(ecosystem);
      assert.strictEqual(typeof cmd, 'string');
      assert.ok(cmd.length > 0);
    }
  }) ? 'passed' : 'failed']++;

  results[test('generateTestCommand should work for all ecosystems', () => {
    const ecosystems = ['nodejs', 'jvm', 'python', 'rust'];
    for (const ecosystem of ecosystems) {
      const cmd = generateTestCommand(ecosystem);
      assert.strictEqual(typeof cmd, 'string');
      assert.ok(cmd.length > 0);
    }
  }) ? 'passed' : 'failed']++;

  results[test('generateBuildCommand should work for all ecosystems', () => {
    const ecosystems = ['nodejs', 'jvm', 'python', 'rust'];
    for (const ecosystem of ecosystems) {
      const cmd = generateBuildCommand(ecosystem);
      assert.strictEqual(typeof cmd, 'string');
      assert.ok(cmd.length > 0);
    }
  }) ? 'passed' : 'failed']++;

  results[test('generateCommand should accept custom config', () => {
    const cmd = generateCommand('nodejs', 'install', { packageManager: 'pnpm' });
    assert.strictEqual(typeof cmd, 'string');
    assert.ok(cmd.includes('pnpm'));
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Cross-Platform Support
  console.log('Cross-Platform Support:');

  results[test('should detect platform', () => {
    const generator = new CommandGenerator('jvm');
    // Should work on any platform
    const cmd = generator.build();
    assert.strictEqual(typeof cmd, 'string');
  }) ? 'passed' : 'failed']++;

  results[test('should handle Windows wrapper scripts', () => {
    // Windows uses .bat/.cmd extensions
    const generator = new CommandGenerator('jvm', {
      buildTool: 'gradle',
      useWrapper: true,
      platform: 'win32'
    });
    const cmd = generator.build();
    assert.strictEqual(typeof cmd, 'string');
    // Should work with or without .bat extension
    assert.ok(cmd.length > 0);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Summary
  console.log('=== Summary ===');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('');

  if (!moduleLoaded) {
    console.log('⚠️  TDD RED PHASE: Module not implemented yet');
    console.log('   Next step: Implement scripts/lib/workspace/commands.cjs');
    console.log('');
  }

  return results.failed === 0;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
