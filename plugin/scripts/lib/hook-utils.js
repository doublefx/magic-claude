/**
 * Hook Utility Functions
 * Shared utilities for Claude Code hook scripts
 * Provides stdin/stdout protocol handling and file filtering
 *
 * Debug mode: set MAGIC_CLAUDE_HOOK_DEBUG=1 to enable verbose diagnostics on stderr
 */

import { detectProjectType } from './detect-project-type.js';
import {
  commandExists,
  safeExecSync,
  safeExecAsync,
  isValidFilePath,
  hasValidExtension
} from './safe-exec.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

const HOOK_DEBUG = process.env.MAGIC_CLAUDE_HOOK_DEBUG === '1' || process.env.MAGIC_CLAUDE_HOOK_DEBUG === 'true';
const CLAUDE_CONFIG_DIR = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const LOG_FILE = process.env.MAGIC_CLAUDE_HOOK_DEBUG_LOG || path.join(CLAUDE_CONFIG_DIR, 'hook-debug.log');

// UNCONDITIONAL canary — determine if module loads at all during Claude Code hook execution
try {
  const script = process.argv[1] || 'unknown';
  fs.appendFileSync('/tmp/magic-claude-hook-canary.log',
    `[${new Date().toISOString()}] hook-utils.js LOADED from ${path.basename(script)}, ` +
    `PID=${process.pid}, HOOK_DEBUG=${HOOK_DEBUG}, ` +
    `MAGIC_CLAUDE_HOOK_DEBUG=${process.env.MAGIC_CLAUDE_HOOK_DEBUG || 'UNSET'}, ` +
    `CLAUDE_CONFIG_DIR=${process.env.CLAUDE_CONFIG_DIR || 'UNSET'}\n`);
} catch { /* ignore */ }

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
 * Derive the hook name from the calling script's filename
 * @returns {string} Hook name (e.g., 'smart-formatter')
 */
function getCallerHookName() {
  try {
    // Look for the script name in process.argv
    const scriptPath = process.argv[1] || '';
    const basename = path.basename(scriptPath, path.extname(scriptPath));
    return basename || 'unknown-hook';
  } catch {
    return 'unknown-hook';
  }
}

/**
 * Log a debug message to file (only when MAGIC_CLAUDE_HOOK_DEBUG=1)
 * Logs to $CLAUDE_CONFIG_DIR/hook-debug.log — viewable via `tail -f` on that path
 * @param {string} hookName - Name/identifier of the calling hook
 * @param {string} phase - Phase: 'input', 'process', 'output', 'error'
 * @param {string} message - Debug message
 * @param {*} [data] - Optional data to log (will be JSON-stringified)
 */
