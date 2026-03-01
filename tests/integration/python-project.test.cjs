import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fsSync from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import modules under test
import { detectProjectType, clearCache } from '@lib/detect-project-type.js';
import { shouldProcessFile } from '@lib/hook-utils.js';

describe('Python project integration', () => {
  const fixturesDir = path.join(__dirname, '../fixtures');
  const pythonProjectDir = path.join(fixturesDir, 'sample-python-project');

  beforeEach(() => {
    clearCache(pythonProjectDir);
  });

  describe('Project detection', () => {
    it('should detect Python project', () => {
      const types = detectProjectType(pythonProjectDir);
      expect(types).toContain('python');
    });

    it('should cache detection results', () => {
      const types1 = detectProjectType(pythonProjectDir);
      const cacheFile = path.join(pythonProjectDir, '.claude', 'project-type.json');
      expect(fsSync.existsSync(cacheFile)).toBe(true);

      const types2 = detectProjectType(pythonProjectDir);
      expect(types2).toEqual(types1);
    });
  });

  describe('File filtering', () => {
    it('should process .py files in Python projects', () => {
      const pyFile = path.join(pythonProjectDir, 'src', 'main.py');
      const shouldProcess = shouldProcessFile(pyFile, ['.py'], ['python'], pythonProjectDir);
      expect(shouldProcess).toBe(true);
    });

    it('should not process non-.py files', () => {
      const jsFile = path.join(pythonProjectDir, 'some-file.js');
      const shouldProcess = shouldProcessFile(jsFile, ['.py'], ['python'], pythonProjectDir);
      expect(shouldProcess).toBe(false);
    });
  });

  describe('Smart formatter integration', () => {
    it('should have smart-formatter.js hook', async () => {
      const hookPath = path.join(__dirname, '../../plugin/scripts/hooks/smart-formatter.cjs');
      const exists = await fs.access(hookPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should handle Python files', async () => {
      const hookPath = path.join(__dirname, '../../plugin/scripts/hooks/smart-formatter.cjs');
      const content = await fs.readFile(hookPath, 'utf8');
      expect(content).toContain('.py');
      expect(content).toContain('python');
    });
  });

  describe('Security hook integration', () => {
    it('should have python-security.js hook', async () => {
      const hookPath = path.join(__dirname, '../../plugin/scripts/hooks/python-security.cjs');
      const exists = await fs.access(hookPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should be executable', async () => {
      const hookPath = path.join(__dirname, '../../plugin/scripts/hooks/python-security.cjs');
      const stats = await fs.stat(hookPath);
      const isExecutable = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBe(true);
    });
  });

  describe('Python reviewer agent', () => {
    it('should exist', async () => {
      const agentPath = path.join(__dirname, '../../plugin/agents/python-reviewer.md');
      const exists = await fs.access(agentPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should have frontmatter', async () => {
      const agentPath = path.join(__dirname, '../../plugin/agents/python-reviewer.md');
      const content = await fs.readFile(agentPath, 'utf8');
      expect(content).toMatch(/^---/);
      expect(content).toContain('name: python-reviewer');
    });

    it('should mention modern tools', async () => {
      const agentPath = path.join(__dirname, '../../plugin/agents/python-reviewer.md');
      const content = await fs.readFile(agentPath, 'utf8');
      expect(content).toContain('Ruff');
      expect(content).toContain('Semgrep');
    });
  });

  describe('Python patterns skill', () => {
    it('should exist', async () => {
      const skillPath = path.join(__dirname, '../../plugin/skills/python-patterns/SKILL.md');
      const exists = await fs.access(skillPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should cover modern packaging', async () => {
      const skillPath = path.join(__dirname, '../../plugin/skills/python-patterns/SKILL.md');
      const content = await fs.readFile(skillPath, 'utf8');
      expect(content).toContain('uv');
      expect(content).toContain('poetry');
    });
  });

  describe('Python style rules', () => {
    it('should exist', async () => {
      const rulesPath = path.join(__dirname, '../../plugin/rules/python-style.md');
      const exists = await fs.access(rulesPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should reference PEP 8', async () => {
      const rulesPath = path.join(__dirname, '../../plugin/rules/python-style.md');
      const content = await fs.readFile(rulesPath, 'utf8');
      expect(content).toMatch(/PEP.*8/i);
    });
  });

  describe('Phase 2 deliverables', () => {
    it('should have all required files', async () => {
      const deliverables = [
        'plugin/agents/python-reviewer.md',
        'plugin/skills/python-patterns/SKILL.md',
        'plugin/rules/python-style.md',
        'plugin/scripts/hooks/python-security.cjs',
        'plugin/scripts/hooks/smart-formatter.cjs',
      ];

      for (const deliverable of deliverables) {
        const filePath = path.join(__dirname, '../..', deliverable);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        expect(exists, `Missing: ${deliverable}`).toBe(true);
      }
    });
  });
});
