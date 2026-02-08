import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HookTestHarness } from './HookTestHarness.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('HookTestHarness', () => {
  let harness;
  let testHooksDir;

  beforeAll(async () => {
    harness = new HookTestHarness();
    testHooksDir = path.join(__dirname, 'test-hooks');
    await fs.mkdir(testHooksDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test hooks
    try {
      await fs.rm(testHooksDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('executeHook', () => {
    it('should execute a simple pass-through hook', async () => {
      // Create a simple hook that passes through stdin to stdout
      const hookPath = path.join(testHooksDir, 'pass-through.js');
      await fs.writeFile(
        hookPath,
        `
import { stdin, stdout } from 'process';

let data = '';
stdin.on('data', chunk => { data += chunk; });
stdin.on('end', () => {
  stdout.write(data);
  process.exit(0);
});
        `.trim()
      );

      const context = harness.mockToolContext('Edit', { file_path: '/test.js' });
      const result = await harness.executeHook(hookPath, context);

      expect(result.exitCode).toBe(0);
      expect(result.passedThrough).toEqual(context);
      harness.assertSuccess(result);
      harness.assertPassThrough(result, context);
    });

    it('should capture stderr output from hook', async () => {
      // Create a hook that logs to stderr
      const hookPath = path.join(testHooksDir, 'stderr-logger.js');
      await fs.writeFile(
        hookPath,
        `
import { stdin, stdout, stderr } from 'process';

let data = '';
stdin.on('data', chunk => { data += chunk; });
stdin.on('end', () => {
  stderr.write('[Hook] Processing file\\n');
  stderr.write('[Hook] Formatting completed\\n');
  stdout.write(data);
  process.exit(0);
});
        `.trim()
      );

      const context = harness.mockToolContext('Edit', { file_path: '/test.py' });
      const result = await harness.executeHook(hookPath, context);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('[Hook] Processing file');
      expect(result.stderr).toContain('[Hook] Formatting completed');
      harness.assertStderrContains(result, 'Processing file');
    });

    it('should handle hook with non-zero exit code', async () => {
      // Create a hook that exits with error
      const hookPath = path.join(testHooksDir, 'failing-hook.js');
      await fs.writeFile(
        hookPath,
        `
import { stdin, stdout, stderr } from 'process';

let data = '';
stdin.on('data', chunk => { data += chunk; });
stdin.on('end', () => {
  stderr.write('[Hook] Error: Something went wrong\\n');
  stdout.write(data);
  process.exit(1);
});
        `.trim()
      );

      const context = harness.mockToolContext('Edit', { file_path: '/test.js' });
      const result = await harness.executeHook(hookPath, context);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Error: Something went wrong');
    });

    it('should timeout if hook takes too long', async () => {
      // Create a hook that never completes
      const hookPath = path.join(testHooksDir, 'slow-hook.js');
      await fs.writeFile(
        hookPath,
        `
// Never complete
setInterval(() => {}, 1000);
        `.trim()
      );

      const context = harness.mockToolContext('Edit', { file_path: '/test.js' });

      await expect(
        harness.executeHook(hookPath, context, { timeout: 500 })
      ).rejects.toThrow(/timed out/i);
    });

    it('should pass CLAUDE_PLUGIN_ROOT environment variable', async () => {
      // Create a hook that outputs the env var
      const hookPath = path.join(testHooksDir, 'env-check.js');
      await fs.writeFile(
        hookPath,
        `
import { stdin, stdout, stderr } from 'process';

let data = '';
stdin.on('data', chunk => { data += chunk; });
stdin.on('end', () => {
  stderr.write(\`CLAUDE_PLUGIN_ROOT=\${process.env.CLAUDE_PLUGIN_ROOT}\\n\`);
  stdout.write(data);
  process.exit(0);
});
        `.trim()
      );

      const context = harness.mockToolContext('Edit', { file_path: '/test.js' });
      const result = await harness.executeHook(hookPath, context);

      expect(result.stderr).toContain('CLAUDE_PLUGIN_ROOT=');
      expect(result.stderr).toContain('magic-claude');
    });
  });

  describe('mockToolContext', () => {
    it('should create valid tool context', () => {
      const context = harness.mockToolContext('Edit', {
        file_path: '/test.js',
        old_string: 'foo',
        new_string: 'bar'
      });

      expect(context).toHaveProperty('tool', 'Edit');
      expect(context).toHaveProperty('tool_input');
      expect(context.tool_input).toHaveProperty('file_path', '/test.js');
      expect(context).toHaveProperty('timestamp');
    });
  });

  describe('mockEditContext', () => {
    it('should create Edit tool context', () => {
      const context = harness.mockEditContext('/test.js', 'old', 'new');

      expect(context.tool).toBe('Edit');
      expect(context.tool_input.file_path).toBe('/test.js');
      expect(context.tool_input.old_string).toBe('old');
      expect(context.tool_input.new_string).toBe('new');
    });
  });

  describe('mockWriteContext', () => {
    it('should create Write tool context', () => {
      const context = harness.mockWriteContext('/test.js', 'console.log("test")');

      expect(context.tool).toBe('Write');
      expect(context.tool_input.file_path).toBe('/test.js');
      expect(context.tool_input.content).toBe('console.log("test")');
    });
  });

  describe('mockBashContext', () => {
    it('should create Bash tool context', () => {
      const context = harness.mockBashContext('npm test', 'Run tests');

      expect(context.tool).toBe('Bash');
      expect(context.tool_input.command).toBe('npm test');
      expect(context.tool_input.description).toBe('Run tests');
    });
  });

  describe('mockReadContext', () => {
    it('should create Read tool context', () => {
      const context = harness.mockReadContext('/test.js');

      expect(context.tool).toBe('Read');
      expect(context.tool_input.file_path).toBe('/test.js');
    });
  });

  describe('assertPassThrough', () => {
    it('should pass when context is unchanged', async () => {
      const hookPath = path.join(testHooksDir, 'simple-pass-through.js');
      await fs.writeFile(
        hookPath,
        `
import { stdin, stdout } from 'process';
let data = '';
stdin.on('data', chunk => { data += chunk; });
stdin.on('end', () => { stdout.write(data); process.exit(0); });
        `.trim()
      );

      const context = harness.mockEditContext('/test.js', 'a', 'b');
      const result = await harness.executeHook(hookPath, context);

      expect(() => {
        harness.assertPassThrough(result, context);
      }).not.toThrow();
    });

    it('should fail when context is modified', async () => {
      const hookPath = path.join(testHooksDir, 'modifying-hook.js');
      await fs.writeFile(
        hookPath,
        `
import { stdin, stdout } from 'process';
let data = '';
stdin.on('data', chunk => { data += chunk; });
stdin.on('end', () => {
  const ctx = JSON.parse(data);
  ctx.modified = true;
  stdout.write(JSON.stringify(ctx));
  process.exit(0);
});
        `.trim()
      );

      const context = harness.mockEditContext('/test.js', 'a', 'b');
      const result = await harness.executeHook(hookPath, context);

      expect(() => {
        harness.assertPassThrough(result, context);
      }).toThrow(/modified the context/);
    });
  });

  describe('assertSuccess', () => {
    it('should pass when exit code is 0', async () => {
      const hookPath = path.join(testHooksDir, 'success-hook.js');
      await fs.writeFile(hookPath, 'process.exit(0);');

      const result = await harness.executeHook(hookPath, null);

      expect(() => {
        harness.assertSuccess(result);
      }).not.toThrow();
    });

    it('should fail when exit code is non-zero', async () => {
      const hookPath = path.join(testHooksDir, 'error-hook.js');
      await fs.writeFile(hookPath, 'process.exit(1);');

      const result = await harness.executeHook(hookPath, null);

      expect(() => {
        harness.assertSuccess(result);
      }).toThrow(/failed with exit code 1/);
    });
  });

  describe('assertStderrContains', () => {
    it('should pass when message is in stderr', async () => {
      const hookPath = path.join(testHooksDir, 'stderr-message.js');
      await fs.writeFile(
        hookPath,
        `
import { stderr } from 'process';
stderr.write('[Hook] Test message\\n');
process.exit(0);
        `.trim()
      );

      const result = await harness.executeHook(hookPath, null);

      expect(() => {
        harness.assertStderrContains(result, 'Test message');
      }).not.toThrow();
    });

    it('should fail when message is not in stderr', async () => {
      const hookPath = path.join(testHooksDir, 'empty-stderr.js');
      await fs.writeFile(hookPath, 'process.exit(0);');

      const result = await harness.executeHook(hookPath, null);

      expect(() => {
        harness.assertStderrContains(result, 'Missing message');
      }).toThrow(/Expected stderr to contain/);
    });
  });

  describe('assertStderrNotContains', () => {
    it('should pass when message is not in stderr', async () => {
      const hookPath = path.join(testHooksDir, 'clean-stderr.js');
      await fs.writeFile(hookPath, 'process.exit(0);');

      const result = await harness.executeHook(hookPath, null);

      expect(() => {
        harness.assertStderrNotContains(result, 'Unwanted message');
      }).not.toThrow();
    });

    it('should fail when message is in stderr', async () => {
      const hookPath = path.join(testHooksDir, 'warning-stderr.js');
      await fs.writeFile(
        hookPath,
        `
import { stderr } from 'process';
stderr.write('[Hook] Warning: Something happened\\n');
process.exit(0);
        `.trim()
      );

      const result = await harness.executeHook(hookPath, null);

      expect(() => {
        harness.assertStderrNotContains(result, 'Warning');
      }).toThrow(/Expected stderr NOT to contain/);
    });
  });
});
