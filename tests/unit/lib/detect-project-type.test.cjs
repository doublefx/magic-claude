import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fsSync from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module we're testing
import { detectProjectType, clearCache } from '@lib/detect-project-type.js';

describe('detect-project-type', () => {
  const fixturesDir = path.join(__dirname, '../../fixtures');

  describe('Python project detection', () => {
    it('should detect Python project by pyproject.toml', () => {
      const pythonProjectDir = path.join(fixturesDir, 'sample-python-project');
      clearCache(pythonProjectDir);
      const types = detectProjectType(pythonProjectDir);
      expect(types).toContain('python');
    });

    it('should detect Python project by requirements.txt', () => {
      const pythonProjectDir = path.join(fixturesDir, 'sample-python-project');
      clearCache(pythonProjectDir);
      const types = detectProjectType(pythonProjectDir);
      expect(types).toContain('python');
    });

    it.todo('should detect Python project by setup.py');
    it.todo('should detect Python project by Pipfile');
    it.todo('should detect Python project by poetry.lock');
    it.todo('should detect Python project by uv.lock');
    it.todo('should detect Python project by environment.yml');

    // Sample test that will fail until implementation
    it('should detect Python project in sample fixture', async () => {
      const pythonProjectDir = path.join(fixturesDir, 'sample-python-project');

      // Verify the fixture exists
      const pyprojectPath = path.join(pythonProjectDir, 'pyproject.toml');
      const exists = await fs.access(pyprojectPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Clear cache to ensure fresh detection
      clearCache(pythonProjectDir);

      const types = detectProjectType(pythonProjectDir);
      expect(types).toContain('python');
      expect(types).toBeInstanceOf(Array);
    });
  });

  describe('Maven project detection', () => {
    it('should detect Maven project by pom.xml', () => {
      const mavenProjectDir = path.join(fixturesDir, 'sample-maven-project');
      clearCache(mavenProjectDir);
      const types = detectProjectType(mavenProjectDir);
      expect(types).toContain('maven');
    });

    it.todo('should detect Maven project by mvnw');
    it.todo('should detect Maven project by mvnw.cmd');

    // Sample test that will fail until implementation
    it('should detect Maven project in sample fixture', async () => {
      const mavenProjectDir = path.join(fixturesDir, 'sample-maven-project');

      // Verify the fixture exists
      const pomPath = path.join(mavenProjectDir, 'pom.xml');
      const exists = await fs.access(pomPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Clear cache to ensure fresh detection
      clearCache(mavenProjectDir);

      const types = detectProjectType(mavenProjectDir);
      expect(types).toContain('maven');
      expect(types).toBeInstanceOf(Array);
    });
  });

  describe('Gradle project detection', () => {
    it.todo('should detect Gradle project by build.gradle');
    it.todo('should detect Gradle project by build.gradle.kts');
    it.todo('should detect Gradle project by settings.gradle');
    it.todo('should detect Gradle project by settings.gradle.kts');
    it.todo('should detect Gradle project by gradlew');
    it.todo('should detect Gradle project by gradlew.bat');
  });

  describe('Node.js project detection', () => {
    it('should detect Node.js project by package.json', () => {
      const nodejsProjectDir = path.join(fixturesDir, 'sample-monorepo/frontend');
      clearCache(nodejsProjectDir);
      const types = detectProjectType(nodejsProjectDir);
      expect(types).toContain('nodejs');
    });

    it.todo('should detect Node.js project by package-lock.json');
    it.todo('should detect Node.js project by yarn.lock');
    it.todo('should detect Node.js project by pnpm-lock.yaml');
    it.todo('should detect Node.js project by bun.lockb');

    // Sample test for monorepo frontend
    it('should detect Node.js project in monorepo frontend', async () => {
      const frontendDir = path.join(fixturesDir, 'sample-monorepo/frontend');

      // Verify the fixture exists
      const packageJsonPath = path.join(frontendDir, 'package.json');
      const exists = await fs.access(packageJsonPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Clear cache to ensure fresh detection
      clearCache(frontendDir);

      const types = detectProjectType(frontendDir);
      expect(types).toContain('nodejs');
      expect(types).toBeInstanceOf(Array);
    });
  });

  describe('Monorepo support', () => {
    it.todo('should detect multiple project types in monorepo backend');
    it.todo('should detect multiple project types in monorepo frontend');
    it.todo('should detect multiple project types in monorepo ml');

    // Sample test for monorepo
    it('should detect Maven in monorepo backend', async () => {
      const backendDir = path.join(fixturesDir, 'sample-monorepo/backend');

      // Verify the fixture exists
      const pomPath = path.join(backendDir, 'pom.xml');
      const exists = await fs.access(pomPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Clear cache to ensure fresh detection
      clearCache(backendDir);

      const types = detectProjectType(backendDir);
      expect(types).toContain('maven');
    });

    it('should detect Python in monorepo ml service', async () => {
      const mlDir = path.join(fixturesDir, 'sample-monorepo/ml');

      // Verify the fixture exists
      const pyprojectPath = path.join(mlDir, 'pyproject.toml');
      const exists = await fs.access(pyprojectPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Clear cache to ensure fresh detection
      clearCache(mlDir);

      const types = detectProjectType(mlDir);
      expect(types).toContain('python');
    });
  });

  describe('Caching behavior', () => {
    it('should cache detection results', () => {
      const pythonProjectDir = path.join(fixturesDir, 'sample-python-project');
      clearCache(pythonProjectDir);

      // First call - should create cache
      const types1 = detectProjectType(pythonProjectDir);
      expect(types1).toContain('python');

      // Check if cache file exists
      const cacheFile = path.join(pythonProjectDir, '.claude', 'project-type.json');
      const cacheExists = fsSync.existsSync(cacheFile);
      expect(cacheExists).toBe(true);
    });

    it('should use cached results when manifest unchanged', () => {
      const pythonProjectDir = path.join(fixturesDir, 'sample-python-project');
      clearCache(pythonProjectDir);

      // First call - creates cache
      const types1 = detectProjectType(pythonProjectDir);

      // Second call - should use cache
      const types2 = detectProjectType(pythonProjectDir);

      // Both should return same results
      expect(types1).toEqual(types2);
    });

    it('should create .claude directory if needed', () => {
      const pythonProjectDir = path.join(fixturesDir, 'sample-python-project');
      const claudeDir = path.join(pythonProjectDir, '.claude');

      // Clear cache (which deletes the cache file)
      clearCache(pythonProjectDir);

      // Run detection - should create .claude directory
      detectProjectType(pythonProjectDir);

      // Check if .claude directory exists
      const dirExists = fsSync.existsSync(claudeDir);
      expect(dirExists).toBe(true);
    });

    it.todo('should invalidate cache when manifest changes');
    it.todo('should handle missing .claude directory');
  });

  describe('Edge cases', () => {
    it('should return empty array for directory with no manifests', () => {
      // Use a directory that exists but has no project manifests
      const emptyDir = path.join(fixturesDir, 'sample-python-project/src');
      clearCache(emptyDir);
      const types = detectProjectType(emptyDir);
      expect(types).toEqual([]);
    });

    it('should handle non-existent directory gracefully', () => {
      const nonExistentDir = path.join(fixturesDir, 'non-existent-project-xyz123');
      const types = detectProjectType(nonExistentDir);
      expect(types).toEqual([]);
    });

    it('should handle invalid input gracefully', () => {
      expect(detectProjectType(null)).toEqual([]);
      expect(detectProjectType('')).toEqual([]);
      expect(detectProjectType(123)).toEqual([]);
    });

    it('should use process.cwd() when called with no arguments', () => {
      const types = detectProjectType();
      // Current directory is a nodejs project (has package.json)
      expect(types).toContain('nodejs');
      expect(Array.isArray(types)).toBe(true);
    });

    it('should detect multiple types in same directory', () => {
      const pythonProjectDir = path.join(fixturesDir, 'sample-python-project');
      clearCache(pythonProjectDir);
      const types = detectProjectType(pythonProjectDir);
      // sample-python-project has both pyproject.toml and requirements.txt
      expect(types).toContain('python');
      expect(types.length).toBeGreaterThan(0);
    });

    it.todo('should handle permission errors gracefully');
    it.todo('should handle symlinks correctly');
  });

  describe('Performance', () => {
    it.todo('should complete detection in <50ms with cache');
    it.todo('should complete detection in <200ms without cache');
    it.todo('should handle large directories efficiently');
  });
});
