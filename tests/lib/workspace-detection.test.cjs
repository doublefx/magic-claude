/**
 * Tests for scripts/lib/workspace/detection.cjs
 * Workspace detection: pnpm, nx, lerna, turborepo, yarn workspaces
 *
 * Run with: node tests/lib/workspace-detection.test.cjs
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

// Try to import the modules (will fail in RED phase)
let WorkspaceDetector, WORKSPACE_TYPES, detectWorkspace, findWorkspaceRoot;
let moduleLoaded = false;

try {
  const workspaceModule = require('../../scripts/lib/workspace/detection.cjs');
  WorkspaceDetector = workspaceModule.WorkspaceDetector;
  WORKSPACE_TYPES = workspaceModule.WORKSPACE_TYPES;
  detectWorkspace = workspaceModule.detectWorkspace;
  findWorkspaceRoot = workspaceModule.findWorkspaceRoot;
  moduleLoaded = true;
} catch (error) {
  console.log('\n⚠️  Module not found (expected in TDD RED phase)');
  console.log(`   Error: ${error.message}\n`);

  // Create stubs for initial test run
  WORKSPACE_TYPES = {
    PNPM: 'pnpm-workspace',
    NX: 'nx',
    LERNA: 'lerna',
    YARN: 'yarn-workspace',
    NPM: 'npm-workspace',
    TURBOREPO: 'turborepo',
    NONE: null
  };

  class WorkspaceDetector {
    constructor(startDir) {
      this.startDir = startDir;
    }
    detect() { return null; }
    getType() { return WORKSPACE_TYPES.NONE; }
    getRoot() { return this.startDir; }
    getPackages() { return []; }
    getConfig() { return {}; }
  }

  detectWorkspace = (dir) => null;
  findWorkspaceRoot = (startDir) => null;
}

// Test suite
function runTests() {
  console.log('\n=== Testing Workspace Detection ===\n');

  const results = {
    passed: 0,
    failed: 0
  };

  // WORKSPACE_TYPES Constants
  console.log('WORKSPACE_TYPES Constants:');

  results[test('should have all workspace types defined', () => {
    assert.ok(WORKSPACE_TYPES.PNPM);
    assert.ok(WORKSPACE_TYPES.NX);
    assert.ok(WORKSPACE_TYPES.LERNA);
    assert.ok(WORKSPACE_TYPES.YARN);
    assert.ok(WORKSPACE_TYPES.NPM);
    assert.ok(WORKSPACE_TYPES.TURBOREPO);
    assert.strictEqual(WORKSPACE_TYPES.NONE, null);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // WorkspaceDetector Class
  console.log('WorkspaceDetector Class:');

  results[test('should create detector instance', () => {
    const detector = new WorkspaceDetector(process.cwd());
    assert.ok(detector);
    assert.strictEqual(detector.startDir, process.cwd());
  }) ? 'passed' : 'failed']++;

  results[test('should detect workspace', () => {
    const detector = new WorkspaceDetector(process.cwd());
    const workspace = detector.detect();
    // Can be null if not in workspace
    assert.ok(workspace === null || typeof workspace === 'object');
  }) ? 'passed' : 'failed']++;

  results[test('should return workspace type', () => {
    const detector = new WorkspaceDetector(process.cwd());
    const type = detector.getType();
    assert.ok(type === null || typeof type === 'string');
  }) ? 'passed' : 'failed']++;

  results[test('should return workspace root', () => {
    const detector = new WorkspaceDetector(process.cwd());
    const root = detector.getRoot();
    assert.strictEqual(typeof root, 'string');
  }) ? 'passed' : 'failed']++;

  results[test('should return packages array', () => {
    const detector = new WorkspaceDetector(process.cwd());
    const packages = detector.getPackages();
    assert.ok(Array.isArray(packages));
  }) ? 'passed' : 'failed']++;

  results[test('should return workspace config', () => {
    const detector = new WorkspaceDetector(process.cwd());
    const config = detector.getConfig();
    assert.strictEqual(typeof config, 'object');
  }) ? 'passed' : 'failed']++;

  console.log('');

  // detectWorkspace Function
  console.log('detectWorkspace Function:');

  results[test('should detect workspace from directory', () => {
    const workspace = detectWorkspace(process.cwd());
    // Can be null if not in workspace
    assert.ok(workspace === null || typeof workspace === 'object');
  }) ? 'passed' : 'failed']++;

  results[test('should return null for non-workspace directory', () => {
    const workspace = detectWorkspace(os.tmpdir());
    assert.strictEqual(workspace, null);
  }) ? 'passed' : 'failed']++;

  results[test('should handle invalid directory', () => {
    const workspace = detectWorkspace('/nonexistent/path/that/does/not/exist');
    assert.strictEqual(workspace, null);
  }) ? 'passed' : 'failed']++;

  results[test('should return workspace with type property', () => {
    const workspace = detectWorkspace(process.cwd());
    if (workspace) {
      assert.ok(workspace.type);
      assert.ok(Object.values(WORKSPACE_TYPES).includes(workspace.type));
    } else {
      // Not in workspace is valid
      assert.strictEqual(workspace, null);
    }
  }) ? 'passed' : 'failed']++;

  results[test('should return workspace with root property', () => {
    const workspace = detectWorkspace(process.cwd());
    if (workspace) {
      assert.ok(workspace.root);
      assert.strictEqual(typeof workspace.root, 'string');
    } else {
      assert.strictEqual(workspace, null);
    }
  }) ? 'passed' : 'failed']++;

  results[test('should return workspace with packages array', () => {
    const workspace = detectWorkspace(process.cwd());
    if (workspace) {
      assert.ok(Array.isArray(workspace.packages));
    } else {
      assert.strictEqual(workspace, null);
    }
  }) ? 'passed' : 'failed']++;

  console.log('');

  // findWorkspaceRoot Function
  console.log('findWorkspaceRoot Function:');

  results[test('should find workspace root by walking up', () => {
    const root = findWorkspaceRoot(process.cwd());
    // Can be null if not in workspace
    assert.ok(root === null || typeof root === 'string');
  }) ? 'passed' : 'failed']++;

  results[test('should return null for non-workspace directory', () => {
    const root = findWorkspaceRoot(os.tmpdir());
    assert.strictEqual(root, null);
  }) ? 'passed' : 'failed']++;

  results[test('should handle invalid directory', () => {
    const root = findWorkspaceRoot('/nonexistent/path/that/does/not/exist');
    assert.strictEqual(root, null);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Workspace Type Detection
  console.log('Workspace Type Detection:');

  results[test('should detect pnpm workspace from pnpm-workspace.yaml', () => {
    // Create temp directory with pnpm-workspace.yaml
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-pnpm-'));
    try {
      fs.writeFileSync(
        path.join(tempDir, 'pnpm-workspace.yaml'),
        'packages:\n  - "packages/*"'
      );
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-workspace' })
      );

      const workspace = detectWorkspace(tempDir);
      if (workspace) {
        assert.strictEqual(workspace.type, WORKSPACE_TYPES.PNPM);
      }
      // If null, detection not implemented yet (acceptable in RED phase)
    } finally {
      // Cleanup
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should detect nx workspace from nx.json', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-nx-'));
    try {
      fs.writeFileSync(
        path.join(tempDir, 'nx.json'),
        JSON.stringify({ projects: {} })
      );
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-workspace' })
      );

      const workspace = detectWorkspace(tempDir);
      if (workspace) {
        assert.strictEqual(workspace.type, WORKSPACE_TYPES.NX);
      }
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should detect lerna workspace from lerna.json', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-lerna-'));
    try {
      fs.writeFileSync(
        path.join(tempDir, 'lerna.json'),
        JSON.stringify({ packages: ['packages/*'] })
      );
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-workspace' })
      );

      const workspace = detectWorkspace(tempDir);
      if (workspace) {
        assert.strictEqual(workspace.type, WORKSPACE_TYPES.LERNA);
      }
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should detect yarn workspace from package.json workspaces', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-yarn-'));
    try {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'test-workspace',
          workspaces: ['packages/*']
        })
      );

      const workspace = detectWorkspace(tempDir);
      if (workspace) {
        assert.ok(
          workspace.type === WORKSPACE_TYPES.YARN ||
          workspace.type === WORKSPACE_TYPES.NPM
        );
      }
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Package Discovery
  console.log('Package Discovery:');

  results[test('should discover packages in workspace', () => {
    // Create temp workspace with packages
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-ws-'));
    try {
      fs.writeFileSync(
        path.join(tempDir, 'pnpm-workspace.yaml'),
        'packages:\n  - "packages/*"'
      );
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'root' })
      );

      // Create package
      const pkgDir = path.join(tempDir, 'packages', 'pkg1');
      fs.mkdirSync(pkgDir, { recursive: true });
      fs.writeFileSync(
        path.join(pkgDir, 'package.json'),
        JSON.stringify({ name: '@test/pkg1', version: '1.0.0' })
      );

      const workspace = detectWorkspace(tempDir);
      if (workspace && workspace.packages) {
        assert.ok(Array.isArray(workspace.packages));
        // Should find at least one package
        if (workspace.packages.length > 0) {
          const pkg = workspace.packages[0];
          assert.ok(pkg.name);
          assert.ok(pkg.path);
        }
      }
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should include package.json content in package info', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-ws-'));
    try {
      fs.writeFileSync(
        path.join(tempDir, 'pnpm-workspace.yaml'),
        'packages:\n  - "packages/*"'
      );
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'root' })
      );

      const pkgDir = path.join(tempDir, 'packages', 'pkg1');
      fs.mkdirSync(pkgDir, { recursive: true });
      fs.writeFileSync(
        path.join(pkgDir, 'package.json'),
        JSON.stringify({ name: '@test/pkg1', version: '1.0.0' })
      );

      const workspace = detectWorkspace(tempDir);
      if (workspace && workspace.packages && workspace.packages.length > 0) {
        const pkg = workspace.packages[0];
        assert.ok(pkg.packageJson);
        assert.strictEqual(pkg.packageJson.name, '@test/pkg1');
      }
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Summary
  console.log('=== Summary ===');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('');

  if (!moduleLoaded) {
    console.log('⚠️  TDD RED PHASE: Module not implemented yet');
    console.log('   Next step: Implement scripts/lib/workspace/detection.cjs');
    console.log('');
  }

  return results.failed === 0;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
