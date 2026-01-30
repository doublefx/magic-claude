/**
 * Package Manager Detection and Selection
 * Automatically detects the preferred package manager or lets user choose
 *
 * Supports: npm, pnpm, yarn, bun
 *
 * NOTE: This module is workspace-aware. When operating in a monorepo,
 * it can detect package managers per-package. Use WorkspaceContext
 * for advanced workspace operations.
 */

const fs = require('fs');
const path = require('path');
const { commandExists, getClaudeDir, readFile, writeFile } = require('./utils.cjs');

// Lazy-load WorkspaceContext to avoid circular dependencies
let _workspaceContext = null;
function getWorkspaceContextSafe() {
  if (!_workspaceContext) {
    try {
      const { getWorkspaceContext } = require('./workspace-context.cjs');
      _workspaceContext = getWorkspaceContext();
    } catch {
      // WorkspaceContext not available, graceful degradation
      _workspaceContext = null;
    }
  }
  return _workspaceContext;
}

// Package manager definitions
const PACKAGE_MANAGERS = {
  npm: {
    name: 'npm',
    lockFile: 'package-lock.json',
    installCmd: 'npm install',
    runCmd: 'npm run',
    execCmd: 'npx',
    testCmd: 'npm test',
    buildCmd: 'npm run build',
    devCmd: 'npm run dev'
  },
  pnpm: {
    name: 'pnpm',
    lockFile: 'pnpm-lock.yaml',
    installCmd: 'pnpm install',
    runCmd: 'pnpm',
    execCmd: 'pnpm dlx',
    testCmd: 'pnpm test',
    buildCmd: 'pnpm build',
    devCmd: 'pnpm dev'
  },
  yarn: {
    name: 'yarn',
    lockFile: 'yarn.lock',
    installCmd: 'yarn',
    runCmd: 'yarn',
    execCmd: 'yarn dlx',
    testCmd: 'yarn test',
    buildCmd: 'yarn build',
    devCmd: 'yarn dev'
  },
  bun: {
    name: 'bun',
    lockFile: 'bun.lockb',
    installCmd: 'bun install',
    runCmd: 'bun run',
    execCmd: 'bunx',
    testCmd: 'bun test',
    buildCmd: 'bun run build',
    devCmd: 'bun run dev'
  }
};

// Priority order for detection
const DETECTION_PRIORITY = ['pnpm', 'bun', 'yarn', 'npm'];

// Config file path
function getConfigPath() {
  return path.join(getClaudeDir(), 'everything-claude-code.package-manager.json');
}

/**
 * Load saved package manager configuration
 */
