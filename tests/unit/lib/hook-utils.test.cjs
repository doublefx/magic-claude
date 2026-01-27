import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  readHookInputSync,
  writeHookOutput,
  shouldProcessFile,
  matchesCommand,
  getFilePath,
  getCommand,
  getToolName,
  logHook,
  detectProjectType
} from '@lib/hook-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('hook-utils', () => {
  const fixturesDir = path.join(__dirname, '../../fixtures');

  describe('getFilePath', () => {
    it('should extract file path from context', () => {
      const context = {
        tool: 'Edit',
        tool_input: { file_path: '/path/to/file.ts' }
      };
      expect(getFilePath(context)).toBe('/path/to/file.ts');
    });

    it('should return null if no file path', () => {
      const context = { tool: 'Bash', tool_input: { command: 'ls' } };
      expect(getFilePath(context)).toBeNull();
    });

    it('should handle null context', () => {
      expect(getFilePath(null)).toBeNull();
    });
  });

  describe('getCommand', () => {
    it('should extract command from context', () => {
      const context = {
        tool: 'Bash',
        tool_input: { command: 'npm test' }
      };
      expect(getCommand(context)).toBe('npm test');
    });

    it('should return null if no command', () => {
      const context = { tool: 'Edit', tool_input: { file_path: '/file.ts' } };
      expect(getCommand(context)).toBeNull();
    });

    it('should handle null context', () => {
      expect(getCommand(null)).toBeNull();
    });
  });

  describe('getToolName', () => {
    it('should extract tool name from context', () => {
      const context = { tool: 'Edit', tool_input: {} };
      expect(getToolName(context)).toBe('Edit');
    });

    it('should return null if no tool', () => {
      const context = { tool_input: {} };
      expect(getToolName(context)).toBeNull();
    });

    it('should handle null context', () => {
      expect(getToolName(null)).toBeNull();
    });
  });

  describe('matchesCommand', () => {
    it('should match command with string pattern', () => {
      expect(matchesCommand('npm install', 'npm')).toBe(true);
      expect(matchesCommand('npm install', 'install')).toBe(true);
      expect(matchesCommand('npm install', 'yarn')).toBe(false);
    });

    it('should match command with regex pattern', () => {
      expect(matchesCommand('npm install', /npm/)).toBe(true);
      expect(matchesCommand('npm install', /^npm\s+install/)).toBe(true);
      expect(matchesCommand('npm install', /yarn/)).toBe(false);
    });

    it('should handle invalid inputs', () => {
      expect(matchesCommand(null, 'npm')).toBe(false);
      expect(matchesCommand('npm', null)).toBe(false);
      expect(matchesCommand('', 'npm')).toBe(false);
    });
  });

  describe('shouldProcessFile', () => {
    it('should return true for matching extension and project type', () => {
      const pythonProject = path.join(fixturesDir, 'sample-python-project');
      const result = shouldProcessFile(
        '/path/to/file.py',
        ['.py', '.pyx'],
        ['python'],
        pythonProject
      );
      expect(result).toBe(true);
    });

    it('should return false for non-matching extension', () => {
      const pythonProject = path.join(fixturesDir, 'sample-python-project');
      const result = shouldProcessFile(
        '/path/to/file.ts',
        ['.py', '.pyx'],
        ['python'],
        pythonProject
      );
      expect(result).toBe(false);
    });

    it('should return false for non-matching project type', () => {
      const mavenProject = path.join(fixturesDir, 'sample-maven-project');
      const result = shouldProcessFile(
        '/path/to/file.py',
        ['.py', '.pyx'],
        ['python'],
        mavenProject
      );
      expect(result).toBe(false);
    });

    it('should handle no required project types', () => {
      const result = shouldProcessFile(
        '/path/to/file.md',
        ['.md'],
        [],
        process.cwd()
      );
      expect(result).toBe(true);
    });

    it('should handle null file path', () => {
      const result = shouldProcessFile(
        null,
        ['.py'],
        ['python'],
        process.cwd()
      );
      expect(result).toBe(false);
    });

    it('should handle multiple allowed extensions', () => {
      const nodejsProject = path.join(fixturesDir, 'sample-monorepo/frontend');
      const result1 = shouldProcessFile(
        '/path/to/file.ts',
        ['.ts', '.tsx', '.js', '.jsx'],
        ['nodejs'],
        nodejsProject
      );
      const result2 = shouldProcessFile(
        '/path/to/file.jsx',
        ['.ts', '.tsx', '.js', '.jsx'],
        ['nodejs'],
        nodejsProject
      );
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should handle multiple required project types (OR logic)', () => {
      const mavenProject = path.join(fixturesDir, 'sample-maven-project');
      const result = shouldProcessFile(
        '/path/to/file.java',
        ['.java'],
        ['maven', 'gradle'],
        mavenProject
      );
      expect(result).toBe(true); // maven project matches one of the required types
    });
  });

  describe('writeHookOutput', () => {
    let originalLog;
    let logOutput = [];

    beforeEach(() => {
      originalLog = console.log;
      logOutput = [];
      console.log = (msg) => logOutput.push(msg);
    });

    afterEach(() => {
      console.log = originalLog;
    });

    it('should write context as JSON string', () => {
      const context = { tool: 'Edit', tool_input: { file_path: '/test.ts' } };
      writeHookOutput(context);
      expect(logOutput.length).toBe(1);
      expect(JSON.parse(logOutput[0])).toEqual(context);
    });

    it('should write string context as-is', () => {
      const context = '{"tool":"Edit"}';
      writeHookOutput(context);
      expect(logOutput.length).toBe(1);
      expect(logOutput[0]).toBe(context);
    });

    it('should handle null context gracefully', () => {
      writeHookOutput(null);
      // Should still output something (either warning or empty object)
      expect(logOutput.length).toBeGreaterThan(0);
    });
  });

  describe('logHook', () => {
    let originalError;
    let errorOutput = [];

    beforeEach(() => {
      originalError = console.error;
      errorOutput = [];
      console.error = (msg) => errorOutput.push(msg);
    });

    afterEach(() => {
      console.error = originalError;
    });

    it('should log INFO messages to stderr', () => {
      logHook('Test message', 'INFO');
      expect(errorOutput.length).toBe(1);
      expect(errorOutput[0]).toContain('[Hook]');
      expect(errorOutput[0]).toContain('Test message');
    });

    it('should log WARNING messages to stderr', () => {
      logHook('Test warning', 'WARNING');
      expect(errorOutput.length).toBe(1);
      expect(errorOutput[0]).toContain('[Hook WARNING]');
      expect(errorOutput[0]).toContain('Test warning');
    });

    it('should log ERROR messages to stderr', () => {
      logHook('Test error', 'ERROR');
      expect(errorOutput.length).toBe(1);
      expect(errorOutput[0]).toContain('[Hook ERROR]');
      expect(errorOutput[0]).toContain('Test error');
    });

    it('should default to INFO level', () => {
      logHook('Default level');
      expect(errorOutput.length).toBe(1);
      expect(errorOutput[0]).toContain('[Hook]');
    });
  });

  describe('detectProjectType re-export', () => {
    it('should re-export detectProjectType', () => {
      expect(typeof detectProjectType).toBe('function');
    });

    it('should detect project type correctly', () => {
      const pythonProject = path.join(fixturesDir, 'sample-python-project');
      const types = detectProjectType(pythonProject);
      expect(types).toContain('python');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle typical Edit hook workflow', () => {
      const context = {
        tool: 'Edit',
        tool_input: { file_path: '/path/to/file.py' }
      };

      const filePath = getFilePath(context);
      const pythonProject = path.join(fixturesDir, 'sample-python-project');
      const shouldProcess = shouldProcessFile(
        filePath,
        ['.py'],
        ['python'],
        pythonProject
      );

      expect(shouldProcess).toBe(true);
    });

    it('should handle typical Bash hook workflow', () => {
      const context = {
        tool: 'Bash',
        tool_input: { command: 'mvn install' }
      };

      const command = getCommand(context);
      const matches = matchesCommand(command, /mvn\s+install/);

      expect(matches).toBe(true);
    });

    it('should handle non-matching Edit hook scenario', () => {
      const context = {
        tool: 'Edit',
        tool_input: { file_path: '/path/to/file.py' }
      };

      const filePath = getFilePath(context);
      const mavenProject = path.join(fixturesDir, 'sample-maven-project');
      const shouldProcess = shouldProcessFile(
        filePath,
        ['.py'],
        ['python'],
        mavenProject
      );

      expect(shouldProcess).toBe(false);
    });
  });
});
