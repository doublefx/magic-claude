#!/usr/bin/env node
/**
 * SessionStart Hook - Load previous context and detect setup needs
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Simplified approach:
 * - Check .serena/project.yml for setup completion (Serena is source of truth)
 * - Detect package manager from lock files (no JSON config needed)
 * - Suggest /setup if Serena not configured
 */

const fs = require('fs');
const path = require('path');
const {
  getSessionsDir,
  getProjectLearnedSkillsDir,
  getUserLearnedSkillsDir,
  findFiles,
  ensureDir,
  log
} = require('../lib/utils.cjs');
const {
  getPackageManager,
  isInWorkspace,
  getAllWorkspacePackageManagers
} = require('../lib/package-manager.cjs');
const {
  isSerenaInstalled,
  isSerenaEnabled,
  isProjectActivated,
  isJetBrainsAvailable,
  detectLanguages
} = require('../lib/serena.cjs');

/**
 * Read hook input from stdin (JSON format)
 */
function readStdin() {
  return new Promise((resolve) => {
    let data = '';

    // Set a short timeout - SessionStart may not have stdin
    const timeout = setTimeout(() => {
      resolve({});
    }, 100);

    process.stdin.on('data', chunk => {
      clearTimeout(timeout);
      data += chunk;
    });

    process.stdin.on('end', () => {
      clearTimeout(timeout);
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });

    // Handle if stdin is already closed
    if (process.stdin.readableEnded) {
      clearTimeout(timeout);
      resolve({});
    }
  });
}

/**
 * Check if Serena setup is complete (source of truth: .serena/project.yml exists)
 */
function isSerenaSetupComplete() {
  const cwd = process.cwd();
  const serenaProjectFile = path.join(cwd, '.serena', 'project.yml');
  return fs.existsSync(serenaProjectFile);
}

/**
 * Detect workspace setup issues that need attention
 * Simplified: uses .serena/project.yml as setup indicator
 */
function detectSetupNeeds() {
  const issues = [];
  const cwd = process.cwd();

  // Check for package.json in current directory
  const hasPackageJson = fs.existsSync(path.join(cwd, 'package.json'));

  // Check for common ecosystem indicators
  const hasNodeIndicators = fs.existsSync(path.join(cwd, 'node_modules')) ||
                           fs.existsSync(path.join(cwd, 'package-lock.json')) ||
                           fs.existsSync(path.join(cwd, 'pnpm-lock.yaml')) ||
                           fs.existsSync(path.join(cwd, 'yarn.lock'));

  const hasPythonIndicators = fs.existsSync(path.join(cwd, 'requirements.txt')) ||
                              fs.existsSync(path.join(cwd, 'pyproject.toml')) ||
                              fs.existsSync(path.join(cwd, 'setup.py'));

  const hasJvmIndicators = fs.existsSync(path.join(cwd, 'pom.xml')) ||
                           fs.existsSync(path.join(cwd, 'build.gradle')) ||
                           fs.existsSync(path.join(cwd, 'build.gradle.kts'));

  const hasRustIndicators = fs.existsSync(path.join(cwd, 'Cargo.toml'));

  const hasAnyProject = hasNodeIndicators || hasPythonIndicators || hasJvmIndicators || hasRustIndicators;

  // Check for workspace patterns without root package.json
  if (!hasPackageJson) {
    const packagesDir = path.join(cwd, 'packages');
    const appsDir = path.join(cwd, 'apps');
    const servicesDir = path.join(cwd, 'services');

    const hasSubPackages = (fs.existsSync(packagesDir) && fs.statSync(packagesDir).isDirectory()) ||
                          (fs.existsSync(appsDir) && fs.statSync(appsDir).isDirectory()) ||
                          (fs.existsSync(servicesDir) && fs.statSync(servicesDir).isDirectory());

    if (hasSubPackages) {
      issues.push('Workspace structure detected but no root package.json - consider running /setup');
    }
  }

  // Check for node_modules without lock file (incomplete install)
  if (hasPackageJson && fs.existsSync(path.join(cwd, 'node_modules'))) {
    const hasAnyLockFile = fs.existsSync(path.join(cwd, 'package-lock.json')) ||
                          fs.existsSync(path.join(cwd, 'pnpm-lock.yaml')) ||
                          fs.existsSync(path.join(cwd, 'yarn.lock')) ||
                          fs.existsSync(path.join(cwd, 'bun.lockb'));
    if (!hasAnyLockFile) {
      issues.push('node_modules exists but no lock file found - dependencies may be inconsistent');
    }
  }

  // Simplified setup detection: check .serena/project.yml
  const serenaSetupComplete = isSerenaSetupComplete();

  if (hasAnyProject && !serenaSetupComplete && isSerenaInstalled()) {
    // Serena is available but not set up for this project
    issues.push('Serena available but not configured - run /setup to set up project with Serena memories');
  } else if (hasAnyProject && !serenaSetupComplete && !isSerenaInstalled()) {
    // No Serena, suggest basic setup
    issues.push('Project detected - consider running /setup for configuration');
  }

  return {
    issues,
    hasPackageJson,
    serenaSetupComplete,
    ecosystem: hasNodeIndicators ? 'nodejs' :
               hasPythonIndicators ? 'python' :
               hasJvmIndicators ? 'jvm' :
               hasRustIndicators ? 'rust' : 'unknown'
  };
}

