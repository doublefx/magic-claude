#!/usr/bin/env node
/**
 * Tests for Serena utility module
 *
 * TDD: Write tests first, then implement
 */

const assert = require('assert');
const path = require('path');

// Will be implemented
let serena;

// Test results tracking
const results = { passed: 0, failed: 0, errors: [] };

function test(name, fn) {
  try {
    fn();
    results.passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    results.failed++;
    results.errors.push({ name, error: error.message });
    console.log(`  ✗ ${name}`);
    console.log(`    ${error.message}`);
  }
}

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

// =============================================================================
// Run tests
// =============================================================================

async function runTests() {
  console.log('Serena Utility Module Tests');
  console.log('===========================');

  try {
    // Try to load the module
    serena = require('../../plugin/scripts/lib/serena.cjs');
  } catch (error) {
    console.log('\n❌ Module not found: scripts/lib/serena.cjs');
    console.log('   This is expected - implement the module to pass tests.\n');
    process.exit(1);
  }

  // Run all tests
  describe('isSerenaInstalled()', () => {
    test('returns true when SERENA_INSTALLED env var is "true"', () => {
      const originalEnv = process.env.SERENA_INSTALLED;
      process.env.SERENA_INSTALLED = 'true';
      assert.strictEqual(serena.isSerenaInstalled(), true);
      process.env.SERENA_INSTALLED = originalEnv;
    });

    test('returns false when SERENA_INSTALLED env var is "false"', () => {
      const originalEnv = process.env.SERENA_INSTALLED;
      process.env.SERENA_INSTALLED = 'false';
      assert.strictEqual(serena.isSerenaInstalled(), false);
      if (originalEnv) process.env.SERENA_INSTALLED = originalEnv;
      else delete process.env.SERENA_INSTALLED;
    });

    test('falls through to settings.json check when env var is not set', () => {
      const originalEnv = process.env.SERENA_INSTALLED;
      delete process.env.SERENA_INSTALLED;
      // When env var is unset, result depends on ~/.claude/settings.json
      // Just verify it returns a boolean (settings may or may not have serena)
      const result = serena.isSerenaInstalled();
      assert.strictEqual(typeof result, 'boolean');
      if (originalEnv) process.env.SERENA_INSTALLED = originalEnv;
    });
  });

  describe('isSerenaEnabled()', () => {
    test('returns false when Serena is not installed', () => {
      const originalEnv = process.env.SERENA_INSTALLED;
      process.env.SERENA_INSTALLED = 'false';
      assert.strictEqual(serena.isSerenaEnabled(), false);
      if (originalEnv) process.env.SERENA_INSTALLED = originalEnv;
      else delete process.env.SERENA_INSTALLED;
    });

    test('returns true when Serena is installed and no config exists', () => {
      const originalEnv = process.env.SERENA_INSTALLED;
      process.env.SERENA_INSTALLED = 'true';
      assert.strictEqual(serena.isSerenaEnabled(), true);
      process.env.SERENA_INSTALLED = originalEnv;
    });
  });

  describe('isJetBrainsAvailable()', () => {
    test('returns true when SERENA_JETBRAINS_AVAILABLE is "true"', () => {
      const originalEnv = process.env.SERENA_JETBRAINS_AVAILABLE;
      process.env.SERENA_JETBRAINS_AVAILABLE = 'true';
      assert.strictEqual(serena.isJetBrainsAvailable(), true);
      process.env.SERENA_JETBRAINS_AVAILABLE = originalEnv;
    });

    test('returns false when SERENA_JETBRAINS_AVAILABLE is not set', () => {
      const originalEnv = process.env.SERENA_JETBRAINS_AVAILABLE;
      delete process.env.SERENA_JETBRAINS_AVAILABLE;
      assert.strictEqual(serena.isJetBrainsAvailable(), false);
      if (originalEnv) process.env.SERENA_JETBRAINS_AVAILABLE = originalEnv;
    });
  });

  describe('isProjectActivated()', () => {
    test('returns true when project is activated and path matches', () => {
      const originalActivated = process.env.SERENA_PROJECT_ACTIVATED;
      const originalPath = process.env.SERENA_PROJECT_PATH;
      const cwd = process.cwd();
      process.env.SERENA_PROJECT_ACTIVATED = 'true';
      process.env.SERENA_PROJECT_PATH = cwd;
      assert.strictEqual(serena.isProjectActivated(), true);
      process.env.SERENA_PROJECT_ACTIVATED = originalActivated;
      process.env.SERENA_PROJECT_PATH = originalPath;
    });

    test('returns false when project is activated but path does not match', () => {
      const originalActivated = process.env.SERENA_PROJECT_ACTIVATED;
      const originalPath = process.env.SERENA_PROJECT_PATH;
      process.env.SERENA_PROJECT_ACTIVATED = 'true';
      process.env.SERENA_PROJECT_PATH = '/some/other/path';
      assert.strictEqual(serena.isProjectActivated(), false);
      process.env.SERENA_PROJECT_ACTIVATED = originalActivated;
      process.env.SERENA_PROJECT_PATH = originalPath;
    });

    test('returns false when project is not activated', () => {
      const originalActivated = process.env.SERENA_PROJECT_ACTIVATED;
      delete process.env.SERENA_PROJECT_ACTIVATED;
      assert.strictEqual(serena.isProjectActivated(), false);
      if (originalActivated) process.env.SERENA_PROJECT_ACTIVATED = originalActivated;
    });
  });

  describe('detectLanguages()', () => {
    test('returns array of detected languages', () => {
      const languages = serena.detectLanguages(process.cwd());
      assert.ok(Array.isArray(languages), 'Should return array');
    });
  });

  describe('getSerenaConfig()', () => {
    test('returns default config when no config file exists', () => {
      const config = serena.getSerenaConfig();
      assert.ok(typeof config === 'object');
      assert.ok('enabled' in config);
      assert.ok('hooks_enabled' in config);
      assert.ok('consolidation_threshold' in config);
    });

    test('default consolidation_threshold is 5', () => {
      const config = serena.getSerenaConfig();
      assert.strictEqual(config.consolidation_threshold, 5);
    });
  });

  // Summary
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Total:  ${results.passed + results.failed}`);

  if (results.failed > 0) {
    console.log('\nFailed tests:');
    results.errors.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
    process.exit(1);
  }

  console.log('\n✓ All tests passed!\n');
  process.exit(0);
}

runTests();
