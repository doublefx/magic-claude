/**
 * Safe Command Execution Utilities
 * Prevents command injection vulnerabilities by using execFile instead of execSync
 */

import { execFile, execFileSync } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Safely check if a command exists in the system
 * @param {string} cmd - Command name to check
 * @returns {boolean} True if command exists
 */
export function commandExists(cmd) {
  // Validate cmd contains only safe characters (alphanumeric, dash, underscore)
  if (!/^[a-z0-9_-]+$/i.test(cmd)) {
    return false;
  }

  try {
    const which = process.platform === 'win32' ? 'where' : 'which';
    execFileSync(which, [cmd], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely execute a command with arguments (synchronous)
 * @param {string} command - Command to execute
 * @param {string[]} args - Command arguments
 * @param {object} options - Execution options
 * @returns {Buffer|string} Command output
 * @throws {Error} If command fails
 */
export function safeExecSync(command, args = [], options = {}) {
  // Validate command name
  if (!/^[a-z0-9_-]+$/i.test(command)) {
    throw new Error(`Invalid command name: ${command}`);
  }

  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    ...options
  });
}

/**
 * Safely execute a command with arguments (asynchronous)
 * @param {string} command - Command to execute
 * @param {string[]} args - Command arguments
 * @param {object} options - Execution options
 * @returns {Promise<{stdout: string, stderr: string}>} Command output
 * @throws {Error} If command fails
 */
export async function safeExecAsync(command, args = [], options = {}) {
  // Validate command name
  if (!/^[a-z0-9_-]+$/i.test(command)) {
    throw new Error(`Invalid command name: ${command}`);
  }

  return await execFileAsync(command, args, {
    encoding: 'utf8',
    ...options
  });
}

/**
 * Validate file path to prevent path traversal
 * @param {string} filePath - File path to validate
 * @returns {boolean} True if path is safe
 */
export function isValidFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  // Reject paths with path traversal attempts
  if (filePath.includes('..') || filePath.includes('\0')) {
    return false;
  }

  // Reject absolute paths to system directories (Linux/Unix)
  const dangerousPaths = ['/etc', '/bin', '/sbin', '/usr/bin', '/usr/sbin', '/root'];
  if (dangerousPaths.some(p => filePath.startsWith(p))) {
    return false;
  }

  return true;
}

/**
 * Validate file extension
 * @param {string} filePath - File path to check
 * @param {string[]} allowedExtensions - List of allowed extensions (e.g., ['.py', '.js'])
 * @returns {boolean} True if extension is allowed
 */
export function hasValidExtension(filePath, allowedExtensions) {
  if (!filePath || !Array.isArray(allowedExtensions)) {
    return false;
  }

  const ext = filePath.toLowerCase().slice(filePath.lastIndexOf('.'));
  return allowedExtensions.includes(ext);
}

export default {
  commandExists,
  safeExecSync,
  safeExecAsync,
  isValidFilePath,
  hasValidExtension
};
