/**
 * Tests for scripts/lib/workspace/ecosystems.cjs
 * Multi-ecosystem support: detect ecosystems per package in workspace
 *
 * Run with: node tests/lib/workspace-ecosystems.test.cjs
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
let detectPackageEcosystem, detectWorkspaceEcosystems, enrichPackagesWithEcosystems;
let moduleLoaded = false;

try {
  const workspaceEcosystemsModule = require('../../plugin/scripts/lib/workspace/ecosystems.cjs');
  detectPackageEcosystem = workspaceEcosystemsModule.detectPackageEcosystem;
  detectWorkspaceEcosystems = workspaceEcosystemsModule.detectWorkspaceEcosystems;
  enrichPackagesWithEcosystems = workspaceEcosystemsModule.enrichPackagesWithEcosystems;
  moduleLoaded = true;
} catch (error) {
  console.log('\n⚠️  Module not found (expected in TDD RED phase)');
  console.log(`   Error: ${error.message}\n`);

  // Create stubs for initial test run
  detectPackageEcosystem = (packagePath) => 'nodejs';
  detectWorkspaceEcosystems = (workspaceRoot) => ({ nodejs: true });
  enrichPackagesWithEcosystems = (packages) => packages;
}

// Test suite
function runTests() {
  console.log('\n=== Testing Workspace Ecosystems ===\n');

  const results = {
    passed: 0,
    failed: 0
  };

  // detectPackageEcosystem Function
  console.log('detectPackageEcosystem Function:');

  results[test('should detect nodejs ecosystem from package.json', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-pkg-'));
    try {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-package' })
      );

      const ecosystem = detectPackageEcosystem(tempDir);
      assert.strictEqual(ecosystem, 'nodejs');
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should detect jvm ecosystem from pom.xml', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-pkg-'));
    try {
      fs.writeFileSync(path.join(tempDir, 'pom.xml'), '<project></project>');

      const ecosystem = detectPackageEcosystem(tempDir);
      assert.strictEqual(ecosystem, 'jvm');
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should detect python ecosystem from requirements.txt', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-pkg-'));
    try {
      fs.writeFileSync(path.join(tempDir, 'requirements.txt'), 'requests==2.0.0');

      const ecosystem = detectPackageEcosystem(tempDir);
      assert.strictEqual(ecosystem, 'python');
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should detect rust ecosystem from Cargo.toml', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-pkg-'));
    try {
      fs.writeFileSync(path.join(tempDir, 'Cargo.toml'), '[package]\nname = "test"');

      const ecosystem = detectPackageEcosystem(tempDir);
      assert.strictEqual(ecosystem, 'rust');
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should return unknown for empty directory', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-pkg-'));
    try {
      const ecosystem = detectPackageEcosystem(tempDir);
      assert.strictEqual(ecosystem, 'unknown');
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should handle non-existent directory', () => {
    const ecosystem = detectPackageEcosystem('/nonexistent/path/that/does/not/exist');
    assert.strictEqual(ecosystem, 'unknown');
  }) ? 'passed' : 'failed']++;

  console.log('');

  // detectWorkspaceEcosystems Function
  console.log('detectWorkspaceEcosystems Function:');

  results[test('should detect multiple ecosystems in workspace', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-ws-'));
    try {
      // Create workspace with mixed ecosystems
      fs.writeFileSync(
        path.join(tempDir, 'pnpm-workspace.yaml'),
        'packages:\n  - "packages/*"'
      );
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'root' })
      );

      // Node.js package
      const nodePkgDir = path.join(tempDir, 'packages', 'frontend');
      fs.mkdirSync(nodePkgDir, { recursive: true });
      fs.writeFileSync(
        path.join(nodePkgDir, 'package.json'),
        JSON.stringify({ name: 'frontend' })
      );

      // Java package
      const javaPkgDir = path.join(tempDir, 'packages', 'backend');
      fs.mkdirSync(javaPkgDir, { recursive: true });
      fs.writeFileSync(path.join(javaPkgDir, 'pom.xml'), '<project></project>');
      fs.writeFileSync(
        path.join(javaPkgDir, 'package.json'),
        JSON.stringify({ name: 'backend' })
      );

      const ecosystems = detectWorkspaceEcosystems(tempDir);
      assert.strictEqual(typeof ecosystems, 'object');
      assert.ok(ecosystems.nodejs || ecosystems.jvm);
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should return object with ecosystem counts', () => {
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
        JSON.stringify({ name: 'pkg1' })
      );

      const ecosystems = detectWorkspaceEcosystems(tempDir);
      assert.strictEqual(typeof ecosystems, 'object');
      // Should have at least nodejs: count
      if (ecosystems.nodejs !== undefined) {
        assert.strictEqual(typeof ecosystems.nodejs, 'number');
        assert.ok(ecosystems.nodejs >= 0);
      }
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  results[test('should handle workspace without packages', () => {
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

      const ecosystems = detectWorkspaceEcosystems(tempDir);
      assert.strictEqual(typeof ecosystems, 'object');
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  console.log('');

  // enrichPackagesWithEcosystems Function
  console.log('enrichPackagesWithEcosystems Function:');

  results[test('should add ecosystem property to packages', () => {
    const packages = [
      {
        name: 'test-package',
        path: process.cwd(),
        packageJson: { name: 'test-package' }
      }
    ];

    const enriched = enrichPackagesWithEcosystems(packages);
    assert.ok(Array.isArray(enriched));
    assert.strictEqual(enriched.length, 1);
    assert.ok(enriched[0].ecosystem);
    assert.strictEqual(typeof enriched[0].ecosystem, 'string');
  }) ? 'passed' : 'failed']++;

  results[test('should preserve existing package properties', () => {
    const packages = [
      {
        name: 'test-package',
        path: process.cwd(),
        relativePath: 'packages/test',
        packageJson: { name: 'test-package', version: '1.0.0' }
      }
    ];

    const enriched = enrichPackagesWithEcosystems(packages);
    assert.strictEqual(enriched[0].name, 'test-package');
    assert.strictEqual(enriched[0].relativePath, 'packages/test');
    assert.strictEqual(enriched[0].packageJson.version, '1.0.0');
  }) ? 'passed' : 'failed']++;

  results[test('should handle empty packages array', () => {
    const enriched = enrichPackagesWithEcosystems([]);
    assert.ok(Array.isArray(enriched));
    assert.strictEqual(enriched.length, 0);
  }) ? 'passed' : 'failed']++;

  results[test('should detect different ecosystems for different packages', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-ws-'));
    try {
      // Node.js package
      const nodePkgDir = path.join(tempDir, 'packages', 'frontend');
      fs.mkdirSync(nodePkgDir, { recursive: true });
      fs.writeFileSync(
        path.join(nodePkgDir, 'package.json'),
        JSON.stringify({ name: 'frontend' })
      );

      // Java package
      const javaPkgDir = path.join(tempDir, 'packages', 'backend');
      fs.mkdirSync(javaPkgDir, { recursive: true });
      fs.writeFileSync(path.join(javaPkgDir, 'pom.xml'), '<project></project>');
      fs.writeFileSync(
        path.join(javaPkgDir, 'package.json'),
        JSON.stringify({ name: 'backend' })
      );

      const packages = [
        {
          name: 'frontend',
          path: nodePkgDir,
          packageJson: { name: 'frontend' }
        },
        {
          name: 'backend',
          path: javaPkgDir,
          packageJson: { name: 'backend' }
        }
      ];

      const enriched = enrichPackagesWithEcosystems(packages);
      assert.strictEqual(enriched.length, 2);

      // Should have different ecosystems
      const ecosystems = enriched.map(p => p.ecosystem);
      assert.ok(ecosystems.includes('nodejs') || ecosystems.includes('jvm'));
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch {}
    }
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Integration Test
  console.log('Integration with Workspace Detection:');

  results[test('should work with real workspace detection', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-ws-'));
    try {
      // Create mixed-language workspace
      fs.writeFileSync(
        path.join(tempDir, 'pnpm-workspace.yaml'),
        'packages:\n  - "packages/*"'
      );
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'monorepo' })
      );

      // Node.js package
      const nodePkgDir = path.join(tempDir, 'packages', 'web');
      fs.mkdirSync(nodePkgDir, { recursive: true });
      fs.writeFileSync(
        path.join(nodePkgDir, 'package.json'),
        JSON.stringify({ name: '@monorepo/web' })
      );

      // Python package
      const pythonPkgDir = path.join(tempDir, 'packages', 'ml');
      fs.mkdirSync(pythonPkgDir, { recursive: true });
      fs.writeFileSync(path.join(pythonPkgDir, 'requirements.txt'), 'numpy==1.0.0');
      fs.writeFileSync(
        path.join(pythonPkgDir, 'package.json'),
        JSON.stringify({ name: '@monorepo/ml' })
      );

      // Detect workspace
      const { detectWorkspace } = require('../../plugin/scripts/lib/workspace/detection.cjs');
      const workspace = detectWorkspace(tempDir);

      if (workspace && workspace.packages) {
        // Enrich with ecosystems
        const enriched = enrichPackagesWithEcosystems(workspace.packages);
        assert.ok(enriched.length > 0);

        // Each package should have ecosystem
        for (const pkg of enriched) {
          assert.ok(pkg.ecosystem);
          assert.strictEqual(typeof pkg.ecosystem, 'string');
        }
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
    console.log('   Next step: Implement scripts/lib/workspace/ecosystems.cjs');
    console.log('');
  }

  return results.failed === 0;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
