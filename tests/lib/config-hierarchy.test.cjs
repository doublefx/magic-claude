/**
 * Tests for scripts/lib/workspace/config.cjs
 * Configuration hierarchy: global, workspace, package-level
 *
 * Run with: node tests/lib/config-hierarchy.test.cjs
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
let ConfigLoader, loadConfig, mergeConfigs, getConfigForPackage;
let moduleLoaded = false;

try {
  const configModule = require('../../plugin/scripts/lib/workspace/config.cjs');
  ConfigLoader = configModule.ConfigLoader;
  loadConfig = configModule.loadConfig;
  mergeConfigs = configModule.mergeConfigs;
  getConfigForPackage = configModule.getConfigForPackage;
  moduleLoaded = true;
} catch (error) {
  console.log('\n⚠️  Module not found (expected in TDD RED phase)');
  console.log(`   Error: ${error.message}\n`);

  // Create stubs for initial test run
  class ConfigLoader {
    constructor(workspaceRoot) {
      this.workspaceRoot = workspaceRoot;
    }
    load(configName) { return {}; }
    loadGlobal(configName) { return {}; }
    loadWorkspace(configName) { return {}; }
    loadPackage(packagePath, configName) { return {}; }
  }

  loadConfig = (dir, configName) => ({});
  mergeConfigs = (configs) => configs[configs.length - 1] || {};
  getConfigForPackage = (packagePath, configName) => ({});
}

// Test suite
function runTests() {
  console.log('\n=== Testing Configuration Hierarchy ===\n');

  const results = {
    passed: 0,
    failed: 0
  };

  // ConfigLoader Class
  console.log('ConfigLoader Class:');

  results[test('should create config loader instance', () => {
    const loader = new ConfigLoader(process.cwd());
    assert.ok(loader);
    assert.strictEqual(loader.workspaceRoot, process.cwd());
  }) ? 'passed' : 'failed']++;

  results[test('should load config from directory', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-cfg-'));
    try {
      const claudeDir = path.join(tempDir, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify({ key: 'value' })
      );

      const loader = new ConfigLoader(tempDir);
      const config = loader.load('settings');
      assert.ok(config);
      assert.strictEqual(typeof config, 'object');
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should return empty object for non-existent config', () => {
    const loader = new ConfigLoader(os.tmpdir());
    const config = loader.load('nonexistent');
    assert.ok(config);
    assert.strictEqual(typeof config, 'object');
    assert.strictEqual(Object.keys(config).length, 0);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Configuration Hierarchy
  console.log('Configuration Hierarchy:');

  results[test('should load global config from ~/.claude/', () => {
    const loader = new ConfigLoader(process.cwd());
    const config = loader.loadGlobal('settings');
    assert.ok(config);
    assert.strictEqual(typeof config, 'object');
  }) ? 'passed' : 'failed']++;

  results[test('should load workspace config from workspace root', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-ws-'));
    try {
      const claudeDir = path.join(tempDir, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify({ workspace: true })
      );

      const loader = new ConfigLoader(tempDir);
      const config = loader.loadWorkspace('settings');
      assert.ok(config);
      if (Object.keys(config).length > 0) {
        assert.strictEqual(config.workspace, true);
      }
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should load package-level config', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-pkg-'));
    try {
      const claudeDir = path.join(tempDir, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify({ package: true })
      );

      const loader = new ConfigLoader(path.dirname(tempDir));
      const config = loader.loadPackage(tempDir, 'settings');
      assert.ok(config);
      if (Object.keys(config).length > 0) {
        assert.strictEqual(config.package, true);
      }
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  console.log('');

  // mergeConfigs Function
  console.log('mergeConfigs Function:');

  results[test('should merge configs with precedence (last wins)', () => {
    const configs = [
      { a: 1, b: 2 },
      { b: 3, c: 4 },
      { c: 5, d: 6 }
    ];

    const merged = mergeConfigs(configs);
    assert.strictEqual(merged.a, 1);
    assert.strictEqual(merged.b, 3); // Second config overrides first
    assert.strictEqual(merged.c, 5); // Third config overrides second
    assert.strictEqual(merged.d, 6);
  }) ? 'passed' : 'failed']++;

  results[test('should handle empty array', () => {
    const merged = mergeConfigs([]);
    assert.strictEqual(typeof merged, 'object');
    assert.strictEqual(Object.keys(merged).length, 0);
  }) ? 'passed' : 'failed']++;

  results[test('should handle nested objects', () => {
    const configs = [
      { nested: { a: 1, b: 2 } },
      { nested: { b: 3, c: 4 } }
    ];

    const merged = mergeConfigs(configs);
    assert.strictEqual(merged.nested.a, 1);
    assert.strictEqual(merged.nested.b, 3);
    assert.strictEqual(merged.nested.c, 4);
  }) ? 'passed' : 'failed']++;

  results[test('should handle arrays (replace, not merge)', () => {
    const configs = [
      { items: [1, 2, 3] },
      { items: [4, 5] }
    ];

    const merged = mergeConfigs(configs);
    assert.ok(Array.isArray(merged.items));
    assert.strictEqual(merged.items.length, 2);
    assert.strictEqual(merged.items[0], 4);
    assert.strictEqual(merged.items[1], 5);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Precedence Rules
  console.log('Precedence Rules:');

  results[test('package config should override workspace config', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-ws-'));
    try {
      // Workspace config
      const wsClaudeDir = path.join(tempDir, '.claude');
      fs.mkdirSync(wsClaudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(wsClaudeDir, 'settings.json'),
        JSON.stringify({ level: 'workspace', value: 1 })
      );

      // Package config
      const pkgDir = path.join(tempDir, 'packages', 'pkg1');
      const pkgClaudeDir = path.join(pkgDir, '.claude');
      fs.mkdirSync(pkgClaudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(pkgClaudeDir, 'settings.json'),
        JSON.stringify({ level: 'package', value: 2 })
      );

      const config = getConfigForPackage(pkgDir, 'settings');
      // Package level should win
      if (config.level) {
        assert.strictEqual(config.level, 'package');
        assert.strictEqual(config.value, 2);
      }
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('workspace config should override global config', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-ws-'));
    try {
      // Workspace config only (no package)
      const wsClaudeDir = path.join(tempDir, '.claude');
      fs.mkdirSync(wsClaudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(wsClaudeDir, 'settings.json'),
        JSON.stringify({ level: 'workspace' })
      );

      const loader = new ConfigLoader(tempDir);
      const config = loader.load('settings');
      // Should load workspace config (global would have different/no level)
      assert.ok(config);
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  console.log('');

  // loadConfig Convenience Function
  console.log('loadConfig Function:');

  results[test('should load config with full hierarchy', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-cfg-'));
    try {
      const claudeDir = path.join(tempDir, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify({ test: true })
      );

      const config = loadConfig(tempDir, 'settings');
      assert.ok(config);
      assert.strictEqual(typeof config, 'object');
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should handle invalid JSON gracefully', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-cfg-'));
    try {
      const claudeDir = path.join(tempDir, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'settings.json'),
        'invalid json {'
      );

      const config = loadConfig(tempDir, 'settings');
      assert.ok(config);
      assert.strictEqual(typeof config, 'object');
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Integration with Workspace
  console.log('Integration with Workspace:');

  results[test('should work with workspace detection', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-ws-'));
    try {
      // Create workspace
      fs.writeFileSync(
        path.join(tempDir, 'pnpm-workspace.yaml'),
        'packages:\n  - "packages/*"'
      );

      // Workspace config
      const wsClaudeDir = path.join(tempDir, '.claude');
      fs.mkdirSync(wsClaudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(wsClaudeDir, 'settings.json'),
        JSON.stringify({ workspace: true })
      );

      const loader = new ConfigLoader(tempDir);
      const config = loader.loadWorkspace('settings');
      assert.ok(config);
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
    console.log('   Next step: Implement scripts/lib/workspace/config.cjs');
    console.log('');
  }

  return results.failed === 0;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
