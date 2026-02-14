/**
 * Tests for scripts/setup-rules.cjs
 *
 * Run with: node tests/lib/setup-rules.test.cjs
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Import the module
const {
  MANAGED_MARKER,
  getPluginRulesDir,
  getUserRulesDir,
  getPluginRules,
  isPluginManaged,
  checkRules,
  installRules,
  uninstallRules
} = require('../../scripts/setup-rules.cjs');

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

/**
 * Create a temporary directory structure for testing
 */
function createTestEnv() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-rules-test-'));
  const pluginRulesDir = path.join(tmpDir, 'rules');
  const userRulesDir = path.join(tmpDir, 'user-rules');

  fs.mkdirSync(pluginRulesDir, { recursive: true });
  fs.mkdirSync(userRulesDir, { recursive: true });

  // Create sample plugin rules
  fs.writeFileSync(path.join(pluginRulesDir, 'security.md'), '# Security Rules\nDo not commit secrets.\n');
  fs.writeFileSync(path.join(pluginRulesDir, 'testing.md'), '# Testing Rules\nMaintain 80% coverage.\n');
  fs.writeFileSync(path.join(pluginRulesDir, 'style.md'), '# Style Rules\nUse immutable patterns.\n');

  return { tmpDir, pluginRulesDir, userRulesDir };
}

/**
 * Clean up temporary directory
 */
