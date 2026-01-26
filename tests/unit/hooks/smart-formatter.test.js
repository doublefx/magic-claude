import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { HookTestHarness } from '../../harnesses/HookTestHarness.js';
import { clearCache } from '@lib/detect-project-type.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('smart-formatter hook', () => {
  const harness = new HookTestHarness();
  const hookPath = path.join(__dirname, '../../../scripts/hooks/smart-formatter.cjs');
  const fixturesDir = path.join(__dirname, '../../fixtures');

  // Helper to create a temporary test file
  function createTempFile(projectDir, filename, content = 'test content') {
    const filePath = path.join(projectDir, filename);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  // Helper to cleanup temp files
  function cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  describe('Protocol compliance', () => {
    it('should pass through context unchanged', async () => {
      const context = harness.mockEditContext('/path/to/nonexistent.py', 'old', 'new');

      const result = await harness.executeHook(hookPath, context, {
        cwd: fixturesDir
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.passedThrough.tool).toBe('Edit');
    });

    it('should handle null context gracefully', async () => {
      const result = await harness.executeHook(hookPath, null, {
        cwd: fixturesDir
      });

      expect(result.exitCode).toBe(0);
    });

    it('should pass through context for non-file operations', async () => {
      const context = harness.mockBashContext('npm test');

      const result = await harness.executeHook(hookPath, context, {
        cwd: fixturesDir
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
    });
  });

  describe('Python formatting', () => {
    it('should attempt to format Python file in Python project', async () => {
      const pythonProject = path.join(fixturesDir, 'sample-python-project');
      clearCache(pythonProject);

      const testFile = createTempFile(pythonProject, 'test.py', 'def hello():\n    pass\n');

      try {
        const context = harness.mockEditContext(testFile, 'old', 'new');

        const result = await harness.executeHook(hookPath, context, {
          cwd: pythonProject
        });

        expect(result.exitCode).toBe(0);
        expect(result.passedThrough).toBeTruthy();

        // Should log something about Python formatting (even if tool not installed)
        // The hook should gracefully handle missing formatter tools
      } finally {
        cleanupFile(testFile);
      }
    });

    it('should skip Python formatting in non-Python project', async () => {
      const mavenProject = path.join(fixturesDir, 'sample-maven-project');
      clearCache(mavenProject);

      const testFile = createTempFile(mavenProject, 'test.py', 'def hello():\n    pass\n');

      try {
        const context = harness.mockEditContext(testFile, 'old', 'new');

        const result = await harness.executeHook(hookPath, context, {
          cwd: mavenProject
        });

        expect(result.exitCode).toBe(0);
        expect(result.passedThrough).toBeTruthy();

        // Should NOT mention Python formatting in stderr (no project type match)
        expect(result.stderr).not.toContain('Formatted Python');
      } finally {
        cleanupFile(testFile);
      }
    });

    it('should skip Python formatting for non-.py files in Python project', async () => {
      const pythonProject = path.join(fixturesDir, 'sample-python-project');
      clearCache(pythonProject);

      const testFile = createTempFile(pythonProject, 'test.txt', 'hello world');

      try {
        const context = harness.mockEditContext(testFile, 'old', 'new');

        const result = await harness.executeHook(hookPath, context, {
          cwd: pythonProject
        });

        expect(result.exitCode).toBe(0);
        expect(result.passedThrough).toBeTruthy();

        // Should NOT format non-Python files
        expect(result.stderr).not.toContain('Formatted Python');
      } finally {
        cleanupFile(testFile);
      }
    });
  });

  describe('Java formatting', () => {
    it('should attempt to format Java file in Maven project', async () => {
      const mavenProject = path.join(fixturesDir, 'sample-maven-project');
      clearCache(mavenProject);

      const testFile = createTempFile(mavenProject, 'Test.java', 'public class Test {}');

      try {
        const context = harness.mockEditContext(testFile, 'old', 'new');

        const result = await harness.executeHook(hookPath, context, {
          cwd: mavenProject
        });

        expect(result.exitCode).toBe(0);
        expect(result.passedThrough).toBeTruthy();
      } finally {
        cleanupFile(testFile);
      }
    });

    it('should skip Java formatting in non-Java project', async () => {
      const pythonProject = path.join(fixturesDir, 'sample-python-project');
      clearCache(pythonProject);

      const testFile = createTempFile(pythonProject, 'Test.java', 'public class Test {}');

      try {
        const context = harness.mockEditContext(testFile, 'old', 'new');

        const result = await harness.executeHook(hookPath, context, {
          cwd: pythonProject
        });

        expect(result.exitCode).toBe(0);
        expect(result.passedThrough).toBeTruthy();

        // Should NOT format Java files in Python project
        expect(result.stderr).not.toContain('Formatted Java');
      } finally {
        cleanupFile(testFile);
      }
    });
  });

  describe('TypeScript/JavaScript formatting', () => {
    it('should attempt to format TypeScript file in Node.js project', async () => {
      const nodejsProject = path.join(fixturesDir, 'sample-monorepo/frontend');
      clearCache(nodejsProject);

      const testFile = createTempFile(nodejsProject, 'test.ts', 'const x = 1;');

      try {
        const context = harness.mockEditContext(testFile, 'old', 'new');

        const result = await harness.executeHook(hookPath, context, {
          cwd: nodejsProject
        });

        expect(result.exitCode).toBe(0);
        expect(result.passedThrough).toBeTruthy();
      } finally {
        cleanupFile(testFile);
      }
    });

    it('should attempt to format JavaScript file in Node.js project', async () => {
      const nodejsProject = path.join(fixturesDir, 'sample-monorepo/frontend');
      clearCache(nodejsProject);

      const testFile = createTempFile(nodejsProject, 'test.js', 'const x = 1;');

      try {
        const context = harness.mockEditContext(testFile, 'old', 'new');

        const result = await harness.executeHook(hookPath, context, {
          cwd: nodejsProject
        });

        expect(result.exitCode).toBe(0);
        expect(result.passedThrough).toBeTruthy();
      } finally {
        cleanupFile(testFile);
      }
    });

    it('should skip TypeScript formatting in non-Node.js project', async () => {
      const pythonProject = path.join(fixturesDir, 'sample-python-project');
      clearCache(pythonProject);

      const testFile = createTempFile(pythonProject, 'test.ts', 'const x = 1;');

      try {
        const context = harness.mockEditContext(testFile, 'old', 'new');

        const result = await harness.executeHook(hookPath, context, {
          cwd: pythonProject
        });

        expect(result.exitCode).toBe(0);
        expect(result.passedThrough).toBeTruthy();

        // Should NOT format TypeScript files in Python project
        expect(result.stderr).not.toContain('Formatted TypeScript');
      } finally {
        cleanupFile(testFile);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle non-existent file gracefully', async () => {
      const context = harness.mockEditContext('/nonexistent/file.py', 'old', 'new');

      const result = await harness.executeHook(hookPath, context, {
        cwd: fixturesDir
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
      expect(result.stderr).toContain('does not exist');
    });

    it('should handle Write tool context', async () => {
      const pythonProject = path.join(fixturesDir, 'sample-python-project');
      const testFile = createTempFile(pythonProject, 'test.py', 'def hello():\n    pass\n');

      try {
        const context = harness.mockWriteContext(testFile, 'def hello():\n    pass\n');

        const result = await harness.executeHook(hookPath, context, {
          cwd: pythonProject
        });

        expect(result.exitCode).toBe(0);
        expect(result.passedThrough).toBeTruthy();
      } finally {
        cleanupFile(testFile);
      }
    });

    it('should handle context without file path', async () => {
      const context = {
        tool: 'Edit',
        tool_input: { old_string: 'old', new_string: 'new' }
      };

      const result = await harness.executeHook(hookPath, context, {
        cwd: fixturesDir
      });

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toBeTruthy();
    });
  });

  describe('Multiple file types', () => {
    it('should handle .tsx files in Node.js project', async () => {
      const nodejsProject = path.join(fixturesDir, 'sample-monorepo/frontend');
      clearCache(nodejsProject);

      const testFile = createTempFile(nodejsProject, 'test.tsx', 'export const App = () => <div />;');

      try {
        const context = harness.mockEditContext(testFile, 'old', 'new');

        const result = await harness.executeHook(hookPath, context, {
          cwd: nodejsProject
        });

        expect(result.exitCode).toBe(0);
        expect(result.passedThrough).toBeTruthy();
      } finally {
        cleanupFile(testFile);
      }
    });

    it('should handle .jsx files in Node.js project', async () => {
      const nodejsProject = path.join(fixturesDir, 'sample-monorepo/frontend');
      clearCache(nodejsProject);

      const testFile = createTempFile(nodejsProject, 'test.jsx', 'export const App = () => <div />;');

      try {
        const context = harness.mockEditContext(testFile, 'old', 'new');

        const result = await harness.executeHook(hookPath, context, {
          cwd: nodejsProject
        });

        expect(result.exitCode).toBe(0);
        expect(result.passedThrough).toBeTruthy();
      } finally {
        cleanupFile(testFile);
      }
    });
  });
});
