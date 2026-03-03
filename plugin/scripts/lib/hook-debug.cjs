/**
 * Hook Debug Utility (CJS)
 *
 * Diagnostic logging for Claude Code hooks, activated via MAGIC_CLAUDE_HOOK_DEBUG=1
 * All output goes to stderr — never interferes with the hook protocol on stdout.
 *
 * Usage in CJS hooks:
 *   const { debugHook, wrapHookMain } = require('../lib/hook-debug.cjs');
 *   wrapHookMain('my-hook-name', (input) => { ... });
 */

const HOOK_DEBUG = process.env.MAGIC_CLAUDE_HOOK_DEBUG === '1' || process.env.MAGIC_CLAUDE_HOOK_DEBUG === 'true';

/**
 * Log a debug message to stderr (only when MAGIC_CLAUDE_HOOK_DEBUG=1)
 * @param {string} hookName - Name/identifier of the calling hook
 * @param {string} phase - Phase: 'input', 'process', 'output', 'error', 'exit'
 * @param {string} message - Debug message
 * @param {*} [data] - Optional data to log
 */
function debugHook(hookName, phase, message, data) {
  if (!HOOK_DEBUG) return;
  const timestamp = new Date().toISOString();
  const prefix = `[HookDebug ${timestamp}] [${hookName}] [${phase}]`;
  if (data !== undefined) {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const truncated = dataStr.length > 2000 ? dataStr.slice(0, 2000) + '... (truncated)' : dataStr;
    console.error(`${prefix} ${message}: ${truncated}`);
  } else {
    console.error(`${prefix} ${message}`);
  }
}

/**
 * Wrap a CJS hook's main logic with comprehensive debug logging.
 * Handles stdin reading, JSON parsing, error catching, and output monitoring.
 *
 * @param {string} hookName - Name of the hook (e.g., 'typescript-checker')
 * @param {(input: object) => void} handler - Hook logic receiving parsed stdin input
 */
function wrapHookMain(hookName, handler) {
  // Catch unhandled errors at the process level
  process.on('uncaughtException', (err) => {
    debugHook(hookName, 'error', 'Uncaught exception', err.stack || err.message);
    console.error(`[${hookName}] Uncaught exception: ${err.message}`);
    process.exit(0); // Exit cleanly to not break Claude Code
  });

  process.on('unhandledRejection', (reason) => {
    debugHook(hookName, 'error', 'Unhandled rejection', String(reason));
    console.error(`[${hookName}] Unhandled rejection: ${reason}`);
    process.exit(0);
  });

  // Monitor stdout to log what we're sending back
  if (HOOK_DEBUG) {
    const originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = function(chunk, encoding, callback) {
      debugHook(hookName, 'output', 'stdout write', typeof chunk === 'string' ? chunk : chunk.toString());
      return originalWrite(chunk, encoding, callback);
    };
  }

  debugHook(hookName, 'input', 'Hook starting', { pid: process.pid, cwd: process.cwd() });

  let data = '';
  process.stdin.on('data', chunk => data += chunk);
  process.stdin.on('end', () => {
    try {
      debugHook(hookName, 'input', 'Raw stdin length', data.length);

      if (!data.trim()) {
        debugHook(hookName, 'input', 'Empty stdin — exiting cleanly');
        process.exit(0);
      }

      const input = JSON.parse(data);
      debugHook(hookName, 'input', 'Parsed OK', {
        tool_name: input.tool_name,
        file_path: input.tool_input?.file_path,
        has_tool_result: !!input.tool_result
      });

      handler(input);
    } catch (error) {
      debugHook(hookName, 'error', 'Handler error', { message: error.message, stack: error.stack });
      console.error(`[${hookName}] Error: ${error.message}`);
      process.exit(0);
    }
  });

  process.stdin.on('error', (error) => {
    debugHook(hookName, 'error', 'Stdin error', error.message);
    console.error(`[${hookName}] Stdin error: ${error.message}`);
    process.exit(0);
  });
}

module.exports = { debugHook, wrapHookMain, HOOK_DEBUG };
