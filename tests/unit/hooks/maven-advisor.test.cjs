import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { HookTestHarness } from '../../harnesses/HookTestHarness.js';
import { clearCache } from '@lib/detect-project-type.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('maven-advisor hook', () => {
  const harness = new HookTestHarness();
  const hookPath = path.join(__dirname, '../../../plugin/scripts/hooks/maven-advisor.cjs');
  const fixturesDir = path.join(__dirname, '../../fixtures');

  describe('Protocol compliance', () => {
    it('should pass through context unchanged', async () => {
      const context = harness.mockBashContext('npm test');

      const result = await harness.executeHook(hookPath, context, {
        cwd: fixturesDir
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.passedThrough.tool).toBe('Bash');
    });

    it('should handle null context gracefully', async () => {
      const result = await harness.executeHook(hookPath, null, {
        cwd: fixturesDir
      });

      expect(result.exitCode).toBe(0);
    });

    it('should pass through context for non-Bash operations', async () => {
      const context = harness.mockEditContext('/path/to/file.java', 'old', 'new');

      const result = await harness.executeHook(hookPath, context, {
        cwd: fixturesDir
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
    });
  });

  describe('Maven advice in Maven project', () => {
    const mavenProject = path.join(fixturesDir, 'sample-maven-project');

    beforeEach(() => {
      clearCache(mavenProject);
    });

    it('should suggest mvn verify instead of mvn install', async () => {
      const context = harness.mockBashContext('mvn install');

      const result = await harness.executeHook(hookPath, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).toContain('mvn verify');
      expect(result.stderr).toContain('faster than install');
    });

    it('should not warn about mvn clean install', async () => {
      const context = harness.mockBashContext('mvn clean install');

      const result = await harness.executeHook(hookPath, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).not.toContain('mvn verify');
    });

    it('should not warn about mvn verify', async () => {
      const context = harness.mockBashContext('mvn verify');

      const result = await harness.executeHook(hookPath, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).not.toContain('Consider');
    });

    it('should suggest ./gradlew instead of gradle', async () => {
      const context = harness.mockBashContext('gradle build');

      const result = await harness.executeHook(hookPath, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).toContain('./gradlew');
      expect(result.stderr).toContain('wrapper consistency');
    });

    it('should not warn about ./gradlew', async () => {
      const context = harness.mockBashContext('./gradlew build');

      const result = await harness.executeHook(hookPath, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).not.toContain('Consider');
    });
  });

  describe('Gradle advice in Gradle project', () => {
    // We don't have a pure Gradle fixture, but we can test the logic
    // In a real Gradle project, this would work
    it.todo('should suggest ./gradlew in Gradle project');
  });

  describe('No advice in non-Maven/Gradle projects', () => {
    const pythonProject = path.join(fixturesDir, 'sample-python-project');

    beforeEach(() => {
      clearCache(pythonProject);
    });

    it('should not give Maven advice in Python project', async () => {
      const context = harness.mockBashContext('mvn install');

      const result = await harness.executeHook(hookPath, context, {
        cwd: pythonProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).not.toContain('mvn verify');
    });

    it('should not give Gradle advice in Python project', async () => {
      const context = harness.mockBashContext('gradle build');

      const result = await harness.executeHook(hookPath, context, {
        cwd: pythonProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).not.toContain('./gradlew');
    });
  });

  describe('Edge cases', () => {
    const mavenProject = path.join(fixturesDir, 'sample-maven-project');

    beforeEach(() => {
      clearCache(mavenProject);
    });

    it('should handle context without command', async () => {
      const context = {
        tool: 'Bash',
        tool_input: {}
      };

      const result = await harness.executeHook(hookPath, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
    });

    it('should handle non-Maven/Gradle commands', async () => {
      const context = harness.mockBashContext('npm test');

      const result = await harness.executeHook(hookPath, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).not.toContain('Consider');
    });

    it('should handle compound commands with mvn install', async () => {
      const context = harness.mockBashContext('mvn clean && mvn install && mvn test');

      const result = await harness.executeHook(hookPath, context, {
        cwd: mavenProject
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).toContain('mvn verify');
    });
  });
});
