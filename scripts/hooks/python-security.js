#!/usr/bin/env node

/**
 * Python Security Hook
 * Runs security scans on Python files using Semgrep and pip-audit
 *
 * Triggers:
 * - PostToolUse: Edit/Write of .py files
 * - Runs Semgrep SAST scan on changed files
 * - Runs pip-audit on project dependencies (throttled)
 *
 * Tools:
 * - Semgrep: AI-powered static analysis for security vulnerabilities
 * - pip-audit: Checks for known vulnerabilities in dependencies
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  readHookInput,
  writeHookOutput,
  getFilePath,
  getToolName,
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
 * Run Semgrep security scan on a Python file
 * @param {string} filePath - Path to Python file
 * @returns {boolean} True if issues found
 */
function runSemgrepScan(filePath) {
  if (!commandExists('semgrep')) {
    return false;
  }

  try {
    // Run Semgrep with auto config (includes Python security rules)
    // --quiet: Suppress progress messages
    // --config auto: Use curated ruleset from Semgrep registry
    const result = execSync(
      `semgrep --config auto "${filePath}" --json --quiet`,
      {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );

    const output = JSON.parse(result);

    // Check if any results were found
    if (output.results && output.results.length > 0) {
      const critical = output.results.filter(r => r.extra?.severity === 'ERROR');
      const warnings = output.results.filter(r => r.extra?.severity === 'WARNING');

      if (critical.length > 0 || warnings.length > 0) {
        logHook(`Semgrep found security issues in ${path.basename(filePath)}:`, 'WARNING');

        critical.forEach(issue => {
          console.error(`  [CRITICAL] Line ${issue.start.line}: ${issue.extra?.message || issue.check_id}`);
        });

        warnings.forEach(issue => {
          console.error(`  [WARNING] Line ${issue.start.line}: ${issue.extra?.message || issue.check_id}`);
        });

        console.error('[Hook] Review and fix security issues before committing');
        return true;
      }
    }

    return false;
  } catch (error) {
    // Semgrep may exit with non-zero if issues found
    if (error.stdout) {
      try {
        const output = JSON.parse(error.stdout);
        if (output.results && output.results.length > 0) {
          logHook(`Semgrep found ${output.results.length} issue(s) in ${path.basename(filePath)}`, 'WARNING');
          return true;
        }
      } catch {
        // Failed to parse output, skip
      }
    }
    return false;
  }
}

/**
 * Check if pip-audit was run recently (avoid running too often)
 * @param {string} cwd - Working directory
 * @returns {boolean} True if pip-audit should be skipped
 */
function shouldSkipPipAudit(cwd) {
  const cacheFile = path.join(cwd, '.claude', 'pip-audit-last-run.txt');

  try {
    if (fs.existsSync(cacheFile)) {
      const lastRun = fs.readFileSync(cacheFile, 'utf8');
      const lastRunTime = new Date(lastRun).getTime();
      const now = Date.now();
      const hoursSinceLastRun = (now - lastRunTime) / (1000 * 60 * 60);

      // Skip if run less than 1 hour ago
      if (hoursSinceLastRun < 1) {
        return true;
      }
    }
  } catch {
    // Cache file doesn't exist or invalid, don't skip
  }

  return false;
}

/**
 * Update pip-audit last run timestamp
 * @param {string} cwd - Working directory
 */
function updatePipAuditTimestamp(cwd) {
  const cacheDir = path.join(cwd, '.claude');
  const cacheFile = path.join(cacheDir, 'pip-audit-last-run.txt');

  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(cacheFile, new Date().toISOString(), 'utf8');
  } catch {
    // Fail silently
  }
}

/**
 * Run pip-audit to check for vulnerable dependencies
 * @param {string} cwd - Working directory
 * @returns {boolean} True if vulnerabilities found
 */
function runPipAudit(cwd) {
  if (!commandExists('pip-audit')) {
    return false;
  }

  // Skip if run recently
  if (shouldSkipPipAudit(cwd)) {
    return false;
  }

  try {
    // Run pip-audit with JSON output
    const result = execSync('pip-audit --format json', {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const output = JSON.parse(result);

    // Check for vulnerabilities
    if (output.dependencies && output.dependencies.length > 0) {
      const critical = output.dependencies.filter(d =>
        d.vulns.some(v => v.severity === 'CRITICAL' || v.severity === 'HIGH')
      );

      if (critical.length > 0) {
        logHook('pip-audit found vulnerable dependencies:', 'WARNING');

        critical.forEach(dep => {
          console.error(`  [${dep.name}] ${dep.version}`);
          dep.vulns.forEach(vuln => {
            console.error(`    - ${vuln.id}: ${vuln.description.substring(0, 80)}...`);
          });
        });

        console.error('[Hook] Update vulnerable dependencies before deploying');
        updatePipAuditTimestamp(cwd);
        return true;
      }
    }

    updatePipAuditTimestamp(cwd);
    return false;
  } catch (error) {
    // pip-audit may exit with non-zero if vulnerabilities found
    if (error.stdout) {
      try {
        const output = JSON.parse(error.stdout);
        if (output.dependencies && output.dependencies.length > 0) {
          logHook(`pip-audit found ${output.dependencies.length} vulnerable package(s)`, 'WARNING');
          updatePipAuditTimestamp(cwd);
          return true;
        }
      } catch {
        // Failed to parse output, skip
      }
    }
    return false;
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

    // Detect project types
    const projectTypes = detectProjectType(process.cwd());

    // Only run on Python projects
    if (!projectTypes.includes('python')) {
      writeHookOutput(context);
      process.exit(0);
    }

    // Get tool name and file path
    const tool = getToolName(context);
    const filePath = getFilePath(context);

    // Only run on Edit/Write of Python files
    if ((tool === 'Edit' || tool === 'Write') && filePath && filePath.endsWith('.py')) {
      // Check if file exists
      if (fs.existsSync(filePath)) {
        // Run Semgrep scan on the file
        const semgrepIssues = runSemgrepScan(filePath);

        // Run pip-audit on project (throttled to avoid running too often)
        const pipAuditIssues = runPipAudit(process.cwd());

        // If no issues found, log success
        if (!semgrepIssues && !pipAuditIssues) {
          // Silent success - don't spam logs
        }
      }
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