function loadConfig() {
  const configPath = getConfigPath();
  const content = readFile(configPath);

  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Save package manager configuration
 */
function saveConfig(config) {
  const configPath = getConfigPath();
  writeFile(configPath, JSON.stringify(config, null, 2));
}

/**
 * Detect package manager from lock file in project directory
 */
function detectFromLockFile(projectDir = process.cwd()) {
  for (const pmName of DETECTION_PRIORITY) {
    const pm = PACKAGE_MANAGERS[pmName];
    const lockFilePath = path.join(projectDir, pm.lockFile);

    if (fs.existsSync(lockFilePath)) {
      return pmName;
    }
  }
  return null;
}

/**
 * Detect package manager from package.json packageManager field
 */
function detectFromPackageJson(projectDir = process.cwd()) {
  const packageJsonPath = path.join(projectDir, 'package.json');
  const content = readFile(packageJsonPath);

  if (content) {
    try {
      const pkg = JSON.parse(content);
      if (pkg.packageManager) {
        // Format: "pnpm@8.6.0" or just "pnpm"
        const pmName = pkg.packageManager.split('@')[0];
        if (PACKAGE_MANAGERS[pmName]) {
          return pmName;
        }
      }
    } catch {
      // Invalid package.json
    }
  }
  return null;
}

/**
 * Get available package managers (installed on system)
 */
function getAvailablePackageManagers() {
  const available = [];

  for (const pmName of Object.keys(PACKAGE_MANAGERS)) {
    if (commandExists(pmName)) {
      available.push(pmName);
    }
  }

  return available;
}

/**
 * Get the package manager to use for current project
 *
 * Detection priority:
 * 1. Environment variable CLAUDE_PACKAGE_MANAGER
 * 2. Project-specific config (in .claude/everything-claude-code.package-manager.json)
 * 3. package.json packageManager field
 * 4. Lock file detection
 * 5. Global user preference (in ~/.claude/everything-claude-code.package-manager.json)
 * 6. First available package manager (by priority)
 *
 * @param {object} options - { projectDir, fallbackOrder }
 * @returns {object} - { name, config, source }
 */
function getPackageManager(options = {}) {
  const { projectDir = process.cwd(), fallbackOrder = DETECTION_PRIORITY } = options;

  // 1. Check environment variable
  const envPm = process.env.CLAUDE_PACKAGE_MANAGER;
  if (envPm && PACKAGE_MANAGERS[envPm]) {
    return {
      name: envPm,
      config: PACKAGE_MANAGERS[envPm],
      source: 'environment'
    };
  }

  // 2. Check project-specific config
  const projectConfigPath = path.join(projectDir, '.claude', 'everything-claude-code.package-manager.json');
  const projectConfig = readFile(projectConfigPath);
  if (projectConfig) {
    try {
      const config = JSON.parse(projectConfig);
      if (config.packageManager && PACKAGE_MANAGERS[config.packageManager]) {
        return {
          name: config.packageManager,
          config: PACKAGE_MANAGERS[config.packageManager],
          source: 'project-config'
        };
      }
    } catch {
      // Invalid config
    }
  }

  // 3. Check package.json packageManager field
  const fromPackageJson = detectFromPackageJson(projectDir);
  if (fromPackageJson) {
    return {
      name: fromPackageJson,
      config: PACKAGE_MANAGERS[fromPackageJson],
      source: 'package.json'
    };
  }

  // 4. Check lock file
  const fromLockFile = detectFromLockFile(projectDir);
  if (fromLockFile) {
    return {
      name: fromLockFile,
      config: PACKAGE_MANAGERS[fromLockFile],
      source: 'lock-file'
    };
  }

  // 5. Check global user preference
  const globalConfig = loadConfig();
  if (globalConfig && globalConfig.packageManager && PACKAGE_MANAGERS[globalConfig.packageManager]) {
    return {
      name: globalConfig.packageManager,
      config: PACKAGE_MANAGERS[globalConfig.packageManager],
      source: 'global-config'
    };
  }

  // 6. Use first available package manager
  const available = getAvailablePackageManagers();
  for (const pmName of fallbackOrder) {
    if (available.includes(pmName)) {
      return {
        name: pmName,
        config: PACKAGE_MANAGERS[pmName],
        source: 'fallback'
      };
    }
  }

  // Default to npm (always available with Node.js)
  return {
    name: 'npm',
    config: PACKAGE_MANAGERS.npm,
    source: 'default'
  };
}

/**
 * Set user's preferred package manager (global)
 */
function setPreferredPackageManager(pmName) {
  if (!PACKAGE_MANAGERS[pmName]) {
    throw new Error(`Unknown package manager: ${pmName}`);
  }

  const config = loadConfig() || {};
  config.packageManager = pmName;
  config.setAt = new Date().toISOString();
  saveConfig(config);

  return config;
}

/**
 * Set project's preferred package manager
 */
function setProjectPackageManager(pmName, projectDir = process.cwd()) {
  if (!PACKAGE_MANAGERS[pmName]) {
    throw new Error(`Unknown package manager: ${pmName}`);
  }

  const configDir = path.join(projectDir, '.claude');
  const configPath = path.join(configDir, 'everything-claude-code.package-manager.json');

  const config = {
    packageManager: pmName,
    setAt: new Date().toISOString()
  };

  writeFile(configPath, JSON.stringify(config, null, 2));
  return config;
}

/**
 * Get the command to run a script
 * @param {string} script - Script name (e.g., "dev", "build", "test")
 * @param {object} options - { projectDir }
 */
function getRunCommand(script, options = {}) {
  const pm = getPackageManager(options);

  switch (script) {
    case 'install':
      return pm.config.installCmd;
    case 'test':
      return pm.config.testCmd;
    case 'build':
      return pm.config.buildCmd;
    case 'dev':
      return pm.config.devCmd;
    default:
      return `${pm.config.runCmd} ${script}`;
  }
}

/**
 * Get the command to execute a package binary
 * @param {string} binary - Binary name (e.g., "prettier", "eslint")
 * @param {string} args - Arguments to pass
 */
function getExecCommand(binary, args = '', options = {}) {
  const pm = getPackageManager(options);
  return `${pm.config.execCmd} ${binary}${args ? ' ' + args : ''}`;
}

/**
 * Interactive prompt for package manager selection
 * Returns a message for Claude to show to user
 */
function getSelectionPrompt() {
  const available = getAvailablePackageManagers();
  const current = getPackageManager();

  let message = '[PackageManager] Available package managers:\n';

  for (const pmName of available) {
    const indicator = pmName === current.name ? ' (current)' : '';
    message += `  - ${pmName}${indicator}\n`;
  }

  message += '\nTo set your preferred package manager:\n';
  message += '  - Global: Set CLAUDE_PACKAGE_MANAGER environment variable\n';
  message += '  - Or add to ~/.claude/everything-claude-code.package-manager.json: {"packageManager": "pnpm"}\n';
  message += '  - Or add to package.json: {"packageManager": "pnpm@8"}\n';

  return message;
}

/**
 * Generate a regex pattern that matches commands for all package managers
 * @param {string} action - Action pattern (e.g., "run dev", "install", "test")
 */
function getCommandPattern(action) {
  const patterns = [];

  if (action === 'dev') {
    patterns.push(
      'npm run dev',
      'pnpm( run)? dev',
      'yarn dev',
      'bun run dev'
    );
  } else if (action === 'install') {
    patterns.push(
      'npm install',
      'pnpm install',
      'yarn( install)?',
      'bun install'
    );
  } else if (action === 'test') {
    patterns.push(
      'npm test',
      'pnpm test',
      'yarn test',
      'bun test'
    );
  } else if (action === 'build') {
    patterns.push(
      'npm run build',
      'pnpm( run)? build',
      'yarn build',
      'bun run build'
    );
  } else {
    // Generic run command
    patterns.push(
      `npm run ${action}`,
      `pnpm( run)? ${action}`,
      `yarn ${action}`,
      `bun run ${action}`
    );
  }

  return `(${patterns.join('|')})`;
}

/**
 * Get package manager for a specific file in a workspace
 * Workspace-aware: Detects which package owns the file and returns its package manager
 *
 * @param {string} filePath - Absolute file path
 * @returns {object} - { name, config, source, package }
 */
function getPackageManagerForFile(filePath) {
  const workspace = getWorkspaceContextSafe();

  if (workspace && workspace.isWorkspace()) {
    const pkg = workspace.findPackageForFile(filePath);

    if (pkg) {
      // Get package manager for this specific package
      const pm = getPackageManager({ projectDir: pkg.path });
      return {
        ...pm,
        package: pkg.name,
        packagePath: pkg.path
      };
    }
  }

  // Not in workspace or file not in any package
  const fileDir = path.dirname(filePath);
  return getPackageManager({ projectDir: fileDir });
}

/**
 * Get package manager for a specific package in a workspace
 * Workspace-aware: Finds the package by name and returns its package manager
 *
 * @param {string} packageName - Package name
 * @returns {object|null} - { name, config, source, package } or null if not found
 */
function getPackageManagerForPackage(packageName) {
  const workspace = getWorkspaceContextSafe();

  if (!workspace || !workspace.isWorkspace()) {
    return null;
  }

  const packages = workspace.getAllPackages();
  const pkg = packages.find(p => p.name === packageName);

  if (!pkg) {
    return null;
  }

  const pm = getPackageManager({ projectDir: pkg.path });
  return {
    ...pm,
    package: pkg.name,
    packagePath: pkg.path
  };
}

/**
 * Get all package managers used in a workspace
 * Workspace-aware: Detects package manager for each package in workspace
 *
 * @returns {Array} - Array of { packageName, packagePath, name, config, source }
 */
function getAllWorkspacePackageManagers() {
  const workspace = getWorkspaceContextSafe();

  if (!workspace || !workspace.isWorkspace()) {
    // Not in workspace, return current package manager
    const pm = getPackageManager();
    return [{
      packageName: null,
      packagePath: process.cwd(),
      ...pm
    }];
  }

  const packages = workspace.getAllPackages();
  const results = [];

  for (const pkg of packages) {
    const pm = getPackageManager({ projectDir: pkg.path });
    results.push({
      packageName: pkg.name,
      packagePath: pkg.path,
      ecosystem: pkg.ecosystem,
      ...pm
    });
  }

  return results;
}

/**
 * Check if we're in a workspace/monorepo
 * @returns {boolean}
 */
function isInWorkspace() {
  const workspace = getWorkspaceContextSafe();
  return workspace ? workspace.isWorkspace() : false;
}

module.exports = {
  PACKAGE_MANAGERS,
  DETECTION_PRIORITY,
  getPackageManager,
  setPreferredPackageManager,
  setProjectPackageManager,
  getAvailablePackageManagers,
  detectFromLockFile,
  detectFromPackageJson,
  getRunCommand,
  getExecCommand,
  getSelectionPrompt,
  getCommandPattern,
  // Workspace-aware functions
  getPackageManagerForFile,
  getPackageManagerForPackage,
  getAllWorkspacePackageManagers,
  isInWorkspace
};
