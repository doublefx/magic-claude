#!/usr/bin/env node
/**
 * SessionStart Hook - Load previous context and detect setup needs
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs when a new Claude session starts:
 * 1. Checks for recent session files
 * 2. Detects workspace/project setup needs
 * 3. Outputs context via hookSpecificOutput.additionalContext
 * 4. Claude can proactively offer help based on detected needs
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
 * Load cached ecosystems data if available
 * Returns null if cache doesn't exist or is invalid
 */
function loadCachedEcosystems() {
  const cwd = process.cwd();
  const cacheFile = path.join(cwd, '.claude', 'everything-claude-code.ecosystems.json');

  if (!fs.existsSync(cacheFile)) {
    return null;
  }

  try {
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    // Validate minimum required structure
    if (data.ecosystems && Array.isArray(data.ecosystems) && data.detectedAt) {
      log('[SessionStart] Loaded cached ecosystems data');
      return data;
    }
  } catch (err) {
    log(`[SessionStart] Failed to load ecosystems cache: ${err.message}`);
  }

  return null;
}

/**
 * Format cached ecosystems for context output
 */
function formatEcosystemsContext(ecosystemsData) {
  if (!ecosystemsData || !ecosystemsData.ecosystems) {
    return null;
  }

  const parts = [];
  for (const eco of ecosystemsData.ecosystems) {
    const projectPaths = eco.projects ? eco.projects.map(p => p.path).join(', ') : 'root';
    const frameworks = eco.projects ?
      [...new Set(eco.projects.flatMap(p => [p.framework, ...(p.frameworks || [])].filter(Boolean)))].join(', ') :
      '';
    let info = `${eco.type}: ${projectPaths}`;
    if (frameworks) {
      info += ` (${frameworks})`;
    }
    if (eco.version) {
      info += ` [v${eco.version}]`;
    }
    parts.push(info);
  }

  return parts.length > 0 ? `Ecosystems: ${parts.join('; ')}` : null;
}

/**
 * Detect workspace setup issues that need attention
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

  // Check for workspace patterns without root package.json
  if (!hasPackageJson) {
    // Look for sub-packages
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

  // Check package manager configuration
  const pm = getPackageManager();
  if (pm.source === 'fallback' || pm.source === 'default') {
    issues.push(`No package manager preference configured - using ${pm.name} as fallback`);
  }

  // Check for missing .claude directory (first time setup)
  const claudeDir = path.join(cwd, '.claude');
  const setupStatusFile = path.join(claudeDir, 'everything-claude-code.setup-status.json');
  let setupStatus = null;

  if (!fs.existsSync(claudeDir) && (hasNodeIndicators || hasPythonIndicators || hasJvmIndicators || hasRustIndicators)) {
    issues.push('Project detected but no .claude/ configuration - consider running /setup for project-specific settings');
  } else if (fs.existsSync(setupStatusFile)) {
    // Load existing setup status
    try {
      setupStatus = JSON.parse(fs.readFileSync(setupStatusFile, 'utf8'));
      // Check if Serena setup is still pending
      if (setupStatus.serena_setup_needed && !setupStatus.serena_setup_complete) {
        issues.push('Serena setup incomplete - run /serena-setup to complete');
      }
    } catch {
      // Invalid status file, ignore
    }
  } else if (fs.existsSync(claudeDir) && (hasNodeIndicators || hasPythonIndicators || hasJvmIndicators || hasRustIndicators)) {
    // .claude exists but no everything-claude-code.setup-status.json - might be old setup or manual config
    issues.push('No setup status found - consider running /setup to configure project');
  }

  return {
    issues,
    hasPackageJson,
    setupStatus,
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

  // Try to load cached ecosystems data first (optimization)
  const cachedEcosystems = loadCachedEcosystems();
  const ecosystemsContext = formatEcosystemsContext(cachedEcosystems);

  if (ecosystemsContext) {
    contextParts.push(ecosystemsContext);
    log(`[SessionStart] ${ecosystemsContext}`);
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

  // Serena Integration - Check and activate project
  let serenaStatus = { installed: false, activated: false, jetbrains: false };

  if (isSerenaInstalled()) {
    serenaStatus.installed = true;
    log('[SessionStart] Serena MCP detected');

    // Check if project is already activated (with path validation)
    if (isProjectActivated()) {
      serenaStatus.activated = true;
      log('[SessionStart] Serena project already activated (cached, same path)');
    } else if (isSerenaEnabled()) {
      // Need to activate project - will be done via MCP tool call
      // We just note that activation is needed
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
  // These become available to subsequent hooks and commands
  if (process.env.CLAUDE_ENV_FILE) {
    try {
      const envLines = [];
      const pm = getPackageManager();

      // Persist detected package manager
      envLines.push(`export DETECTED_PKG_MANAGER="${pm.name}"`);
      envLines.push(`export PKG_MANAGER_SOURCE="${pm.source}"`);

      // Persist ecosystem (from cache if available, otherwise from detection)
      if (cachedEcosystems && cachedEcosystems.ecosystems) {
        const ecoTypes = cachedEcosystems.ecosystems.map(e => e.type).join(',');
        envLines.push(`export DETECTED_ECOSYSTEMS="${ecoTypes}"`);
        envLines.push(`export ECOSYSTEMS_CACHED="true"`);
      } else {
        envLines.push(`export DETECTED_ECOSYSTEM="${setupNeeds.ecosystem}"`);
        envLines.push(`export ECOSYSTEMS_CACHED="false"`);
      }

      // Persist workspace status
      envLines.push(`export IS_WORKSPACE="${isInWorkspace()}"`);

      // Persist Serena status
      if (serenaStatus.installed) {
        envLines.push(`export SERENA_INSTALLED="true"`);
        envLines.push(`export SERENA_JETBRAINS_AVAILABLE="${serenaStatus.jetbrains}"`);

        // Only persist activation if already activated (validated by path)
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
  // Do not pass through the input - just exit cleanly
  process.exit(0);
}

main().catch(err => {
  console.error('[SessionStart] Error:', err.message);
  // On error, try to pass through input
  console.log(JSON.stringify({}));
  process.exit(0); // Don't block on errors
});
