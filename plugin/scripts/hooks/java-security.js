#!/usr/bin/env node

/**
 * Java Security Hook
 * Runs SpotBugs + FindSecurityBugs on Java files to detect security vulnerabilities
 *
 * This hook runs AFTER compilation (needs .class files)
 * Checks for:
 * - SQL injection
 * - Command injection
 * - Path traversal
 * - XXE vulnerabilities
 * - Insecure random
 * - Hardcoded credentials
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  readHookInput,
  writeHookOutput,
  getFilePath,
  detectProjectType,
  logHook,
  commandExists
} from '../lib/hook-utils.js';

/**
 * Find the build output directory for compiled classes
 * @param {string} cwd - Current working directory
 * @param {string[]} projectTypes - Detected project types
 * @returns {string|null} Path to classes directory or null
 */
function findClassesDirectory(cwd, projectTypes) {
  // Maven: target/classes
  if (projectTypes.includes('maven')) {
    const mavenClasses = path.join(cwd, 'target', 'classes');
    if (fs.existsSync(mavenClasses)) {
      return mavenClasses;
    }
  }

  // Gradle: build/classes/java/main
  if (projectTypes.includes('gradle')) {
    const gradleClasses = path.join(cwd, 'build', 'classes', 'java', 'main');
    if (fs.existsSync(gradleClasses)) {
      return gradleClasses;
    }
  }

  return null;
}

/**
 * Run SpotBugs with FindSecurityBugs plugin
 * @param {string} classesDir - Path to compiled classes directory
 */
function runSpotBugs(classesDir) {
  if (!commandExists('spotbugs')) {
    logHook('SpotBugs not installed. Install: https://spotbugs.github.io/', 'WARNING');
    return;
  }

  try {
    // Run SpotBugs with maximum effort and low threshold
    // -textui: text user interface
    // -effort:max: maximum analysis effort
    // -low: report all issues (including low priority)
    const cmd = `spotbugs -textui -effort:max -low "${classesDir}"`;

    logHook('Running SpotBugs security analysis...');
    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });

    // Parse output for security issues
    if (output.includes('Bug') || output.includes('Warning')) {
      logHook('SpotBugs found potential security issues:', 'WARNING');
      console.error(output);
    } else {
      logHook('SpotBugs security scan: No issues found');
    }
  } catch (error) {
    // SpotBugs exits with non-zero if bugs found
    if (error.stdout) {
      logHook('SpotBugs found security issues:', 'WARNING');
      console.error(error.stdout.toString());
    } else {
      logHook(`SpotBugs analysis failed: ${error.message}`, 'ERROR');
    }
  }
}

/**
 * Run basic security pattern checks on Java source file
 * @param {string} filePath - Path to Java file
 */
function runBasicSecurityChecks(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = [];

    // Check for SQL injection patterns
    const sqlInjectionPattern = /["']\s*\+\s*\w+\s*\+\s*["'].*(?:SELECT|INSERT|UPDATE|DELETE)/i;
    if (sqlInjectionPattern.test(content)) {
      issues.push('Potential SQL injection (string concatenation in SQL query). Use PreparedStatement.');
    }

    // Check for hardcoded credentials patterns
    const credentialPatterns = [
      /password\s*=\s*["'][^"']+["']/i,
      /api[_-]?key\s*=\s*["'][^"']+["']/i,
      /secret\s*=\s*["'][^"']+["']/i,
      /token\s*=\s*["'][^"']+["']/i
    ];

    for (const pattern of credentialPatterns) {
      if (pattern.test(content)) {
        issues.push('Possible hardcoded credential detected. Use environment variables or secure config.');
        break;
      }
    }

    // Check for command injection (Runtime.exec with variables)
    const commandInjectionPattern = /Runtime\.getRuntime\(\)\.exec\([^)]*\+/;
    if (commandInjectionPattern.test(content)) {
      issues.push('Potential command injection in Runtime.exec(). Validate inputs carefully.');
    }

    // Check for insecure Random usage in security context
    if (content.includes('new Random()') &&
        (content.includes('token') || content.includes('password') || content.includes('secret'))) {
      issues.push('Using java.util.Random for security-sensitive operations. Use SecureRandom instead.');
    }

    // Report issues
    if (issues.length > 0) {
      logHook(`Security issues found in ${path.basename(filePath)}:`, 'WARNING');
      issues.forEach(issue => {
        console.error(`  - ${issue}`);
      });
    }

  } catch (error) {
    logHook(`Failed to run security checks: ${error.message}`, 'ERROR');
  }
}

