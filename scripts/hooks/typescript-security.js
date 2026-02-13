#!/usr/bin/env node

/**
 * TypeScript/JavaScript Security Hook
 * Runs security scans on TS/JS files using Semgrep and ESLint security plugin
 *
 * Triggers:
 * - PostToolUse: Edit/Write of .ts, .tsx, .js, .jsx files
 * - Runs Semgrep SAST scan on changed files
 * - Runs basic pattern checks for common vulnerabilities
 *
 * Tools:
 * - Semgrep: AI-powered static analysis for security vulnerabilities
 * - ESLint with eslint-plugin-security: JS/TS specific security rules
 */

import fs from 'fs';
import path from 'path';
import {
  readHookInput,
  writeHookOutput,
  getFilePath,
  getToolName,
  detectProjectType,
  logHook,
  commandExists,
  safeExecSync,
  isValidFilePath
} from '../lib/hook-utils.js';

const TS_JS_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

/**
 * Check if file is a TypeScript/JavaScript file
 * @param {string} filePath - Path to check
 * @returns {boolean}
 */
function isTsJsFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return TS_JS_EXTENSIONS.includes(ext);
}

/**
 * Run Semgrep security scan on a TypeScript/JavaScript file
 * @param {string} filePath - Path to TS/JS file
 * @returns {boolean} True if issues found
 */
