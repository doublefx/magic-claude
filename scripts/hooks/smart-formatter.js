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
import { execSync } from 'child_process';
import {
  readHookInput,
  writeHookOutput,
  getFilePath,
  detectProjectType,
  logHook
} from '../lib/hook-utils.js';

/**
 * Check if a command exists in the system
 * @param {string} cmd - Command name to check
 * @returns {boolean} True if command exists
 */
function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Format a Python file using ruff
 * @param {string} filePath - Path to Python file
 */
function formatPython(filePath) {
  if (commandExists('ruff')) {
    try {
      // Use stdio: 'pipe' to prevent formatter output from mixing with hook JSON output
      execSync(`ruff format "${filePath}"`, { stdio: 'pipe' });
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
  if (commandExists('google-java-format')) {
    try {
      execSync(`google-java-format -i "${filePath}"`, { stdio: 'pipe' });
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
  if (commandExists('ktfmt')) {
    try {
      execSync(`ktfmt "${filePath}"`, { stdio: 'pipe' });
      logHook(`Formatted Kotlin file: ${path.basename(filePath)}`);
      return;
    } catch (error) {
      logHook(`Failed to format with ktfmt: ${error.message}`, 'WARNING');
    }
  }

  if (commandExists('ktlint')) {
    try {
      execSync(`ktlint -F "${filePath}"`, { stdio: 'pipe' });
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
  if (commandExists('prettier')) {
    try {
      execSync(`npx prettier --write "${filePath}"`, { stdio: 'pipe' });
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
    // Even on error, try to pass through empty context
    writeHookOutput({});
    process.exit(0);
  }
}

// Run main function
main().catch((err) => {
  logHook(`Fatal error: ${err.message}`, 'ERROR');
  process.exit(0);
});
