#!/usr/bin/env node

/**
 * Smart Formatter Hook
 * Auto-formats files based on ecosystem registry and file extension.
 *
 * Formatter definitions come from each ecosystem's getFileFormatters() method,
 * making this hook automatically support new ecosystems without code changes.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import {
  readHookInput,
  writeHookOutput,
  getFilePath,
  logHook,
  commandExists,
  safeExecSync,
  isValidFilePath
} from '../lib/hook-utils.js';

const require = createRequire(import.meta.url);
const {
  detectMultipleEcosystems,
  getEcosystem
} = require('../lib/ecosystems/index.cjs');

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

    if (!isValidFilePath(filePath)) {
      logHook(`Invalid file path: ${filePath}`, 'WARNING');
      writeHookOutput(context);
      process.exit(0);
    }

    // Detect ecosystems present in the project
    const detectedEcosystems = detectMultipleEcosystems(process.cwd());
    const ext = path.extname(filePath);

    // Collect formatters from detected ecosystems only
    const formatters = [];
    for (const ecoType of detectedEcosystems) {
      const eco = getEcosystem(ecoType);
      for (const fmt of eco.getFileFormatters()) {
        formatters.push(fmt);
      }
    }

    // Find formatters matching this file's extension and try them in order
    for (const fmt of formatters) {
      if (!fmt.extensions.includes(ext)) continue;

      const cmd = fmt.command || fmt.tool;
      if (commandExists(fmt.tool)) {
        try {
          safeExecSync(cmd, fmt.args(filePath), { stdio: 'pipe' });
          logHook(`Formatted ${path.basename(filePath)} with ${fmt.tool}`);
          break; // Stop after first successful format
        } catch (error) {
          logHook(`Failed to format with ${fmt.tool}: ${error.message}`, 'WARNING');
        }
      }
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