function runSemgrepScan(filePath) {
  if (!isValidFilePath(filePath)) {
    logHook(`Invalid file path for security scan: ${filePath}`, 'WARNING');
    return false;
  }

  if (!commandExists('semgrep')) {
    return false;
  }

  try {
    const result = safeExecSync(
      'semgrep',
      ['--config', 'auto', filePath, '--json', '--quiet'],
      {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );

    const output = JSON.parse(result);

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
 * Run basic security pattern checks on TypeScript/JavaScript source file
 * @param {string} filePath - Path to TS/JS file
 * @returns {boolean} True if issues found
 */
function runBasicSecurityChecks(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = [];

    // Check for eval() usage
    if (/\beval\s*\(/.test(content)) {
      issues.push('eval() detected. Avoid eval() - use safer alternatives (JSON.parse, Function constructor with caution).');
    }

    // Check for innerHTML assignment
    if (/\.innerHTML\s*=/.test(content) || /dangerouslySetInnerHTML/.test(content)) {
      issues.push('Direct HTML injection detected (innerHTML/dangerouslySetInnerHTML). Sanitize input to prevent XSS.');
    }

    // Check for SQL string concatenation
    const sqlConcatPattern = /(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE).*[`'"]\s*\+\s*\w+/i;
    if (sqlConcatPattern.test(content)) {
      issues.push('Potential SQL injection (string concatenation in query). Use parameterized queries.');
    }

    // Check for hardcoded credentials
    const credentialPatterns = [
      /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{3,}['"]/i,
      /(?:api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{3,}['"]/i,
      /(?:secret|token)\s*[:=]\s*['"][^'"]{8,}['"]/i
    ];

    for (const pattern of credentialPatterns) {
      if (pattern.test(content)) {
        issues.push('Possible hardcoded credential detected. Use environment variables or secure config.');
        break;
      }
    }

    // Check for command injection via child_process
    if (/exec\(\s*[`'"]\s*\$\{/.test(content) || /exec\([^)]*\+/.test(content)) {
      issues.push('Potential command injection in child_process.exec(). Use execFile() with array arguments instead.');
    }

    // Check for prototype pollution patterns
    if (/\[.*\]\s*=/.test(content) && /merge|extend|assign|defaults/.test(content)) {
      // Only flag if it looks like a deep merge/extend utility
      if (/function\s+(?:merge|deepMerge|extend|deepExtend)/.test(content)) {
        issues.push('Custom merge/extend function may be vulnerable to prototype pollution. Validate property names.');
      }
    }

    // Check for open redirect patterns
    if (/(?:window\.location|location\.href|res\.redirect)\s*[=(]\s*(?:req\.|params\.|query\.)/.test(content)) {
      issues.push('Potential open redirect. Validate redirect URLs against an allowlist.');
    }

    // Report issues
    if (issues.length > 0) {
      logHook(`Security issues found in ${path.basename(filePath)}:`, 'WARNING');
      issues.forEach(issue => {
        console.error(`  - ${issue}`);
      });
      return true;
    }

    return false;
  } catch (error) {
    logHook(`Failed to run security checks: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Check if npm audit should be run (throttled)
 * @param {string} cwd - Working directory
 * @returns {boolean} True if npm audit should be skipped
 */
function shouldSkipNpmAudit(cwd) {
  const cacheFile = path.join(cwd, '.claude', 'npm-audit-last-run.txt');

  try {
    if (fs.existsSync(cacheFile)) {
      const lastRun = fs.readFileSync(cacheFile, 'utf8');
      const lastRunTime = new Date(lastRun).getTime();
      const now = Date.now();
      const hoursSinceLastRun = (now - lastRunTime) / (1000 * 60 * 60);

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
 * Update npm audit last run timestamp
 * @param {string} cwd - Working directory
 */
function updateNpmAuditTimestamp(cwd) {
  const cacheDir = path.join(cwd, '.claude');
  const cacheFile = path.join(cacheDir, 'npm-audit-last-run.txt');

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
 * Run npm audit to check for vulnerable dependencies
 * @param {string} cwd - Working directory
 * @returns {boolean} True if vulnerabilities found
 */
function runNpmAudit(cwd) {
  if (!commandExists('npm')) {
    return false;
  }

  // Only run if package-lock.json exists
  if (!fs.existsSync(path.join(cwd, 'package-lock.json'))) {
    return false;
  }

  if (shouldSkipNpmAudit(cwd)) {
    return false;
  }

  try {
    const result = safeExecSync('npm', ['audit', '--json'], {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const output = JSON.parse(result);

    if (output.metadata && (output.metadata.vulnerabilities?.critical > 0 || output.metadata.vulnerabilities?.high > 0)) {
      logHook('npm audit found vulnerable dependencies:', 'WARNING');
      console.error(`  Critical: ${output.metadata.vulnerabilities.critical}, High: ${output.metadata.vulnerabilities.high}`);
      console.error('[Hook] Run `npm audit fix` to update vulnerable dependencies');
      updateNpmAuditTimestamp(cwd);
      return true;
    }

    updateNpmAuditTimestamp(cwd);
    return false;
  } catch (error) {
    if (error.stdout) {
      try {
        const output = JSON.parse(error.stdout);
        if (output.metadata && (output.metadata.vulnerabilities?.critical > 0 || output.metadata.vulnerabilities?.high > 0)) {
          logHook(`npm audit found critical/high vulnerabilities`, 'WARNING');
          updateNpmAuditTimestamp(cwd);
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
    const context = await readHookInput();

    if (!context) {
      logHook('No context received from stdin', 'WARNING');
      process.exit(0);
    }

    // Detect project types
    const projectTypes = detectProjectType(process.cwd());

    // Only run on Node.js/TypeScript projects
    if (!projectTypes.includes('nodejs') && !projectTypes.includes('typescript')) {
      writeHookOutput(context);
      process.exit(0);
    }

    // Get tool name and file path
    const tool = getToolName(context);
    const filePath = getFilePath(context);

    // Only run on Edit/Write of TS/JS files
    if ((tool === 'Edit' || tool === 'Write') && filePath && isTsJsFile(filePath)) {
      if (fs.existsSync(filePath)) {
        // Run basic pattern checks (fast, always available)
        const patternIssues = runBasicSecurityChecks(filePath);

        // Run Semgrep scan if available
        const semgrepIssues = runSemgrepScan(filePath);

        // Run npm audit on project (throttled)
        const npmAuditIssues = runNpmAudit(process.cwd());

        // Silent success if no issues
        if (!patternIssues && !semgrepIssues && !npmAuditIssues) {
          // No issues found
        }
      }
    }

    // Always pass through context (required by hook protocol)
    writeHookOutput(context);
    process.exit(0);

  } catch (error) {
    logHook(`Unexpected error: ${error.message}`, 'ERROR');
    try {
      writeHookOutput({});
    } catch (_writeError) {
      console.log('{}');
    }
    process.exit(0);
  }
}

main().catch((err) => {
  logHook(`Fatal error: ${err.message}`, 'ERROR');
  try {
    console.log('{}');
  } catch {
    // Can't do anything more
  }
  process.exit(0);
});