/**
 * Check if Maven/Gradle security plugins are configured
 * @param {string} cwd - Current working directory
 * @param {string[]} projectTypes - Detected project types
 */
function checkSecurityPluginConfiguration(cwd, projectTypes) {
  if (projectTypes.includes('maven')) {
    const pomPath = path.join(cwd, 'pom.xml');
    if (fs.existsSync(pomPath)) {
      const pomContent = fs.readFileSync(pomPath, 'utf-8');

      const hasSpotBugs = pomContent.includes('spotbugs-maven-plugin');
      const hasFindSecBugs = pomContent.includes('findsecbugs-plugin');
      const _hasPMD = pomContent.includes('maven-pmd-plugin'); // Reserved for future use

      if (!hasSpotBugs || !hasFindSecBugs) {
        logHook(
          'Recommendation: Add SpotBugs + FindSecurityBugs to pom.xml for automated security scanning',
          'INFO'
        );
      }
    }
  }

  if (projectTypes.includes('gradle')) {
    const buildGradlePath = path.join(cwd, 'build.gradle');
    const buildGradleKtsPath = path.join(cwd, 'build.gradle.kts');

    const buildFile = fs.existsSync(buildGradleKtsPath)
      ? buildGradleKtsPath
      : (fs.existsSync(buildGradlePath) ? buildGradlePath : null);

    if (buildFile) {
      const buildContent = fs.readFileSync(buildFile, 'utf-8');

      const hasSpotBugs = buildContent.includes('com.github.spotbugs');
      const _hasPMD = buildContent.includes('pmd'); // Reserved for future use

      if (!hasSpotBugs) {
        logHook(
          'Recommendation: Add SpotBugs Gradle plugin for automated security scanning',
          'INFO'
        );
      }
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

    // If no file path or not a Java file, pass through
    if (!filePath || !filePath.endsWith('.java')) {
      writeHookOutput(context);
      process.exit(0);
    }

    if (!fs.existsSync(filePath)) {
      logHook(`File does not exist: ${filePath}`, 'WARNING');
      writeHookOutput(context);
      process.exit(0);
    }

    // Detect project types
    const projectTypes = detectProjectType(process.cwd());

    // Only run for Maven/Gradle projects
    if (!projectTypes.includes('maven') && !projectTypes.includes('gradle')) {
      writeHookOutput(context);
      process.exit(0);
    }

    // Run basic security checks on source file (fast)
    runBasicSecurityChecks(filePath);

    // Check if security plugins are configured
    checkSecurityPluginConfiguration(process.cwd(), projectTypes);

    // Find compiled classes directory
    const classesDir = findClassesDirectory(process.cwd(), projectTypes);

    if (classesDir) {
      // Run SpotBugs on compiled classes (requires prior build)
      runSpotBugs(classesDir);
    } else {
      logHook(
        'Compiled classes not found. Run `mvn compile` or `./gradlew compileJava` first for full security analysis.',
        'INFO'
      );
    }

    // Always pass through context (required by hook protocol)
    writeHookOutput(context);
    process.exit(0);

  } catch (error) {
    logHook(`Unexpected error: ${error.message}`, 'ERROR');
    // Even on error, try to pass through context
    writeHookOutput({});
    process.exit(0);
  }
}

// Run main function
main().catch((err) => {
  logHook(`Fatal error: ${err.message}`, 'ERROR');
  process.exit(0);
});
