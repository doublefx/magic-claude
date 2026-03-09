/**
 * Hook Telemetry - Structured effectiveness logging
 *
 * Logs every hook execution to a JSONL file for analysis.
 * Always active (not gated by debug mode) — telemetry is lightweight.
 *
 * Log file: $CLAUDE_CONFIG_DIR/hook-telemetry.jsonl
 *
 * Each line is a JSON object:
 * {
 *   "ts": "2026-03-09T16:45:00.123Z",
 *   "hook": "smart-formatter",
 *   "event": "PostToolUse",
 *   "outcome": "fired|skipped|error",
 *   "reason": "formatted 2 files (prettier)",
 *   "duration_ms": 340,
 *   "file": "src/index.ts",
 *   "tool": "Edit"
 * }
 *
 * Analysis: node scripts/lib/hook-telemetry.cjs --report
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_CONFIG_DIR = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const TELEMETRY_FILE = path.join(CLAUDE_CONFIG_DIR, 'hook-telemetry.jsonl');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — rotate after this

/**
 * Log a hook execution event.
 * @param {object} entry
 * @param {string} entry.hook - Hook script name (e.g., 'smart-formatter')
 * @param {string} entry.event - Hook event type (e.g., 'PostToolUse', 'SessionStart')
 * @param {'fired'|'skipped'|'error'} entry.outcome - What happened
 * @param {string} entry.reason - Human-readable description of what happened or why it was skipped
 * @param {number} [entry.duration_ms] - Execution time in milliseconds
 * @param {string} [entry.file] - File path involved (if any)
 * @param {string} [entry.tool] - Tool name that triggered the hook (if any)
 */
function logTelemetry(entry) {
  try {
    const record = {
      ts: new Date().toISOString(),
      hook: entry.hook,
      event: entry.event || 'unknown',
      outcome: entry.outcome || 'unknown',
      reason: entry.reason || '',
      ...(entry.duration_ms !== undefined && { duration_ms: entry.duration_ms }),
      ...(entry.file && { file: path.basename(entry.file) }),
      ...(entry.tool && { tool: entry.tool }),
    };

    // Rotate if file too large
    try {
      const stats = fs.statSync(TELEMETRY_FILE);
      if (stats.size > MAX_FILE_SIZE) {
        const rotated = TELEMETRY_FILE.replace('.jsonl', `.${Date.now()}.jsonl`);
        fs.renameSync(TELEMETRY_FILE, rotated);
      }
    } catch {
      // File doesn't exist yet — fine
    }

    fs.appendFileSync(TELEMETRY_FILE, JSON.stringify(record) + '\n');
  } catch {
    // Never break a hook because of telemetry
  }
}

/**
 * Wrap a CJS hook handler with automatic telemetry.
 * Captures outcome, duration, and reason.
 *
 * The handler should return an object: { outcome, reason }
 * If handler throws, outcome is 'error'.
 * If handler returns nothing, outcome is 'skipped' with reason 'no return value'.
 *
 * @param {string} hookName - Hook script name
 * @param {string} eventType - Hook event type (e.g., 'PostToolUse')
 * @param {(input: object) => {outcome: string, reason: string} | void} handler
 * @returns {(input: object) => void} Wrapped handler for use with wrapHookMain
 */
function withTelemetry(hookName, eventType, handler) {
  return function telemetryWrappedHandler(input) {
    const start = Date.now();
    const file = input?.tool_input?.file_path || input?.tool_input?.command;
    const tool = input?.tool_name;

    try {
      const result = handler(input);
      const duration_ms = Date.now() - start;

      if (result && result.outcome) {
        logTelemetry({
          hook: hookName,
          event: eventType,
          outcome: result.outcome,
          reason: result.reason || '',
          duration_ms,
          file,
          tool,
        });
      } else {
        logTelemetry({
          hook: hookName,
          event: eventType,
          outcome: 'skipped',
          reason: 'no return value',
          duration_ms,
          file,
          tool,
        });
      }
    } catch (err) {
      const duration_ms = Date.now() - start;
      logTelemetry({
        hook: hookName,
        event: eventType,
        outcome: 'error',
        reason: err.message || String(err),
        duration_ms,
        file,
        tool,
      });
      throw err; // Re-throw so wrapHookMain handles it
    }
  };
}