export function debugHook(hookName, phase, message, data) {
  if (!HOOK_DEBUG) return;
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${hookName}] [${phase}]`;
  let line;
  if (data !== undefined) {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    // Truncate very large data
    const truncated = dataStr.length > 2000 ? dataStr.slice(0, 2000) + '... (truncated)' : dataStr;
    line = `${prefix} ${message}: ${truncated}`;
  } else {
    line = `${prefix} ${message}`;
  }
  appendLog(line);
  console.error(line);
}

// Monitor stdout writes in debug mode to catch any unexpected output
if (HOOK_DEBUG) {
  const _origStdoutWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function(chunk, encoding, callback) {
    debugHook(getCallerHookName(), 'output', 'stdout write', typeof chunk === 'string' ? chunk : chunk.toString());
    return _origStdoutWrite(chunk, encoding, callback);
  };
}

/**
 * Read tool context from stdin (Claude Code hook protocol)
 * @returns {Promise<object|null>} Parsed tool context or null on error
 */
export function readHookInput() {
  const callerHook = getCallerHookName();
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      try {
        debugHook(callerHook, 'input', 'Raw stdin length', data.length);
        const context = JSON.parse(data);
        debugHook(callerHook, 'input', 'Parsed tool_name', context?.tool_name);
        debugHook(callerHook, 'input', 'File path', context?.tool_input?.file_path);
        resolve(context);
      } catch (error) {
        debugHook(callerHook, 'error', 'Failed to parse stdin', { error: error.message, rawData: data.slice(0, 500) });
        console.error('[Hook] Failed to parse stdin:', error.message);
        resolve(null);
      }
    });

    process.stdin.on('error', (error) => {
      debugHook(callerHook, 'error', 'Stdin error', error.message);
      console.error('[Hook] Error reading stdin:', error.message);
      resolve(null);
    });
  });
}

/**
 * Synchronously read tool context from stdin
 * Use this for simpler hook scripts that don't need async/await
 * @returns {object|null} Parsed tool context or null on error
 */
export function readHookInputSync() {
  try {
    let data = '';
    const fs = require('fs');

    // Read from stdin synchronously (fd 0)
    const buffer = Buffer.alloc(1024 * 1024); // 1MB buffer
    let bytesRead = 0;

    // Use blocking read
    try {
      bytesRead = fs.readSync(0, buffer, 0, buffer.length);
    } catch (_e) {
      // If stdin is not available, return null
      return null;
    }

    if (bytesRead > 0) {
      data = buffer.toString('utf8', 0, bytesRead);
      return JSON.parse(data);
    }

    return null;
  } catch (error) {
    console.error('[Hook] Failed to parse stdin:', error.message);
    return null;
  }
}

/**
 * Write hook result to stdout following the official Claude Code hook protocol.
 *
 * For PostToolUse hooks:
 * - No output needed (just exit 0) if nothing to report
 * - Use additionalContext to inject context Claude will see
 * - Use decision: "block" + reason to flag issues
 *
 * @param {string} hookEventName - The hook event name (e.g., "PostToolUse")
 * @param {object} [options] - Optional result fields
 * @param {string} [options.additionalContext] - Context string injected for Claude
 * @param {string} [options.decision] - "block" to flag issues to Claude
 * @param {string} [options.reason] - Reason shown to Claude when decision is "block"
 */
export function writeHookResult(hookEventName, options = {}) {
  const callerHook = getCallerHookName();
  const { additionalContext, decision, reason } = options;

  // If nothing to report, don't write anything — just exit 0
  if (!additionalContext && !decision) {
    debugHook(callerHook, 'output', 'No result to write — clean exit');
    return;
  }

  const result = {};

  if (decision) {
    result.decision = decision;
    if (reason) result.reason = reason;
  }

  if (additionalContext) {
    result.hookSpecificOutput = {
      hookEventName,
      additionalContext,
    };
  }

  try {
    const json = JSON.stringify(result);
    debugHook(callerHook, 'output', 'Writing result JSON', json);
    // This console.log is intentional — it's the hook protocol output
    console.log(json); // eslint-disable-line no-console
  } catch (error) {
    debugHook(callerHook, 'error', 'Failed to write result', error.message);
    console.error('[Hook] Failed to write result:', error.message);
  }
}

/**
 * @deprecated Use writeHookResult() instead. This function incorrectly echoes
 * the full input context back to stdout, which Claude Code tries to parse as
 * a decision JSON — causing "PostToolUse hook error" messages.
 */
export function writeHookOutput(context) {
  console.error('[Hook] WARNING: writeHookOutput is deprecated — use writeHookResult() instead');
  // For backward compat, output nothing (safe) rather than the input (broken)
}

/**
 * Check if tool operation matches file extension and project type
 * @param {string} filePath - Path to file being operated on
 * @param {string[]} allowedExtensions - Array of allowed file extensions (e.g., ['.ts', '.js'])
 * @param {string[]} requiredProjectTypes - Array of required project types (e.g., ['nodejs'])
 * @param {string} cwd - Working directory (defaults to process.cwd())
 * @returns {boolean} True if file should be processed
 */
export function shouldProcessFile(filePath, allowedExtensions, requiredProjectTypes, cwd = process.cwd()) {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  // Check file extension
  const ext = path.extname(filePath);
  if (!allowedExtensions.includes(ext)) {
    return false;
  }

  // Check project type (if required)
  if (requiredProjectTypes && requiredProjectTypes.length > 0) {
    const projectTypes = detectProjectType(cwd);
    return requiredProjectTypes.some(type => projectTypes.includes(type));
  }

  return true;
}

/**
 * Check if a command string matches a pattern
 * @param {string} command - Command string to check
 * @param {string|RegExp} pattern - Pattern to match (string or regex)
 * @returns {boolean} True if command matches pattern
 */
export function matchesCommand(command, pattern) {
  if (!command || typeof command !== 'string') {
    return false;
  }

  if (typeof pattern === 'string') {
    return command.includes(pattern);
  }

  if (pattern instanceof RegExp) {
    return pattern.test(command);
  }

  return false;
}

/**
 * Get file path from tool context
 * @param {object} context - Tool context
 * @returns {string|null} File path or null
 */
export function getFilePath(context) {
  return context?.tool_input?.file_path || null;
}

/**
 * Get command from tool context
 * @param {object} context - Tool context
 * @returns {string|null} Command or null
 */
export function getCommand(context) {
  return context?.tool_input?.command || null;
}

/**
 * Get tool name from context
 * @param {object} context - Tool context
 * @returns {string|null} Tool name or null
 */
export function getToolName(context) {
  return context?.tool_name || null;
}

/**
 * Log a hook message to stderr (visible to user)
 * @param {string} message - Message to log
 * @param {string} level - Log level ('INFO', 'WARNING', 'ERROR')
 */
export function logHook(message, level = 'INFO') {
  const prefix = level === 'ERROR' ? '[Hook ERROR]' :
                 level === 'WARNING' ? '[Hook WARNING]' :
                 '[Hook]';
  console.error(`${prefix} ${message}`);
}

/**
 * Re-export detectProjectType and safe-exec functions for convenience
 */
export { detectProjectType, commandExists, safeExecSync, safeExecAsync, isValidFilePath, hasValidExtension };

/**
 * Default export for convenience
 */
export default {
  readHookInput,
  readHookInputSync,
  writeHookResult,
  writeHookOutput,
  shouldProcessFile,
  matchesCommand,
  getFilePath,
  getCommand,
  getToolName,
  logHook,
  detectProjectType,
  commandExists,
  safeExecSync,
  safeExecAsync,
  isValidFilePath,
  hasValidExtension
};
