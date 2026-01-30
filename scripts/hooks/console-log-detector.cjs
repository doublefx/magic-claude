#!/usr/bin/env node
/**
 * Console.log Detector - Warn about console.log statements after edits
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on PostToolUse for Edit commands.
 * Filters internally for JS/TS files.
 */

const fs = require('fs');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = input.tool_input?.file_path;

    // Only process JS/TS files
    if (filePath && /\.(ts|tsx|js|jsx)$/.test(filePath) && fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const matches = [];

      lines.forEach((line, idx) => {
        if (/console\.log/.test(line)) {
          matches.push(`${idx + 1}: ${line.trim()}`);
        }
      });

      if (matches.length) {
        console.error(`[Hook] WARNING: console.log found in ${filePath}`);
        matches.slice(0, 5).forEach(m => console.error(m));
        console.error('[Hook] Remove console.log before committing');
      }
    }

    // Pass through unchanged
    console.log(data);
  } catch (error) {
    console.error(`[ConsoleLog] Error: ${error.message}`);
    console.log(data);
  }
});
