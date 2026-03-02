#!/usr/bin/env node
/**
 * Debug Statement Detector - Warn about debug statements after edits
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on PostToolUse for Edit commands.
 * Debug patterns are aggregated from the ecosystem registry — adding a new
 * ecosystem automatically extends detection.
 */

const fs = require('fs');
const { getAllDebugPatterns } = require('../lib/ecosystems/index.cjs');

const DEBUG_PATTERNS = getAllDebugPatterns();

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = input.tool_input?.file_path;

    if (!filePath || !fs.existsSync(filePath)) {
      process.exit(0);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const allFindings = [];

    for (const dp of DEBUG_PATTERNS) {
      if (!dp.extensions.test(filePath)) continue;

      const matches = [];
      lines.forEach((line, idx) => {
        if (dp.skipPattern && dp.skipPattern.test(line.trim())) return;
        if (dp.pattern.test(line)) {
          matches.push(`${idx + 1}: ${line.trim()}`);
        }
      });

      if (matches.length) {
        console.error(`[Hook] WARNING: ${dp.name} found in ${filePath}`);
        matches.slice(0, 5).forEach(m => console.error(m));
        console.error(`[Hook] ${dp.message}`);

        allFindings.push(`${dp.name} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`);
      }
    }

    if (allFindings.length > 0) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: `[Debug Statements] Found in ${filePath}: ${allFindings.join(', ')}. Remove before committing.`
        }
      }));
    }

    process.exit(0);
  } catch (error) {
    console.error(`[DebugDetector] Error: ${error.message}`);
    process.exit(0);
  }
});
