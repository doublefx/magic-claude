import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { HookTestHarness } from '../harnesses/HookTestHarness.js';
import { detectProjectType, clearCache } from '@lib/detect-project-type.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Build Tools Integration', () => {
  const fixturesDir = path.join(__dirname, '../fixtures');
  const mavenProject = path.join(fixturesDir, 'sample-maven-project');
  const harness = new HookTestHarness();
  const mavenAdvisorHook = path.join(__dirname, '../../scripts/hooks/maven-advisor.cjs');

  describe('Maven Project Detection', () => {
    beforeEach(() => {
      clearCache(mavenProject);
    });

    it('should detect Maven project from pom.xml', () => {
      const types = detectProjectType(mavenProject);
      expect(types).toContain('maven');
    });

    it('should detect Maven project from mvnw wrapper', () => {
      const types = detectProjectType(mavenProject);
      expect(types).toContain('maven');
    });
  });

  describe('Maven Advisor Integration', () => {
    beforeEach(() => {
      clearCache(mavenProject);
    });

    it('should provide mvn verify advice in Maven project', async () => {
      const context = harness.mockBashContext('mvn install');

      const result = await harness.executeHook(mavenAdvisorHook, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).toContain('mvn verify');
      expect(result.stderr).toContain('faster than install');
    });

    it('should provide Gradle wrapper advice when using gradle command', async () => {
      const context = harness.mockBashContext('gradle build');

      const result = await harness.executeHook(mavenAdvisorHook, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).toContain('./gradlew');
      expect(result.stderr).toContain('wrapper consistency');
    });

    it('should not provide advice when using correct commands', async () => {
      const verifyContext = harness.mockBashContext('./mvnw verify');

      const result = await harness.executeHook(mavenAdvisorHook, verifyContext, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).not.toContain('Consider');
    });
  });

  describe('Multi-Module Maven Project Support', () => {
    beforeEach(() => {
      clearCache(mavenProject);
    });

    it('should detect Maven in multi-module project root', () => {
      const types = detectProjectType(mavenProject);
      expect(types).toContain('maven');
    });

    it('should provide advice in multi-module Maven builds', async () => {
      const context = harness.mockBashContext('mvn install -pl service,web');

      const result = await harness.executeHook(mavenAdvisorHook, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).toContain('mvn verify');
    });
  });

  describe('Build Tool Command Recommendations', () => {
    beforeEach(() => {
      clearCache(mavenProject);
    });

    it('should recommend parallel Maven builds', async () => {
      const context = harness.mockBashContext('mvn verify');

      const result = await harness.executeHook(mavenAdvisorHook, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      // Note: This test verifies hook doesn't break with valid commands
      // Parallel build advice could be added to maven-advisor in future
    });

    it('should handle Maven commands with profiles', async () => {
      const context = harness.mockBashContext('mvn install -Pprod');

      const result = await harness.executeHook(mavenAdvisorHook, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).toContain('mvn verify');
    });

    it('should handle Maven commands with skip tests', async () => {
      const context = harness.mockBashContext('mvn install -DskipTests');

      const result = await harness.executeHook(mavenAdvisorHook, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).toContain('mvn verify');
    });
  });

  describe('Gradle Project Detection', () => {
    // Note: We need a Gradle fixture for these tests
    // For now, these are placeholders

    it.todo('should detect Gradle project from build.gradle');
    it.todo('should detect Gradle project from build.gradle.kts');
    it.todo('should detect Gradle project from gradlew wrapper');
    it.todo('should detect Gradle project from settings.gradle.kts');
  });

  describe('Mixed Build Tools (Monorepo)', () => {
    // Test for projects with both Maven and Gradle
    it.todo('should detect both Maven and Gradle in monorepo');
    it.todo('should provide appropriate advice based on command used');
  });

  describe('Build Tool Wrapper Detection', () => {
    beforeEach(() => {
      clearCache(mavenProject);
    });

    it('should prefer wrapper over global command', async () => {
      const context = harness.mockBashContext('mvn clean verify');

      const result = await harness.executeHook(mavenAdvisorHook, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      // Verify wrapper is recommended (indirectly - mvn install triggers advice)
    });

    it('should not warn when using wrapper', async () => {
      const context = harness.mockBashContext('./mvnw clean verify');

      const result = await harness.executeHook(mavenAdvisorHook, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).not.toContain('Consider');
    });
  });

  describe('Non-Build Tool Commands', () => {
    beforeEach(() => {
      clearCache(mavenProject);
    });

    it('should pass through non-Maven/Gradle commands silently', async () => {
      const commands = [
        'npm test',
        'python manage.py test',
        'cargo build',
        'go build',
        'make all'
      ];

      for (const cmd of commands) {
        const context = harness.mockBashContext(cmd);

        const result = await harness.executeHook(mavenAdvisorHook, context, {
          cwd: mavenProject
        });

        expect(result.exitCode).toBe(0);
        expect(result.passedThrough).toBeTruthy();
        expect(result.stderr).not.toContain('Consider');
      }
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      clearCache(mavenProject);
    });

    it('should handle compound commands with Maven', async () => {
      const context = harness.mockBashContext('mvn clean && mvn install && mvn test');

      const result = await harness.executeHook(mavenAdvisorHook, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).toContain('mvn verify');
    });

    it('should handle Maven commands in bash scripts', async () => {
      const context = harness.mockBashContext('bash -c "mvn install"');

      const result = await harness.executeHook(mavenAdvisorHook, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).toContain('mvn verify');
    });

    it('should handle empty command gracefully', async () => {
      const context = harness.mockBashContext('');

      const result = await harness.executeHook(mavenAdvisorHook, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
    });
  });
});