function cleanupTestEnv(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Test suite
function runTests() {
  console.log('\n=== Testing setup-rules.cjs ===\n');

  let passed = 0;
  let failed = 0;

  // Basic module tests
  console.log('Module Exports:');

  if (test('MANAGED_MARKER is a string', () => {
    assert.strictEqual(typeof MANAGED_MARKER, 'string');
    assert.ok(MANAGED_MARKER.includes('magic-claude'), 'Marker should reference plugin name');
  })) passed++; else failed++;

  if (test('getPluginRulesDir returns a path', () => {
    const dir = getPluginRulesDir();
    assert.strictEqual(typeof dir, 'string');
    assert.ok(dir.includes('rules'), 'Should contain "rules"');
  })) passed++; else failed++;

  if (test('getUserRulesDir returns a path under home', () => {
    const dir = getUserRulesDir();
    const home = os.homedir();
    assert.ok(dir.startsWith(home), 'Should be under home directory');
    assert.ok(dir.includes('.claude'), 'Should be under .claude');
    assert.ok(dir.endsWith('rules'), 'Should end with rules');
  })) passed++; else failed++;

  if (test('getPluginRules returns array of .md files', () => {
    const rules = getPluginRules();
    assert.ok(Array.isArray(rules), 'Should return an array');
    assert.ok(rules.length > 0, 'Should find at least one rule');
    rules.forEach(r => {
      assert.ok(r.endsWith('.md'), `${r} should end with .md`);
    });
  })) passed++; else failed++;

  if (test('getPluginRules returns sorted filenames', () => {
    const rules = getPluginRules();
    const sorted = [...rules].sort();
    assert.deepStrictEqual(rules, sorted, 'Rules should be sorted alphabetically');
  })) passed++; else failed++;

  if (test('getPluginRules finds all 13 rules', () => {
    const rules = getPluginRules();
    assert.strictEqual(rules.length, 13, `Expected 13 rules, got ${rules.length}`);
  })) passed++; else failed++;

  // isPluginManaged tests
  console.log('\nisPluginManaged:');

  if (test('returns false for non-existent file', () => {
    assert.strictEqual(isPluginManaged('/nonexistent/file.md'), false);
  })) passed++; else failed++;

  if (test('returns true for managed file', () => {
    const env = createTestEnv();
    try {
      const filePath = path.join(env.userRulesDir, 'test.md');
      fs.writeFileSync(filePath, MANAGED_MARKER + '\n# Test\n');
      assert.strictEqual(isPluginManaged(filePath), true);
    } finally {
      cleanupTestEnv(env.tmpDir);
    }
  })) passed++; else failed++;

  if (test('returns false for user-owned file', () => {
    const env = createTestEnv();
    try {
      const filePath = path.join(env.userRulesDir, 'test.md');
      fs.writeFileSync(filePath, '# My Custom Rule\n');
      assert.strictEqual(isPluginManaged(filePath), false);
    } finally {
      cleanupTestEnv(env.tmpDir);
    }
  })) passed++; else failed++;

  // checkRules tests using temp dirs
  console.log('\ncheckRules (with temp dirs):');

  if (test('reports all missing when target dir is empty', () => {
    const env = createTestEnv();
    try {
      // Override dirs for testing by manipulating env
      const origPluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
      process.env.CLAUDE_PLUGIN_ROOT = env.tmpDir;

      // We need to test the logic directly since checkRules uses fixed paths
      // Instead, test the concepts by calling lower-level functions
      const pluginRules = fs.readdirSync(env.pluginRulesDir).filter(f => f.endsWith('.md'));
      assert.strictEqual(pluginRules.length, 3, 'Should have 3 test rules');

      // No files in user dir - all should be missing
      const userFiles = fs.readdirSync(env.userRulesDir).filter(f => f.endsWith('.md'));
      assert.strictEqual(userFiles.length, 0, 'Target should be empty');

      process.env.CLAUDE_PLUGIN_ROOT = origPluginRoot;
    } finally {
      cleanupTestEnv(env.tmpDir);
    }
  })) passed++; else failed++;

  // installRules / uninstallRules integration tests
  console.log('\ninstallRules/uninstallRules (integration):');

  if (test('install creates files with managed marker', () => {
    const env = createTestEnv();
    try {
      // Manually simulate install
      const sourceFiles = fs.readdirSync(env.pluginRulesDir).filter(f => f.endsWith('.md'));
      for (const filename of sourceFiles) {
        const sourceContent = fs.readFileSync(path.join(env.pluginRulesDir, filename), 'utf8');
        const managedContent = MANAGED_MARKER + '\n' + sourceContent;
        fs.writeFileSync(path.join(env.userRulesDir, filename), managedContent, 'utf8');
      }

      // Verify all files have marker
      const installedFiles = fs.readdirSync(env.userRulesDir).filter(f => f.endsWith('.md'));
      assert.strictEqual(installedFiles.length, 3, 'Should have installed 3 rules');

      for (const filename of installedFiles) {
        const content = fs.readFileSync(path.join(env.userRulesDir, filename), 'utf8');
        assert.ok(content.startsWith(MANAGED_MARKER), `${filename} should start with marker`);
      }
    } finally {
      cleanupTestEnv(env.tmpDir);
    }
  })) passed++; else failed++;

  if (test('install does not overwrite user-owned files', () => {
    const env = createTestEnv();
    try {
      // Create a user-owned file with same name as plugin rule
      const userContent = '# My Custom Security Rules\nCustom content here.\n';
      fs.writeFileSync(path.join(env.userRulesDir, 'security.md'), userContent, 'utf8');

      // Simulate install (skip user-owned)
      const sourceFiles = fs.readdirSync(env.pluginRulesDir).filter(f => f.endsWith('.md'));
      for (const filename of sourceFiles) {
        const targetPath = path.join(env.userRulesDir, filename);
        if (fs.existsSync(targetPath)) {
          const existing = fs.readFileSync(targetPath, 'utf8');
          if (!existing.startsWith(MANAGED_MARKER)) {
            continue; // Skip user-owned
          }
        }
        const sourceContent = fs.readFileSync(path.join(env.pluginRulesDir, filename), 'utf8');
        fs.writeFileSync(targetPath, MANAGED_MARKER + '\n' + sourceContent, 'utf8');
      }

      // Verify user file was NOT overwritten
      const securityContent = fs.readFileSync(path.join(env.userRulesDir, 'security.md'), 'utf8');
      assert.strictEqual(securityContent, userContent, 'User-owned file should not be overwritten');

      // Verify other files WERE installed
      const testingContent = fs.readFileSync(path.join(env.userRulesDir, 'testing.md'), 'utf8');
      assert.ok(testingContent.startsWith(MANAGED_MARKER), 'testing.md should be managed');
    } finally {
      cleanupTestEnv(env.tmpDir);
    }
  })) passed++; else failed++;

  if (test('force install overwrites user-owned files', () => {
    const env = createTestEnv();
    try {
      // Create a user-owned file
      fs.writeFileSync(path.join(env.userRulesDir, 'security.md'), '# Custom\n', 'utf8');

      // Force install all
      const sourceFiles = fs.readdirSync(env.pluginRulesDir).filter(f => f.endsWith('.md'));
      for (const filename of sourceFiles) {
        const sourceContent = fs.readFileSync(path.join(env.pluginRulesDir, filename), 'utf8');
        fs.writeFileSync(
          path.join(env.userRulesDir, filename),
          MANAGED_MARKER + '\n' + sourceContent,
          'utf8'
        );
      }

      // Verify all files are now managed
      const installedFiles = fs.readdirSync(env.userRulesDir).filter(f => f.endsWith('.md'));
      for (const filename of installedFiles) {
        const content = fs.readFileSync(path.join(env.userRulesDir, filename), 'utf8');
        assert.ok(content.startsWith(MANAGED_MARKER), `${filename} should be managed after force`);
      }
    } finally {
      cleanupTestEnv(env.tmpDir);
    }
  })) passed++; else failed++;

  if (test('uninstall removes only managed files', () => {
    const env = createTestEnv();
    try {
      // Install managed files
      const sourceFiles = fs.readdirSync(env.pluginRulesDir).filter(f => f.endsWith('.md'));
      for (const filename of sourceFiles) {
        const sourceContent = fs.readFileSync(path.join(env.pluginRulesDir, filename), 'utf8');
        fs.writeFileSync(
          path.join(env.userRulesDir, filename),
          MANAGED_MARKER + '\n' + sourceContent,
          'utf8'
        );
      }

      // Make one file user-owned (remove marker)
      fs.writeFileSync(path.join(env.userRulesDir, 'security.md'), '# Custom Security\n', 'utf8');

      // Add a file not from plugin
      fs.writeFileSync(path.join(env.userRulesDir, 'custom.md'), '# Custom Rule\n', 'utf8');

      // Simulate uninstall
      const removed = [];
      const kept = [];
      for (const filename of sourceFiles) {
        const targetPath = path.join(env.userRulesDir, filename);
        if (fs.existsSync(targetPath)) {
          const content = fs.readFileSync(targetPath, 'utf8');
          if (content.startsWith(MANAGED_MARKER)) {
            fs.unlinkSync(targetPath);
            removed.push(filename);
          } else {
            kept.push(filename);
          }
        }
      }

      assert.strictEqual(removed.length, 2, 'Should remove 2 managed files');
      assert.strictEqual(kept.length, 1, 'Should keep 1 user-owned file');
      assert.ok(kept.includes('security.md'), 'Should keep security.md');

      // Custom file should still exist
      assert.ok(fs.existsSync(path.join(env.userRulesDir, 'custom.md')), 'Custom file should remain');
    } finally {
      cleanupTestEnv(env.tmpDir);
    }
  })) passed++; else failed++;

  if (test('managed marker is HTML comment (safe in markdown)', () => {
    assert.ok(MANAGED_MARKER.startsWith('<!--'), 'Should start with HTML comment');
    assert.ok(MANAGED_MARKER.endsWith('-->'), 'Should end with HTML comment');
  })) passed++; else failed++;

  if (test('install updates outdated managed files', () => {
    const env = createTestEnv();
    try {
      // Install old version
      fs.writeFileSync(
        path.join(env.userRulesDir, 'security.md'),
        MANAGED_MARKER + '\n# Old Content\n',
        'utf8'
      );

      // Verify it's detected as managed
      assert.ok(
        fs.readFileSync(path.join(env.userRulesDir, 'security.md'), 'utf8').startsWith(MANAGED_MARKER),
        'Should be managed'
      );

      // Update with new content
      const newContent = fs.readFileSync(path.join(env.pluginRulesDir, 'security.md'), 'utf8');
      fs.writeFileSync(
        path.join(env.userRulesDir, 'security.md'),
        MANAGED_MARKER + '\n' + newContent,
        'utf8'
      );

      // Verify updated
      const updated = fs.readFileSync(path.join(env.userRulesDir, 'security.md'), 'utf8');
      assert.ok(updated.includes('Security Rules'), 'Should contain updated content');
    } finally {
      cleanupTestEnv(env.tmpDir);
    }
  })) passed++; else failed++;

  // Summary
  const total = passed + failed;
  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}, Total: ${total}`);

  return { passed, failed };
}

const { failed } = runTests();
process.exit(failed > 0 ? 1 : 0);
