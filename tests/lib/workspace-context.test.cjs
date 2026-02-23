/**
 * Tests for scripts/lib/workspace-context.cjs
 * Central abstraction for monorepo/workspace operations
 *
 * Run with: node tests/lib/workspace-context.test.cjs
 */

const assert = require('assert');
const path = require('path');
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

// Try to import the module (will fail in RED phase)
let WorkspaceContext, getWorkspaceContext;
let moduleLoaded = false;

try {
  const module = require('../../scripts/lib/workspace-context.cjs');
  WorkspaceContext = module.WorkspaceContext;
  getWorkspaceContext = module.getWorkspaceContext;
  moduleLoaded = true;
} catch (error) {
  console.log('\n⚠️  Module not found (expected in TDD RED phase)');
  console.log(`   Error: ${error.message}\n`);

  // Create stub for initial test run
  WorkspaceContext = class {
    constructor(startDir = process.cwd()) {
      this.startDir = startDir;
    }
    isWorkspace() { return false; }
    getRoot() { return this.startDir; }
    getType() { return null; }
    getAllPackages() { return []; }
    findPackageForFile() { return null; }
    findPackageForDir() { return null; }
    getConfig() { return {}; }
    getPackageManager() { return { name: 'npm', ecosystem: 'nodejs' }; }
    getPackageManagerForFile() { return { name: 'npm', ecosystem: 'nodejs' }; }
    getEcosystem() { return 'nodejs'; }
    getLearnedSkillsDir() { return path.join(os.homedir(), '.claude', 'skills'); }
  };

  getWorkspaceContext = () => new WorkspaceContext();
}

