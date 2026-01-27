/**
 * Workspace Context - Central abstraction for monorepo/workspace operations
 * Used by hooks, commands, skills, configuration
 *
 * This is Phase 0 implementation - provides foundation for workspace awareness.
 * Full workspace detection (pnpm, nx, lerna, etc.) will be added in Phases 1-7.
 */

const fs = require('fs');
const path = require('path');
const { getClaudeDir, getUserLearnedSkillsDir, getProjectLearnedSkillsDir, readFile } = require('./utils.cjs');
const { getPackageManager } = require('./package-manager.cjs');

/**
 * WorkspaceContext class - Central abstraction for workspace operations
 */
class WorkspaceContext {
  constructor(startDir = process.cwd()) {
    this.startDir = startDir || process.cwd();

    // Phase 0: Basic initialization
    // Full workspace detection will be added in Phase 2
    this._workspace = this._detectWorkspace(this.startDir);
  }

  /**
   * Detect workspace (Phase 0: minimal implementation)
   * Phase 2 will add full detection for pnpm, nx, lerna, etc.
   * @private
   */
  _detectWorkspace(startDir) {
    // Phase 0: Return null (single-project mode)
    // Phase 2 will implement full workspace detection by walking up directory tree
    return null;
  }

  /**
   * Check if current directory is part of a workspace
   * @returns {boolean}
   */
  isWorkspace() {
    return this._workspace !== null;
  }

  /**
   * Get workspace root directory
   * @returns {string} - Workspace root or startDir if not in workspace
   */
  getRoot() {
    return this._workspace?.root || this.startDir;
  }

  /**
   * Get workspace type
   * @returns {string|null} - Workspace type (pnpm-workspace, nx, lerna, etc.) or null
   */
  getType() {
    return this._workspace?.type || null;
  }

  /**
   * Get all packages in workspace
   * @returns {Array} - Array of package objects { name, path, packageJson }
   */
  getAllPackages() {
    return this._workspace?.packages || [];
  }

  /**
   * Find which package a file belongs to
   * @param {string} filePath - Absolute file path
   * @returns {object|null} - Package object or null
   */
  findPackageForFile(filePath) {
    if (!this._workspace) return null;

    // Phase 0: Not implemented yet
    // Phase 2 will implement package resolution
    return null;
  }

  /**
   * Find which package a directory belongs to
   * @param {string} dirPath - Directory path
   * @returns {object|null} - Package object or null
   */
  findPackageForDir(dirPath) {
    if (!this._workspace) return null;

    // Phase 0: Not implemented yet
    // Phase 2 will implement package resolution
    return null;
  }

  /**
   * Get configuration with hierarchy support
   * @param {string} scope - 'current' (default), 'global', 'workspace', 'package'
   * @returns {object} - Configuration object
   */
  getConfig(scope = 'current') {
    const config = {};

    if (scope === 'global') {
      // Load global config from ~/.claude/
      const globalConfigPath = path.join(getClaudeDir(), 'settings.json');
      const globalConfig = readFile(globalConfigPath);
      if (globalConfig) {
        try {
          Object.assign(config, JSON.parse(globalConfig));
        } catch {
          // Invalid JSON
        }
      }
    } else if (scope === 'current') {
      // Load current scope (project or global)
      const projectConfigPath = path.join(this.startDir, '.claude', 'settings.json');
      const projectConfig = readFile(projectConfigPath);
      if (projectConfig) {
        try {
          Object.assign(config, JSON.parse(projectConfig));
        } catch {
          // Invalid JSON
        }
      } else {
        // Fall back to global
        return this.getConfig('global');
      }
    }

    return config;
  }

  /**
   * Get package manager for workspace or current directory
   * @param {string} packageName - Optional package name
   * @returns {object} - { name, ecosystem }
   */
  getPackageManager(packageName) {
    const pm = getPackageManager({ projectDir: this.startDir });

    // Determine ecosystem based on package manager
    let ecosystem = 'nodejs';

    // Check for other ecosystem indicators
    if (fs.existsSync(path.join(this.startDir, 'pom.xml')) ||
        fs.existsSync(path.join(this.startDir, 'build.gradle')) ||
        fs.existsSync(path.join(this.startDir, 'build.gradle.kts'))) {
      ecosystem = 'jvm';
    } else if (fs.existsSync(path.join(this.startDir, 'requirements.txt')) ||
               fs.existsSync(path.join(this.startDir, 'pyproject.toml')) ||
               fs.existsSync(path.join(this.startDir, 'setup.py'))) {
      ecosystem = 'python';
    } else if (fs.existsSync(path.join(this.startDir, 'Cargo.toml'))) {
      ecosystem = 'rust';
    }

    return {
      name: pm.name,
      ecosystem
    };
  }

  /**
   * Get package manager for a specific file's package
   * @param {string} filePath - File path
   * @returns {object} - { name, ecosystem }
   */
  getPackageManagerForFile(filePath) {
    // Phase 0: Use directory of file
    // Phase 2 will resolve to package first
    const fileDir = path.dirname(filePath);
    const pm = getPackageManager({ projectDir: fileDir });

    return {
      name: pm.name,
      ecosystem: this.getEcosystem()
    };
  }

  /**
   * Get ecosystem for workspace or package
   * @param {string} packageName - Optional package name
   * @returns {string} - 'nodejs', 'jvm', 'python', 'rust', 'unknown'
   */
  getEcosystem(packageName) {
    // Phase 0: Detect from current directory
    // Phase 3 will support per-package ecosystem detection

    const dir = this.startDir;

    // Check for JVM project files
    if (fs.existsSync(path.join(dir, 'pom.xml')) ||
        fs.existsSync(path.join(dir, 'build.gradle')) ||
        fs.existsSync(path.join(dir, 'build.gradle.kts'))) {
      return 'jvm';
    }

    // Check for Python project files
    if (fs.existsSync(path.join(dir, 'requirements.txt')) ||
        fs.existsSync(path.join(dir, 'pyproject.toml')) ||
        fs.existsSync(path.join(dir, 'setup.py')) ||
        fs.existsSync(path.join(dir, 'Pipfile'))) {
      return 'python';
    }

    // Check for Rust project files
    if (fs.existsSync(path.join(dir, 'Cargo.toml'))) {
      return 'rust';
    }

    // Check for Node.js project files
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return 'nodejs';
    }

    return 'nodejs'; // Default fallback
  }

  /**
   * Get learned skills directory
   * @param {string} scope - 'workspace' (default) or 'user'
   * @returns {string} - Directory path
   */
  getLearnedSkillsDir(scope = 'workspace') {
    if (scope === 'user') {
      return getUserLearnedSkillsDir();
    }

    // Workspace scope: prefer workspace root, fall back to project, then user
    if (this._workspace) {
      return path.join(this._workspace.root, '.claude', 'skills', 'learned');
    }

    // Not in workspace: use project if exists, otherwise user
    return getProjectLearnedSkillsDir() || getUserLearnedSkillsDir();
  }
}

// Global singleton
let _workspaceContext = null;

/**
 * Get workspace context singleton
 * @param {boolean} refresh - Force refresh (create new instance)
 * @returns {WorkspaceContext}
 */
function getWorkspaceContext(refresh = false) {
  if (!_workspaceContext || refresh) {
    _workspaceContext = new WorkspaceContext();
  }
  return _workspaceContext;
}

module.exports = {
  WorkspaceContext,
  getWorkspaceContext
};
