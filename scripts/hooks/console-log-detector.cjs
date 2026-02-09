#!/usr/bin/env node
/**
 * Debug Statement Detector - Warn about debug statements after edits
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on PostToolUse for Edit commands.
 * Detects ecosystem-specific debug statements:
 * - JS/TS: console.log
 * - Python: print()
 * - Java/Kotlin: System.out.println, e.printStackTrace()
 */

const fs = require('fs');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = input.tool_input?.file_path;

    if (!filePath || !fs.existsSync(filePath)) {
      console.log(data);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const matches = [];

    // JS/TS files: check for console.log
    if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
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

    // Python files: check for print()
    if (/\.py$/.test(filePath)) {
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        // Skip comments and docstrings
        if (trimmed.startsWith('#') || trimmed.startsWith('"""') || trimmed.startsWith("'''")) return;
        if (/\bprint\s*\(/.test(line)) {
          matches.push(`${idx + 1}: ${trimmed}`);
        }
      });
      if (matches.length) {
        console.error(`[Hook] WARNING: print() found in ${filePath}`);
        matches.slice(0, 5).forEach(m => console.error(m));
        console.error('[Hook] Remove print() statements before committing. Use logging module instead.');
      }
    }

    // Java/Kotlin files: check for System.out.println and e.printStackTrace()
    if (/\.(java|kt|kts)$/.test(filePath)) {
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        // Skip comments
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
        if (/System\.(out|err)\.(println|print)\b/.test(line) || /\.printStackTrace\s*\(/.test(line)) {
          matches.push(`${idx + 1}: ${trimmed}`);
        }
      });
      if (matches.length) {
        console.error(`[Hook] WARNING: Debug statements found in ${filePath}`);
        matches.slice(0, 5).forEach(m => console.error(m));
        console.error('[Hook] Remove System.out.println/e.printStackTrace() before committing. Use SLF4J/Logback instead.');
      }
    }

    // Pass through unchanged
    console.log(data);
  } catch (error) {
    console.error(`[DebugDetector] Error: ${error.message}`);
    console.log(data);
  }
});
