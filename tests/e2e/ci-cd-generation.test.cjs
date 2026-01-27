/**
 * End-to-End Tests for CI/CD Pipeline Generation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { generatePipeline, generateAdditionalFiles } from '../../commands/ci-cd.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CI/CD Pipeline Generation', () => {
  let testDir;

  beforeEach(() => {
    // Create temporary test directory
    testDir = path.join(__dirname, '..', 'fixtures', `test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('GitHub Actions', () => {
    it('should generate pipeline for Node.js project', async () => {
      // Create package.json to simulate Node.js project
      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'test-app', version: '1.0.0' })
      );

      const result = await generatePipeline('github-actions', testDir);

      expect(result.success).toBe(true);
      expect(result.projectTypes).toContain('nodejs');
      expect(fs.existsSync(path.join(testDir, '.github', 'workflows', 'ci.yml'))).toBe(true);

      // Validate YAML syntax
      const content = fs.readFileSync(path.join(testDir, '.github', 'workflows', 'ci.yml'), 'utf8');
      const parsed = yaml.load(content);

      expect(parsed.name).toBe('Node.js CI');
      expect(parsed.jobs).toBeDefined();
      expect(parsed.jobs['detect-package-manager']).toBeDefined();
      expect(parsed.jobs['build-and-test']).toBeDefined();
    });

    it('should generate pipeline for Python project', async () => {
      // Create pyproject.toml to simulate Python project
      fs.writeFileSync(
        path.join(testDir, 'pyproject.toml'),
        '[project]\nname = "test-app"\nversion = "1.0.0"'
      );

      const result = await generatePipeline('github-actions', testDir);

      expect(result.success).toBe(true);
      expect(result.projectTypes).toContain('python');
      expect(fs.existsSync(path.join(testDir, '.github', 'workflows', 'ci.yml'))).toBe(true);

      const content = fs.readFileSync(path.join(testDir, '.github', 'workflows', 'ci.yml'), 'utf8');
      const parsed = yaml.load(content);

      expect(parsed.name).toBe('Python CI');
      expect(parsed.jobs['build-and-test']).toBeDefined();
    });

    it('should backup existing pipeline configuration', async () => {
      fs.writeFileSync(path.join(testDir, 'package.json'), '{}');
      fs.mkdirSync(path.join(testDir, '.github', 'workflows'), { recursive: true });
      fs.writeFileSync(path.join(testDir, '.github', 'workflows', 'ci.yml'), 'existing content');

      await generatePipeline('github-actions', testDir);

      // Check that backup was created
      const files = fs.readdirSync(path.join(testDir, '.github', 'workflows'));
      const backupFiles = files.filter(f => f.startsWith('ci.yml.backup-'));

      expect(backupFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Template Validation', () => {
    it('should have valid YAML syntax in all GitHub Actions templates', () => {
      const templatesDir = path.join(__dirname, '..', '..', 'templates', 'github-actions');
      const templates = fs.readdirSync(templatesDir).filter(f => f.endsWith('.yml'));

      for (const template of templates) {
        const content = fs.readFileSync(path.join(templatesDir, template), 'utf8');
        expect(() => yaml.load(content)).not.toThrow();
      }
    });

    it('should have valid YAML syntax in all GitLab CI templates', () => {
      const templatesDir = path.join(__dirname, '..', '..', 'templates', 'gitlab-ci');
      const templates = fs.readdirSync(templatesDir).filter(f => f.endsWith('.yml'));

      for (const template of templates) {
        const content = fs.readFileSync(path.join(templatesDir, template), 'utf8');
        expect(() => yaml.load(content)).not.toThrow();
      }
    });

    it('should have valid YAML syntax in all Bitbucket Pipelines templates', () => {
      const templatesDir = path.join(__dirname, '..', '..', 'templates', 'bitbucket-pipelines');
      const templates = fs.readdirSync(templatesDir).filter(f => f.endsWith('.yml'));

      for (const template of templates) {
        const content = fs.readFileSync(path.join(templatesDir, template), 'utf8');
        expect(() => yaml.load(content)).not.toThrow();
      }
    });
  });

  describe('Error Handling', () => {
    it('should return error for unsupported project type', async () => {
      // Empty directory with no project files
      const result = await generatePipeline('github-actions', testDir);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No supported project type detected');
    });

    it('should return error for invalid platform', async () => {
      fs.writeFileSync(path.join(testDir, 'package.json'), '{}');

      const result = await generatePipeline('invalid-platform', testDir);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid platform');
    });
  });
});
