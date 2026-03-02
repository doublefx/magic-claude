/**
 * Hook Utility Functions
 * Shared utilities for Claude Code hook scripts
 * Provides stdin/stdout protocol handling and file filtering
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

/**
 * Read tool context from stdin (Claude Code hook protocol)
 * @returns {Promise<object|null>} Parsed tool context or null on error
 */
export function readHookInput() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      try {
        const context = JSON.parse(data);
        resolve(context);
      } catch (error) {
        console.error('[Hook] Failed to parse stdin:', error.message);
        resolve(null);
      }
    });

    process.stdin.on('error', (error) => {
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
  const { additionalContext, decision, reason } = options;

  // If nothing to report, don't write anything — just exit 0
  if (!additionalContext && !decision) {
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
    console.log(JSON.stringify(result));
  } catch (error) {
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
  return context?.tool || null;
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