// Test suite
function runTests() {
  console.log('\n=== Testing WorkspaceContext ===\n');

  const results = {
    passed: 0,
    failed: 0
  };

  // Constructor and Basic Properties
  console.log('Constructor and Basic Properties:');

  results[test('should create context from current directory', () => {
    const context = new WorkspaceContext();
    assert.ok(context);
    assert.strictEqual(typeof context.startDir, 'string');
  }) ? 'passed' : 'failed']++;

  results[test('should create context from specified directory', () => {
    const testDir = '/tmp/test-workspace';
    const context = new WorkspaceContext(testDir);
    assert.strictEqual(context.startDir, testDir);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Workspace Detection - Single Project
  console.log('Workspace Detection - Single Project:');

  results[test('should return boolean for isWorkspace()', () => {
    const context = new WorkspaceContext(__dirname);
    assert.strictEqual(typeof context.isWorkspace(), 'boolean');
  }) ? 'passed' : 'failed']++;

  results[test('should return startDir as root when not in workspace', () => {
    const testDir = os.tmpdir();
    const context = new WorkspaceContext(testDir);
    if (!context.isWorkspace()) {
      assert.strictEqual(context.getRoot(), testDir);
    } else {
      // If it is a workspace, getRoot should return a string
      assert.strictEqual(typeof context.getRoot(), 'string');
    }
  }) ? 'passed' : 'failed']++;

  results[test('should return null for getType() when not in workspace', () => {
    const testDir = os.tmpdir();
    const context = new WorkspaceContext(testDir);
    if (!context.isWorkspace()) {
      assert.strictEqual(context.getType(), null);
    }
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Package Operations
  console.log('Package Operations:');

  results[test('should return empty array for getAllPackages() when not in workspace', () => {
    const testDir = os.tmpdir();
    const context = new WorkspaceContext(testDir);
    if (!context.isWorkspace()) {
      const packages = context.getAllPackages();
      assert.ok(Array.isArray(packages));
      assert.strictEqual(packages.length, 0);
    }
  }) ? 'passed' : 'failed']++;

  results[test('should return null for findPackageForFile() when not in workspace', () => {
    const testDir = os.tmpdir();
    const context = new WorkspaceContext(testDir);
    if (!context.isWorkspace()) {
      const pkg = context.findPackageForFile('/some/file.js');
      assert.strictEqual(pkg, null);
    }
  }) ? 'passed' : 'failed']++;

  results[test('should return null for findPackageForDir() when not in workspace', () => {
    const testDir = os.tmpdir();
    const context = new WorkspaceContext(testDir);
    if (!context.isWorkspace()) {
      const pkg = context.findPackageForDir('/some/dir');
      assert.strictEqual(pkg, null);
    }
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Configuration
  console.log('Configuration:');

  results[test('should return config object from getConfig()', () => {
    const context = new WorkspaceContext(__dirname);
    const config = context.getConfig();
    assert.ok(config);
    assert.strictEqual(typeof config, 'object');
  }) ? 'passed' : 'failed']++;

  results[test('should support scope parameter in getConfig()', () => {
    const context = new WorkspaceContext(__dirname);
    const globalConfig = context.getConfig('global');
    const currentConfig = context.getConfig('current');

    assert.ok(globalConfig);
    assert.ok(currentConfig);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Package Manager Resolution
  console.log('Package Manager Resolution:');

  results[test('should return package manager info from getPackageManager()', () => {
    const context = new WorkspaceContext(__dirname);
    const pm = context.getPackageManager();

    assert.ok(pm);
    assert.ok(pm.name);
    assert.ok(pm.ecosystem);
  }) ? 'passed' : 'failed']++;

  results[test('should return package manager for file path', () => {
    const context = new WorkspaceContext(__dirname);
    const filePath = path.join(__dirname, 'test-file.js');
    const pm = context.getPackageManagerForFile(filePath);

    assert.ok(pm);
    assert.ok(pm.name);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Ecosystem Detection
  console.log('Ecosystem Detection:');

  results[test('should return ecosystem string', () => {
    const context = new WorkspaceContext(__dirname);
    const ecosystem = context.getEcosystem();

    assert.ok(ecosystem);
    assert.strictEqual(typeof ecosystem, 'string');
  }) ? 'passed' : 'failed']++;

  results[test('should return valid ecosystem type', () => {
    const context = new WorkspaceContext(__dirname);
    const ecosystem = context.getEcosystem();

    const validEcosystems = ['nodejs', 'jvm', 'python', 'rust', 'unknown'];
    assert.ok(validEcosystems.includes(ecosystem), `Invalid ecosystem: ${ecosystem}`);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Learned Skills Directory
  console.log('Learned Skills Directory:');

  results[test('should return learned skills directory path', () => {
    const context = new WorkspaceContext(__dirname);
    const skillsDir = context.getLearnedSkillsDir();

    assert.ok(skillsDir);
    assert.strictEqual(typeof skillsDir, 'string');
    assert.ok(skillsDir.includes('skills'), `Skills dir should contain "skills": ${skillsDir}`);
  }) ? 'passed' : 'failed']++;

  results[test('should support scope parameter for learned skills', () => {
    const context = new WorkspaceContext(__dirname);
    const workspaceDir = context.getLearnedSkillsDir('workspace');
    const userDir = context.getLearnedSkillsDir('user');

    assert.ok(workspaceDir);
    assert.ok(userDir);
    // User dir should be in home directory
    assert.ok(userDir.includes('.claude'), `User dir should contain .claude: ${userDir}`);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Singleton Pattern
  console.log('Singleton Pattern:');

  results[test('should return same instance from getWorkspaceContext()', () => {
    const context1 = getWorkspaceContext();
    const context2 = getWorkspaceContext();

    assert.strictEqual(context1, context2);
  }) ? 'passed' : 'failed']++;

  results[test('should create new instance with refresh flag', () => {
    const context1 = getWorkspaceContext();
    const context2 = getWorkspaceContext(true); // refresh

    // They should be different instances after refresh
    assert.notStrictEqual(context1, context2);

    // But subsequent calls should return the new instance
    const context3 = getWorkspaceContext();
    assert.strictEqual(context2, context3);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Error Handling
  console.log('Error Handling:');

  results[test('should not throw on invalid directory', () => {
    assert.doesNotThrow(() => {
      new WorkspaceContext('/nonexistent/directory/that/does/not/exist');
    });
  }) ? 'passed' : 'failed']++;

  results[test('should handle null/undefined startDir gracefully', () => {
    assert.doesNotThrow(() => {
      new WorkspaceContext(null);
      new WorkspaceContext(undefined);
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
    console.log('   Next step: Implement scripts/lib/workspace-context.cjs');
    console.log('');
  }

  return results.failed === 0;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