async function main() {
  // Read stdin (required for hook protocol, though SessionStart may not have data)
  await readStdin();
  const sessionsDir = getSessionsDir();
  const learnedDir = getProjectLearnedSkillsDir() || getUserLearnedSkillsDir();

  // Ensure directories exist
  ensureDir(sessionsDir);
  ensureDir(learnedDir);

  // Collect context pieces
  const contextParts = [];

  // Check for recent session files (last 7 days)
  const recentSessions = findFiles(sessionsDir, '*.tmp', { maxAge: 7 });

  if (recentSessions.length > 0) {
    log(`[SessionStart] Found ${recentSessions.length} recent session(s)`);
  }

  // Check for learned skills
  const learnedSkills = findFiles(learnedDir, '*.md');

  if (learnedSkills.length > 0) {
    log(`[SessionStart] ${learnedSkills.length} learned skill(s) available`);
    contextParts.push(`${learnedSkills.length} learned skill(s) available in ${learnedDir}`);
  }

  // Detect and report workspace status
  let workspaceInfo = '';

  if (isInWorkspace()) {
    log('[SessionStart] Workspace/monorepo detected');
    const workspaceManagers = getAllWorkspacePackageManagers();
    const uniquePMs = [...new Set(workspaceManagers.map(pm => pm.name))];
    const uniqueEcosystems = [...new Set(workspaceManagers.map(pm => pm.ecosystem).filter(Boolean))];

    workspaceInfo = `Workspace with ${workspaceManagers.length} package(s), ecosystems: ${uniqueEcosystems.join(', ') || 'mixed'}, package managers: ${uniquePMs.join(', ')}`;
    log(`[SessionStart] ${workspaceInfo}`);
  } else {
    const pm = getPackageManager();
    workspaceInfo = `Single project, package manager: ${pm.name} (${pm.source})`;
    log(`[SessionStart] ${workspaceInfo}`);
  }

  // Detect setup needs
  const setupNeeds = detectSetupNeeds();

  if (setupNeeds.issues.length > 0) {
    log('[SessionStart] Setup suggestions:');
    setupNeeds.issues.forEach(issue => log(`  - ${issue}`));
    contextParts.push(`Setup suggestions: ${setupNeeds.issues.join('; ')}`);
  }

  // Serena Integration - Check status
  let serenaStatus = { installed: false, activated: false, jetbrains: false, setupComplete: false };

  if (isSerenaInstalled()) {
    serenaStatus.installed = true;
    serenaStatus.setupComplete = setupNeeds.serenaSetupComplete;
    log('[SessionStart] Serena MCP detected');

    if (serenaStatus.setupComplete) {
      log('[SessionStart] Serena setup complete (.serena/project.yml exists)');
      contextParts.push('Serena: Configured - project memories available via Serena MCP tools');
      contextParts.push('Serena: Prefer Serena code navigation tools (find_symbol, search_for_pattern, get_symbols_overview) over native Grep/Glob for code exploration');
    }

    // Check if project is already activated (with path validation)
    if (isProjectActivated()) {
      serenaStatus.activated = true;
      log('[SessionStart] Serena project already activated (cached, same path)');
    } else if (isSerenaEnabled()) {
      log('[SessionStart] Serena project activation needed');
      contextParts.push('Serena: Project activation needed - will activate on first exploration');
    }

    // Check JetBrains availability
    serenaStatus.jetbrains = isJetBrainsAvailable();
    if (serenaStatus.jetbrains) {
      log('[SessionStart] JetBrains tools available');
    }

    // Detect languages for polyglot hint
    const languages = detectLanguages(process.cwd());
    if (languages.length > 1 && !serenaStatus.jetbrains) {
      contextParts.push(`Serena: Multiple languages detected (${languages.join(', ')}) - consider JetBrains plugin for better support`);
    }
  }

  // Use CLAUDE_ENV_FILE to persist detected environment settings
  if (process.env.CLAUDE_ENV_FILE) {
    try {
      const envLines = [];
      const pm = getPackageManager();

      // Persist detected package manager (from lock file detection)
      envLines.push(`export DETECTED_PKG_MANAGER="${pm.name}"`);
      envLines.push(`export PKG_MANAGER_SOURCE="${pm.source}"`);

      // Persist ecosystem
      envLines.push(`export DETECTED_ECOSYSTEM="${setupNeeds.ecosystem}"`);

      // Persist workspace status
      envLines.push(`export IS_WORKSPACE="${isInWorkspace()}"`);

      // Persist Serena status
      if (serenaStatus.installed) {
        envLines.push(`export SERENA_INSTALLED="true"`);
        envLines.push(`export SERENA_SETUP_COMPLETE="${serenaStatus.setupComplete}"`);
        envLines.push(`export SERENA_JETBRAINS_AVAILABLE="${serenaStatus.jetbrains}"`);

        if (serenaStatus.activated) {
          envLines.push(`export SERENA_PROJECT_ACTIVATED="true"`);
          envLines.push(`export SERENA_PROJECT_PATH="${process.cwd()}"`);
          envLines.push(`export SERENA_PROJECT_NAME="${path.basename(process.cwd())}"`);
        }
      }

      // Write to env file
      fs.appendFileSync(process.env.CLAUDE_ENV_FILE, envLines.join('\n') + '\n');
      log('[SessionStart] Environment persisted to CLAUDE_ENV_FILE');
    } catch (err) {
      log(`[SessionStart] Failed to persist env: ${err.message}`);
    }
  }

  if (contextParts.length > 0 || setupNeeds.issues.length > 0) {
    log('[SessionStart] Context: ' + workspaceInfo);
    contextParts.forEach(part => log('[SessionStart] ' + part));
  }

  // SessionStart hooks should output empty JSON or nothing
  process.exit(0);
}

main().catch(err => {
  console.error('[SessionStart] Error:', err.message);
  console.log(JSON.stringify({}));
  process.exit(0); // Don't block on errors
});
