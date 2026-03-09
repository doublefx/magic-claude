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
  debugHook,
  getFilePath,
  logHook,
  commandExists,
  safeExecSync,
  isValidFilePath,
  logTelemetry
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
  const start = Date.now();
  try {
    const context = await readHookInput();

    if (!context) {
      logHook('No context received from stdin', 'WARNING');
      logTelemetry({ hook: 'smart-formatter', event: 'PostToolUse', outcome: 'skipped', reason: 'no stdin context', duration_ms: Date.now() - start });
      process.exit(0);
    }

    const filePath = getFilePath(context);
    const tool = context?.tool_name;

    if (!filePath || !fs.existsSync(filePath) || !isValidFilePath(filePath)) {
      debugHook('smart-formatter', 'process', 'Skipping — no file, missing, or invalid path', filePath);
      logTelemetry({ hook: 'smart-formatter', event: 'PostToolUse', outcome: 'skipped', reason: 'no file or invalid path', duration_ms: Date.now() - start, file: filePath, tool });
      process.exit(0);
    }

    const detectedEcosystems = detectMultipleEcosystems(process.cwd());
    const ext = path.extname(filePath);

    const formatters = [];
    for (const ecoType of detectedEcosystems) {
      const eco = getEcosystem(ecoType);
      for (const fmt of eco.getFileFormatters()) {
        formatters.push(fmt);
      }
    }

    let formatted = false;
    for (const fmt of formatters) {
      if (!fmt.extensions.includes(ext)) continue;

      const cmd = fmt.command || fmt.tool;
      if (commandExists(fmt.tool)) {
        try {
          safeExecSync(cmd, fmt.args(filePath), { stdio: 'pipe' });
          logHook(`Formatted ${path.basename(filePath)} with ${fmt.tool}`);
          logTelemetry({ hook: 'smart-formatter', event: 'PostToolUse', outcome: 'fired', reason: `formatted with ${fmt.tool}`, duration_ms: Date.now() - start, file: filePath, tool });
          formatted = true;
          break;
        } catch (error) {
          logHook(`Failed to format with ${fmt.tool}: ${error.message}`, 'WARNING');
        }
      }
    }

    if (!formatted) {
      logTelemetry({ hook: 'smart-formatter', event: 'PostToolUse', outcome: 'skipped', reason: `no formatter for ${ext}`, duration_ms: Date.now() - start, file: filePath, tool });
    }

    process.exit(0);

  } catch (error) {
    logHook(`Unexpected error: ${error.message}`, 'ERROR');
    logTelemetry({ hook: 'smart-formatter', event: 'PostToolUse', outcome: 'error', reason: error.message, duration_ms: Date.now() - start });
    process.exit(0);
  }
}

main().catch((err) => {
  logHook(`Fatal error: ${err.message}`, 'ERROR');
  process.exit(0);
});
