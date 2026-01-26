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
import { createInterface } from 'readline';
import { stdin as input, stdout as output } from 'process';

/**
 * Read tool context from stdin (Claude Code hook protocol)
 * @returns {Promise<object|null>} Parsed tool context or null on error
 */
export async function readHookInput() {
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
    } catch (e) {
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
 * Write tool context to stdout (pass-through)
 * REQUIRED by Claude Code hook protocol - must pass through the context
 * @param {object} context - Tool context to write
 */
export function writeHookOutput(context) {
  if (!context) {
    console.error('[Hook] Warning: Attempting to write null context');
    console.log('{}'); // Still output empty object to maintain protocol
    return;
  }

  try {
    const output = typeof context === 'string' ? context : JSON.stringify(context);
    console.log(output);
  } catch (error) {
    console.error('[Hook] Failed to write context:', error.message);
    // Still try to output something to maintain protocol
    console.log('{}');
  }
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
