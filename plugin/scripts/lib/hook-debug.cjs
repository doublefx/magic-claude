/**
 * Hook Debug Utility (CJS)
 *
 * Diagnostic logging for Claude Code hooks.
 * Logs to $CLAUDE_CONFIG_DIR/hook-debug.log (viewable via `tail -f` on that path)
 * Also outputs to stderr (visible in Claude Code --verbose mode).
 *
 * Activation (Claude Code does NOT propagate custom env vars to hooks):
 *   touch $CLAUDE_CONFIG_DIR/hook-debug.enabled    # enable
 *   rm $CLAUDE_CONFIG_DIR/hook-debug.enabled       # disable
 *
 * Usage in CJS hooks:
 *   const { debugHook, wrapHookMain } = require('../lib/hook-debug.cjs');
 *   wrapHookMain('my-hook-name', (input) => { ... });
 */

const fs = require('fs');
const pathModule = require('path');
const os = require('os');
const { logTelemetry } = require('./hook-telemetry.cjs');

const CLAUDE_CONFIG_DIR = process.env.CLAUDE_CONFIG_DIR || pathModule.join(os.homedir(), '.claude');
const HOOK_DEBUG_MARKER = pathModule.join(CLAUDE_CONFIG_DIR, 'hook-debug.enabled');
const LOG_FILE = pathModule.join(CLAUDE_CONFIG_DIR, 'hook-debug.log');

/**
 * Check if debug mode is active.
 * Primary: marker file at $CLAUDE_CONFIG_DIR/hook-debug.enabled
 * Fallback: MAGIC_CLAUDE_HOOK_DEBUG=1 env var (works for manual testing)
 */
function isDebugEnabled() {
  try {
    if (fs.existsSync(HOOK_DEBUG_MARKER)) return true;
  } catch { /* ignore */ }
  return process.env.MAGIC_CLAUDE_HOOK_DEBUG === '1' || process.env.MAGIC_CLAUDE_HOOK_DEBUG === 'true';
}

const HOOK_DEBUG = isDebugEnabled();

/**
 * Append a log line to the debug log file (sync, fire-and-forget)
 * @param {string} line - Log line to append
 */
function appendLog(line) {
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch {
    // If we can't write the log file, silently ignore — don't break the hook
  }
}

/**
 * Log a debug message to file + stderr (only when debug is active)
 * @param {string} hookName - Name/identifier of the calling hook
 * @param {string} phase - Phase: 'input', 'process', 'output', 'error', 'exit'
 * @param {string} message - Debug message
 * @param {*} [data] - Optional data to log
 */
function debugHook(hookName, phase, message, data) {
  if (!HOOK_DEBUG) return;
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${hookName}] [${phase}]`;
  let line;
  if (data !== undefined) {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const truncated = dataStr.length > 2000 ? dataStr.slice(0, 2000) + '... (truncated)' : dataStr;
    line = `${prefix} ${message}: ${truncated}`;
  } else {
    line = `${prefix} ${message}`;
  }
  appendLog(line);
  console.error(line);
}

/**
 * Wrap a CJS hook's main logic with comprehensive debug logging and telemetry.
 * Handles stdin reading, JSON parsing, error catching, output monitoring,
 * and structured telemetry logging.
 *
 * The handler can optionally return { outcome, reason } for telemetry.
 * If it doesn't return anything, telemetry logs outcome as 'fired' (ran without error).
 *
 * @param {string} hookName - Name of the hook (e.g., 'typescript-checker')
 * @param {(input: object) => {outcome: string, reason: string} | void} handler - Hook logic receiving parsed stdin input
 * @param {object} [options] - Additional options
 * @param {string} [options.event] - Hook event type for telemetry (auto-detected if not provided)
 */
function wrapHookMain(hookName, handler, options = {}) {
  // Catch unhandled errors at the process level
  process.on('uncaughtException', (err) => {
    debugHook(hookName, 'error', 'Uncaught exception', err.stack || err.message);
    logTelemetry({ hook: hookName, event: options.event || 'unknown', outcome: 'error', reason: `uncaught: ${err.message}` });
    console.error(`[${hookName}] Uncaught exception: ${err.message}`);
    process.exit(0); // Exit cleanly to not break Claude Code
  });

  process.on('unhandledRejection', (reason) => {
    debugHook(hookName, 'error', 'Unhandled rejection', String(reason));
    logTelemetry({ hook: hookName, event: options.event || 'unknown', outcome: 'error', reason: `rejection: ${reason}` });
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
    const start = Date.now();
    try {
      debugHook(hookName, 'input', 'Raw stdin length', data.length);

      if (!data.trim()) {
        debugHook(hookName, 'input', 'Empty stdin — exiting cleanly');
        logTelemetry({ hook: hookName, event: options.event || 'unknown', outcome: 'skipped', reason: 'empty stdin', duration_ms: Date.now() - start });
        process.exit(0);
      }

      const input = JSON.parse(data);
      const eventType = options.event || input.hook_event_name || input.tool_name || 'unknown';
      const file = input.tool_input?.file_path;
      const tool = input.tool_name;

      debugHook(hookName, 'input', 'Parsed OK', {
        tool_name: tool,
        file_path: file,
        has_tool_result: !!input.tool_result
      });

      const result = handler(input);
      const duration_ms = Date.now() - start;

      // Log telemetry from handler result or default
      if (result && result.outcome) {
        logTelemetry({ hook: hookName, event: eventType, outcome: result.outcome, reason: result.reason || '', duration_ms, file, tool });
      } else {
        logTelemetry({ hook: hookName, event: eventType, outcome: 'fired', reason: 'completed', duration_ms, file, tool });
      }
    } catch (error) {
      debugHook(hookName, 'error', 'Handler error', { message: error.message, stack: error.stack });
      logTelemetry({ hook: hookName, event: options.event || 'unknown', outcome: 'error', reason: error.message, duration_ms: Date.now() - start });
      console.error(`[${hookName}] Error: ${error.message}`);
      process.exit(0);
    }
  });

  process.stdin.on('error', (error) => {
    debugHook(hookName, 'error', 'Stdin error', error.message);
    logTelemetry({ hook: hookName, event: options.event || 'unknown', outcome: 'error', reason: `stdin: ${error.message}` });
    console.error(`[${hookName}] Stdin error: ${error.message}`);
    process.exit(0);
  });
}

module.exports = { debugHook, wrapHookMain, HOOK_DEBUG };
