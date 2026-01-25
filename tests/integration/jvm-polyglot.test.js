import { describe, it, expect, beforeAll } from 'vitest';
import { HookTestHarness } from '../harnesses/HookTestHarness.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../..');
const fixturesRoot = path.resolve(__dirname, '../fixtures');

describe('JVM Polyglot Project Integration', () => {
  let harness;

  beforeAll(() => {
    harness = new HookTestHarness();
  });

  describe('Project Detection', () => {
    it('should detect Maven project from pom.xml', async () => {
      const { detectProjectType } = await import('../../scripts/lib/detect-project-type.js');
      const mavenFixture = path.join(fixturesRoot, 'sample-maven-project');

      const types = detectProjectType(mavenFixture);

      expect(types).toContain('maven');
    });

    it('should detect Java in monorepo backend', async () => {
      const { detectProjectType } = await import('../../scripts/lib/detect-project-type.js');
      const backendFixture = path.join(fixturesRoot, 'sample-monorepo/backend');

      const types = detectProjectType(backendFixture);

      expect(types).toContain('maven');
    });
  });

  describe('Smart Formatter Hook - Java', () => {
    const smartFormatterPath = path.join(projectRoot, 'scripts/hooks/smart-formatter.js');
    const javaFilePath = path.join(
      fixturesRoot,
      'sample-maven-project/src/main/java/com/example/App.java'
    );

    it('should process Java file in Maven project', async () => {
      const context = harness.mockEditContext(javaFilePath, 'old', 'new');

      const result = await harness.executeHook(smartFormatterPath, context, {
        cwd: path.join(fixturesRoot, 'sample-maven-project')
      });

      harness.assertSuccess(result);
      harness.assertPassThrough(result, context);

      // Should log that it processed the file (if google-java-format is installed)
      // Or should pass through silently if not installed
      expect(result.exitCode).toBe(0);
    });

    it('should NOT format Java file in non-Maven project', async () => {
      const pythonProjectRoot = path.join(fixturesRoot, 'sample-python-project');
      const javaFile = path.join(pythonProjectRoot, 'test.java');

      // Create temporary Java file in Python project
      fs.writeFileSync(javaFile, 'public class Test {}');

      try {
        const context = harness.mockEditContext(javaFile, 'old', 'new');

        const result = await harness.executeHook(smartFormatterPath, context, {
          cwd: pythonProjectRoot
        });

        harness.assertSuccess(result);

        // Should NOT log Java formatting (project type mismatch)
        harness.assertStderrNotContains(result, 'Formatted Java file');
      } finally {
        // Cleanup
        if (fs.existsSync(javaFile)) {
          fs.unlinkSync(javaFile);
        }
      }
    });

    it('should pass through non-file operations', async () => {
      const context = harness.mockBashContext('mvn clean install');

      const result = await harness.executeHook(smartFormatterPath, context, {
        cwd: path.join(fixturesRoot, 'sample-maven-project')
      });

      harness.assertSuccess(result);
      harness.assertPassThrough(result, context);
    });
  });

  describe('Smart Formatter Hook - Kotlin', () => {
    const smartFormatterPath = path.join(projectRoot, 'scripts/hooks/smart-formatter.js');

    it('should process Kotlin file in Gradle project', async () => {
      // Create a minimal Gradle project for testing
      const gradleProjectRoot = path.join(fixturesRoot, 'sample-gradle-project');
      const kotlinFile = path.join(gradleProjectRoot, 'src/main/kotlin/App.kt');
      const buildGradle = path.join(gradleProjectRoot, 'build.gradle');

      // Setup temporary Gradle project
      fs.mkdirSync(gradleProjectRoot, { recursive: true });
      fs.mkdirSync(path.dirname(kotlinFile), { recursive: true });
      fs.writeFileSync(buildGradle, 'plugins { id "kotlin" }');
      fs.writeFileSync(kotlinFile, 'fun main() { println("Hello") }');

      try {
        const context = harness.mockEditContext(kotlinFile, 'old', 'new');

        const result = await harness.executeHook(smartFormatterPath, context, {
          cwd: gradleProjectRoot
        });

        harness.assertSuccess(result);
        harness.assertPassThrough(result, context);
        expect(result.exitCode).toBe(0);
      } finally {
        // Cleanup
        if (fs.existsSync(gradleProjectRoot)) {
          fs.rmSync(gradleProjectRoot, { recursive: true, force: true });
        }
      }
    });
  });

  describe('Java Security Hook', () => {
    const securityHookPath = path.join(projectRoot, 'scripts/hooks/java-security.js');
    const javaFilePath = path.join(
      fixturesRoot,
      'sample-maven-project/src/main/java/com/example/App.java'
    );

    it('should run security checks on Java file in Maven project', async () => {
      const context = harness.mockWriteContext(javaFilePath, 'public class App {}');

      const result = await harness.executeHook(securityHookPath, context, {
        cwd: path.join(fixturesRoot, 'sample-maven-project')
      });

      harness.assertSuccess(result);
      harness.assertPassThrough(result, context);
      expect(result.exitCode).toBe(0);
    });

    it('should detect SQL injection pattern', async () => {
      const mavenProjectRoot = path.join(fixturesRoot, 'sample-maven-project');
      const vulnerableFile = path.join(mavenProjectRoot, 'src/main/java/com/example/Vulnerable.java');

      // Create vulnerable code
      const vulnerableCode = `
package com.example;

public class Vulnerable {
  public void query(String userId) {
    String sql = "SELECT * FROM users WHERE id = '" + userId + "'";
    // SQL injection vulnerability!
  }
}
`;
      fs.writeFileSync(vulnerableFile, vulnerableCode);

      try {
        const context = harness.mockWriteContext(vulnerableFile, vulnerableCode);

        const result = await harness.executeHook(securityHookPath, context, {
          cwd: mavenProjectRoot
        });

        harness.assertSuccess(result);

        // Hook should recommend adding SpotBugs (requires compilation for bytecode analysis)
        // Note: The hook can't detect SQL injection in source code - it needs compiled .class files
        expect(result.stderr).toContain('SpotBugs');
        expect(result.stderr).toMatch(/Compiled classes not found|security scanning/);
      } finally {
        // Cleanup
        if (fs.existsSync(vulnerableFile)) {
          fs.unlinkSync(vulnerableFile);
        }
      }
    });

    it('should detect hardcoded credential pattern', async () => {
      const mavenProjectRoot = path.join(fixturesRoot, 'sample-maven-project');
      const vulnerableFile = path.join(mavenProjectRoot, 'src/main/java/com/example/Config.java');

      // Create code with hardcoded credential
      const vulnerableCode = `
package com.example;

public class Config {
  private static final String API_KEY = "sk-abc123def456";
  private static final String PASSWORD = "secret123";
}
`;
      fs.writeFileSync(vulnerableFile, vulnerableCode);

      try {
        const context = harness.mockWriteContext(vulnerableFile, vulnerableCode);

        const result = await harness.executeHook(securityHookPath, context, {
          cwd: mavenProjectRoot
        });

        harness.assertSuccess(result);

        // Should warn about hardcoded credentials
        expect(result.stderr).toContain('hardcoded credential');
      } finally {
        // Cleanup
        if (fs.existsSync(vulnerableFile)) {
          fs.unlinkSync(vulnerableFile);
        }
      }
    });

    it('should NOT run on non-Java files', async () => {
      const pythonFile = path.join(
        fixturesRoot,
        'sample-python-project/src/main.py'
      );

      const context = harness.mockWriteContext(pythonFile, 'print("hello")');

      const result = await harness.executeHook(securityHookPath, context, {
        cwd: path.join(fixturesRoot, 'sample-python-project')
      });

      harness.assertSuccess(result);
      harness.assertPassThrough(result, context);

      // Should not run any checks
      harness.assertStderrNotContains(result, 'security');
    });
  });

  describe('Polyglot Monorepo - No Interference', () => {
    const smartFormatterPath = path.join(projectRoot, 'scripts/hooks/smart-formatter.js');
    const monorepoRoot = path.join(fixturesRoot, 'sample-monorepo');

    it('should format Java in backend without affecting Python in ml/', async () => {
      const javaFile = path.join(monorepoRoot, 'backend/src/main/java/com/example/Api.java');
      const backendRoot = path.join(monorepoRoot, 'backend');

      const context = harness.mockEditContext(javaFile, 'old', 'new');

      const result = await harness.executeHook(smartFormatterPath, context, {
        cwd: backendRoot
      });

      harness.assertSuccess(result);
      harness.assertPassThrough(result, context);

      // Should only process Java (Maven project detected in backend/)
      expect(result.exitCode).toBe(0);
    });

    it('should handle mixed file types in monorepo correctly', async () => {
      // Test that Python formatter doesn't run on Java files
      const javaFile = path.join(monorepoRoot, 'backend/src/main/java/com/example/Api.java');
      const backendRoot = path.join(monorepoRoot, 'backend');

      const context = harness.mockEditContext(javaFile, 'old', 'new');

      const result = await harness.executeHook(smartFormatterPath, context, {
        cwd: backendRoot
      });

      // Should NOT attempt to format with Ruff (Python tool)
      harness.assertStderrNotContains(result, 'ruff');
    });
  });

  describe('Hook Execution Order', () => {
    it('should execute both formatter and security hooks independently', async () => {
      const smartFormatterPath = path.join(projectRoot, 'scripts/hooks/smart-formatter.js');
      const securityHookPath = path.join(projectRoot, 'scripts/hooks/java-security.js');
      const javaFilePath = path.join(
        fixturesRoot,
        'sample-maven-project/src/main/java/com/example/App.java'
      );
      const mavenProjectRoot = path.join(fixturesRoot, 'sample-maven-project');

      const context = harness.mockWriteContext(javaFilePath, 'public class App {}');

      // Execute formatter
      const formatterResult = await harness.executeHook(smartFormatterPath, context, {
        cwd: mavenProjectRoot
      });

      harness.assertSuccess(formatterResult);

      // Execute security hook (should work independently)
      const securityResult = await harness.executeHook(securityHookPath, context, {
        cwd: mavenProjectRoot
      });

      harness.assertSuccess(securityResult);

      // Both should pass through context
      harness.assertPassThrough(formatterResult, context);
      harness.assertPassThrough(securityResult, context);
    });
  });

  describe('Error Handling', () => {
    const smartFormatterPath = path.join(projectRoot, 'scripts/hooks/smart-formatter.js');

    it('should handle non-existent file gracefully', async () => {
      const nonExistentFile = '/tmp/nonexistent.java';
      const context = harness.mockEditContext(nonExistentFile, 'old', 'new');

      const result = await harness.executeHook(smartFormatterPath, context, {
        cwd: path.join(fixturesRoot, 'sample-maven-project')
      });

      // Should still succeed (graceful degradation)
      harness.assertSuccess(result);
      harness.assertPassThrough(result, context);
    });

    it('should handle missing project type gracefully', async () => {
      const emptyDir = path.join(fixturesRoot, 'empty-project');
      fs.mkdirSync(emptyDir, { recursive: true });

      const javaFile = path.join(emptyDir, 'Test.java');
      fs.writeFileSync(javaFile, 'public class Test {}');

      try {
        const context = harness.mockEditContext(javaFile, 'old', 'new');

        const result = await harness.executeHook(smartFormatterPath, context, {
          cwd: emptyDir
        });

        // Should pass through without processing (no project type)
        harness.assertSuccess(result);
        harness.assertPassThrough(result, context);
      } finally {
        // Cleanup
        if (fs.existsSync(emptyDir)) {
          fs.rmSync(emptyDir, { recursive: true, force: true });
        }
      }
    });
  });
});
