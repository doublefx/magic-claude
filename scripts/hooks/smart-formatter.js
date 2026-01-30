#!/usr/bin/env node

/**
 * Smart Formatter Hook
 * Auto-formats files based on project type and file extension
 *
 * Supported formatters:
 * - Python: ruff format (pyproject.toml projects)
 * - Java: google-java-format (Maven/Gradle projects)
 * - Kotlin: ktfmt or ktlint (Gradle projects)
 * - TypeScript/JavaScript: prettier (Node.js projects)
 */

import fs from 'fs';
import path from 'path';
import {
  readHookInput,
  writeHookOutput,
  getFilePath,
  detectProjectType,
  logHook,
  commandExists,
  safeExecSync,
  isValidFilePath
} from '../lib/hook-utils.js';

/**
 * Format a Python file using ruff
 * @param {string} filePath - Path to Python file
 */
function formatPython(filePath) {
  if (!isValidFilePath(filePath)) {
    logHook(`Invalid file path: ${filePath}`, 'WARNING');
    return;
  }

  if (commandExists('ruff')) {
    try {
      // Safe execution with array arguments - prevents command injection
      safeExecSync('ruff', ['format', filePath], { stdio: 'pipe' });
      logHook(`Formatted Python file: ${path.basename(filePath)}`);
    } catch (error) {
      logHook(`Failed to format Python file: ${error.message}`, 'WARNING');
    }
  }
}

/**
 * Format a Java file using google-java-format
 * @param {string} filePath - Path to Java file
 */
function formatJava(filePath) {
  if (!isValidFilePath(filePath)) {
    logHook(`Invalid file path: ${filePath}`, 'WARNING');
    return;
  }

  if (commandExists('google-java-format')) {
    try {
      // Safe execution with array arguments - prevents command injection
      safeExecSync('google-java-format', ['-i', filePath], { stdio: 'pipe' });
      logHook(`Formatted Java file: ${path.basename(filePath)}`);
    } catch (error) {
      logHook(`Failed to format Java file: ${error.message}`, 'WARNING');
    }
  }
}

/**
 * Format a Kotlin file using ktfmt or ktlint
 * @param {string} filePath - Path to Kotlin file
 */
function formatKotlin(filePath) {
  if (!isValidFilePath(filePath)) {
    logHook(`Invalid file path: ${filePath}`, 'WARNING');
    return;
  }

  if (commandExists('ktfmt')) {
    try {
      // Safe execution with array arguments - prevents command injection
      safeExecSync('ktfmt', [filePath], { stdio: 'pipe' });
      logHook(`Formatted Kotlin file: ${path.basename(filePath)}`);
      return;
    } catch (error) {
      logHook(`Failed to format with ktfmt: ${error.message}`, 'WARNING');
    }
  }

  if (commandExists('ktlint')) {
    try {
      // Safe execution with array arguments - prevents command injection
      safeExecSync('ktlint', ['-F', filePath], { stdio: 'pipe' });
      logHook(`Formatted Kotlin file: ${path.basename(filePath)}`);
    } catch (error) {
      logHook(`Failed to format with ktlint: ${error.message}`, 'WARNING');
    }
  }
}

/**
 * Format a TypeScript/JavaScript file using prettier
 * @param {string} filePath - Path to TS/JS file
 */
function formatTypeScript(filePath) {
  if (!isValidFilePath(filePath)) {
    logHook(`Invalid file path: ${filePath}`, 'WARNING');
    return;
  }

  if (commandExists('prettier')) {
    try {
      // Safe execution with array arguments - prevents command injection
      safeExecSync('npx', ['prettier', '--write', filePath], { stdio: 'pipe' });
      logHook(`Formatted TypeScript/JavaScript file: ${path.basename(filePath)}`);
    } catch (error) {
      logHook(`Failed to format TypeScript/JavaScript file: ${error.message}`, 'WARNING');
    }
  }
}

/**
 * Main hook function
 */
async function main() {
  try {
    // Read tool context from stdin
    const context = await readHookInput();

    if (!context) {
      logHook('No context received from stdin', 'WARNING');
      process.exit(0);
    }

    // Extract file path from context
    const filePath = getFilePath(context);

    // If no file path or file doesn't exist, pass through
    if (!filePath) {
      writeHookOutput(context);
      process.exit(0);
    }

    if (!fs.existsSync(filePath)) {
      logHook(`File does not exist: ${filePath}`, 'WARNING');
      writeHookOutput(context);
      process.exit(0);
    }

    // Detect project types in current directory
    const projectTypes = detectProjectType(process.cwd());
    const ext = path.extname(filePath);

    // Format based on file extension and project type
    if (ext === '.py' && projectTypes.includes('python')) {
      formatPython(filePath);
    }
    else if (ext === '.java' && (projectTypes.includes('maven') || projectTypes.includes('gradle'))) {
      formatJava(filePath);
    }
    else if (ext === '.kt' && projectTypes.includes('gradle')) {
      formatKotlin(filePath);
    }
    else if (['.ts', '.tsx', '.js', '.jsx'].includes(ext) && projectTypes.includes('nodejs')) {
      formatTypeScript(filePath);
    }

    // Always pass through context (required by hook protocol)
    writeHookOutput(context);
    process.exit(0);

  } catch (error) {
    logHook(`Unexpected error: ${error.message}`, 'ERROR');
    // CRITICAL: Always pass through context, even on catastrophic failure
    try {
      writeHookOutput({});
    } catch (_writeError) {
      // Last resort: output minimal valid context to maintain hook chain
      console.log('{}');
    }
    process.exit(0);
  }
}

// Run main function
main().catch((err) => {
  logHook(`Fatal error: ${err.message}`, 'ERROR');
  // Last resort: output empty context to maintain hook chain
  try {
    console.log('{}');
  } catch {
    // Can't do anything more
  }
  process.exit(0);
});
