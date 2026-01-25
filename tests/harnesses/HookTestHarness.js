import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * HookTestHarness - Test hook scripts by simulating Claude Code's stdin/stdout protocol
 *
 * Usage:
 *   const harness = new HookTestHarness();
 *   const result = await harness.executeHook('./path/to/hook.js', toolContext);
 */
export class HookTestHarness {
  /**
   * Execute a hook script by simulating Claude Code's stdin/stdout protocol
   *
   * @param {string} hookScriptPath - Absolute path to the hook script
   * @param {object} toolContext - Tool context to pass via stdin
   * @param {object} options - Optional execution options
   * @returns {Promise<object>} - { exitCode, stdout, stderr, passedThrough }
   */
  async executeHook(hookScriptPath, toolContext, options = {}) {
    const {
      cwd = process.cwd(),
      timeout = 10000,
      env = {}
    } = options;

    return new Promise((resolve, reject) => {
      const hookProcess = spawn('node', [hookScriptPath], {
        cwd,
        env: {
          ...process.env,
          CLAUDE_PLUGIN_ROOT: path.resolve(__dirname, '../..'),
          ...env
        },
        timeout
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Set timeout
      const timeoutId = setTimeout(() => {
        timedOut = true;
        hookProcess.kill('SIGTERM');
      }, timeout);

      hookProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      hookProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      hookProcess.on('close', (code) => {
        clearTimeout(timeoutId);

        if (timedOut) {
          reject(new Error(`Hook execution timed out after ${timeout}ms`));
          return;
        }

        let passedThrough = null;
        let parseError = null;

        // Try to parse stdout as JSON (pass-through protocol)
        if (stdout.trim()) {
          try {
            passedThrough = JSON.parse(stdout.trim());
          } catch (error) {
            parseError = error.message;
          }
        }

        resolve({
          exitCode: code,
          stdout,
          stderr,
          passedThrough,
          parseError,
          timedOut: false
        });
      });

      hookProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });

      // Simulate Claude Code sending tool context via stdin
      if (toolContext) {
        hookProcess.stdin.write(JSON.stringify(toolContext));
      }
      hookProcess.stdin.end();
    });
  }

  /**
   * Create mock tool context for testing
   *
   * @param {string} tool - Tool name (e.g., "Edit", "Write", "Bash")
   * @param {object} toolInput - Tool input parameters
   * @param {object} toolOutput - Tool output (optional)
   * @returns {object} - Mock tool context
   */
  mockToolContext(tool, toolInput = {}, toolOutput = {}) {
    return {
      tool,
      tool_input: toolInput,
      tool_output: toolOutput,
      timestamp: new Date().toISOString(),
      cwd: process.cwd()
    };
  }

  /**
   * Helper: Create Edit tool context
   */
  mockEditContext(filePath, oldString, newString) {
    return this.mockToolContext('Edit', {
      file_path: filePath,
      old_string: oldString,
      new_string: newString
    });
  }

  /**
   * Helper: Create Write tool context
   */
  mockWriteContext(filePath, content) {
    return this.mockToolContext('Write', {
      file_path: filePath,
      content
    });
  }

  /**
   * Helper: Create Bash tool context
   */
  mockBashContext(command, description = '') {
    return this.mockToolContext('Bash', {
      command,
      description
    });
  }

  /**
   * Helper: Create Read tool context
   */
  mockReadContext(filePath) {
    return this.mockToolContext('Read', {
      file_path: filePath
    });
  }

  /**
   * Assert that hook passed through the context unchanged
   */
  assertPassThrough(result, originalContext) {
    if (!result.passedThrough) {
      throw new Error(
        `Expected hook to pass through context. ` +
        `Got parseError: ${result.parseError}, stdout: ${result.stdout}`
      );
    }

    // Deep comparison of key fields
    const expected = JSON.stringify(originalContext);
    const actual = JSON.stringify(result.passedThrough);

    if (expected !== actual) {
      throw new Error(
        `Hook modified the context.\n` +
        `Expected: ${expected}\n` +
        `Actual: ${actual}`
      );
    }
  }

  /**
   * Assert that hook exited successfully (exit code 0)
   */
  assertSuccess(result) {
    if (result.exitCode !== 0) {
      throw new Error(
        `Hook failed with exit code ${result.exitCode}.\n` +
        `stderr: ${result.stderr}\n` +
        `stdout: ${result.stdout}`
      );
    }
  }

  /**
   * Assert that hook logged a specific message to stderr
   */
  assertStderrContains(result, message) {
    if (!result.stderr.includes(message)) {
      throw new Error(
        `Expected stderr to contain "${message}".\n` +
        `Actual stderr: ${result.stderr}`
      );
    }
  }

  /**
   * Assert that hook did NOT log a specific message to stderr
   */
  assertStderrNotContains(result, message) {
    if (result.stderr.includes(message)) {
      throw new Error(
        `Expected stderr NOT to contain "${message}".\n` +
        `Actual stderr: ${result.stderr}`
      );
    }
  }
}