/**
 * Generate a summary report from the telemetry log.
 * @param {number} [days=7] - Number of days to include
 * @returns {string} Formatted report
 */
function generateReport(days = 7) {
  if (!fs.existsSync(TELEMETRY_FILE)) {
    return 'No telemetry data found. Hooks have not run yet.';
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const lines = fs.readFileSync(TELEMETRY_FILE, 'utf8').trim().split('\n');

  const entries = [];
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.ts >= cutoff) entries.push(entry);
    } catch {
      // Skip malformed lines
    }
  }

  if (entries.length === 0) {
    return `No telemetry data in the last ${days} day(s).`;
  }

  // Aggregate by hook
  const byHook = {};
  for (const e of entries) {
    if (!byHook[e.hook]) {
      byHook[e.hook] = { fired: 0, skipped: 0, error: 0, total: 0, durations: [], reasons: {} };
    }
    const h = byHook[e.hook];
    h.total++;
    h[e.outcome] = (h[e.outcome] || 0) + 1;
    if (e.duration_ms !== undefined) h.durations.push(e.duration_ms);
    if (e.reason) {
      h.reasons[e.reason] = (h.reasons[e.reason] || 0) + 1;
    }
  }

  // Format report
  const report = [];
  report.push(`Hook Telemetry Report (last ${days} day(s), ${entries.length} events)`);
  report.push('='.repeat(70));
  report.push('');

  // Sort by total executions descending
  const sorted = Object.entries(byHook).sort((a, b) => b[1].total - a[1].total);

  for (const [name, stats] of sorted) {
    const fireRate = stats.total > 0 ? ((stats.fired / stats.total) * 100).toFixed(0) : 0;
    const avgMs = stats.durations.length > 0
      ? (stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length).toFixed(0)
      : 'N/A';
    const maxMs = stats.durations.length > 0 ? Math.max(...stats.durations) : 'N/A';

    report.push(`${name}`);
    report.push(`  Total: ${stats.total}  |  Fired: ${stats.fired}  |  Skipped: ${stats.skipped}  |  Errors: ${stats.error}`);
    report.push(`  Fire rate: ${fireRate}%  |  Avg: ${avgMs}ms  |  Max: ${maxMs}ms`);

    // Top reasons (skip if only one generic reason)
    const reasonEntries = Object.entries(stats.reasons).sort((a, b) => b[1] - a[1]);
    if (reasonEntries.length > 0) {
      const topReasons = reasonEntries.slice(0, 3);
      report.push(`  Top reasons: ${topReasons.map(([r, c]) => `${r} (${c})`).join(', ')}`);
    }
    report.push('');
  }

  // Summary
  const totalFired = Object.values(byHook).reduce((s, h) => s + h.fired, 0);
  const totalSkipped = Object.values(byHook).reduce((s, h) => s + h.skipped, 0);
  const totalErrors = Object.values(byHook).reduce((s, h) => s + h.error, 0);
  const neverFired = sorted.filter(([, s]) => s.fired === 0).map(([n]) => n);

  report.push('-'.repeat(70));
  report.push(`Summary: ${totalFired} fired, ${totalSkipped} skipped, ${totalErrors} errors`);

  if (neverFired.length > 0) {
    report.push(`Never fired: ${neverFired.join(', ')}`);
  }

  return report.join('\n');
}

// CLI mode: node hook-telemetry.cjs --report [days]
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--report')) {
    const daysIdx = args.indexOf('--report') + 1;
    const days = daysIdx < args.length ? parseInt(args[daysIdx], 10) || 7 : 7;
    console.log(generateReport(days));
  } else {
    console.log('Usage: node hook-telemetry.cjs --report [days]');
    console.log(`Telemetry file: ${TELEMETRY_FILE}`);
  }
}

module.exports = { logTelemetry, withTelemetry, generateReport, TELEMETRY_FILE };
