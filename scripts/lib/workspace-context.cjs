/**
 * Workspace Context - Central abstraction for monorepo/workspace operations
 * Used by hooks, commands, skills, configuration
 *
 * Phases 0-3 Complete:
 * - Phase 0: Foundation and basic API
 * - Phase 1: Ecosystem modules (nodejs, jvm, python, rust)
 * - Phase 2: Workspace detection (pnpm, nx, lerna, yarn, npm, turborepo)
 * - Phase 3: Multi-ecosystem support (mixed-language monorepos)
 */

const fs = require('fs');
const path = require('path');
const { getClaudeDir, getUserLearnedSkillsDir, getProjectLearnedSkillsDir, readFile } = require('./utils.cjs');
const { getPackageManager } = require('./package-manager.cjs');
const { detectWorkspace } = require('./workspace/detection.cjs');
const { enrichPackagesWithEcosystems, detectPackageEcosystem } = require('./workspace/ecosystems.cjs');
const { ConfigLoader } = require('./workspace/config.cjs');

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
   * Detect workspace
   * Uses Phase 2 workspace detection with Phase 3 ecosystem enrichment
   * @private
   */
  _detectWorkspace(startDir) {
    const workspace = detectWorkspace(startDir);

    if (!workspace) {
      return null;
    }

    // Enrich packages with ecosystem information (Phase 3)
    if (workspace.packages) {
      workspace.packages = enrichPackagesWithEcosystems(workspace.packages);
    }

    return workspace;
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
    if (!this._workspace || !this._workspace.packages) {
      return null;
    }

    const absolutePath = path.resolve(filePath);

    // Find package whose path is a prefix of the file path
    // Sort by path length descending to match most specific package first
    const packages = [...this._workspace.packages].sort((a, b) => b.path.length - a.path.length);

    for (const pkg of packages) {
      const pkgPath = path.resolve(pkg.path);
      if (absolutePath.startsWith(pkgPath + path.sep) || absolutePath === pkgPath) {
        return pkg;
      }
    }

    return null;
  }

  /**
   * Find which package a directory belongs to
   * @param {string} dirPath - Directory path
   * @returns {object|null} - Package object or null
   */
  findPackageForDir(dirPath) {
    if (!this._workspace || !this._workspace.packages) {
      return null;
    }

    const absolutePath = path.resolve(dirPath);

    // Find exact match or parent match
    const packages = [...this._workspace.packages].sort((a, b) => b.path.length - a.path.length);

    for (const pkg of packages) {
      const pkgPath = path.resolve(pkg.path);
      if (absolutePath === pkgPath || absolutePath.startsWith(pkgPath + path.sep)) {
        return pkg;
      }
    }

    return null;
  }

  /**
   * Get configuration with hierarchy support
   * @param {string} scope - 'current' (default), 'global', 'workspace', 'package'
   * @param {string} configName - Config file name (default: 'settings')
   * @returns {object} - Configuration object
   */
  getConfig(scope = 'current', configName = 'settings') {
    const workspaceRoot = this.getRoot();
    const loader = new ConfigLoader(workspaceRoot);

    if (scope === 'global') {
      // Load only global config
      return loader.loadGlobal(configName);
    } else if (scope === 'workspace') {
      // Load only workspace config
      return loader.loadWorkspace(configName);
    } else if (scope === 'package') {
      // Load only package config (current directory)
      return loader.loadPackage(this.startDir, configName);
    } else {
      // 'current' - load with full hierarchy
      // If in a package, include package-level config
      const pkg = this.findPackageForDir(this.startDir);
      if (pkg) {
        return loader.load(configName, pkg.path);
      }
      return loader.load(configName);
    }
  }

  /**
   * Get package manager for workspace or current directory
   * @param {string} packageName - Optional package name
   * @returns {object} - { name, ecosystem }
   */
  getPackageManager(packageName) {
    // If packageName provided and in workspace, find that package
    if (packageName && this._workspace) {
      const pkg = this._workspace.packages?.find(p => p.name === packageName);
      if (pkg) {
        const pm = getPackageManager({ projectDir: pkg.path });
        return {
          name: pm.name,
          ecosystem: pkg.ecosystem || detectPackageEcosystem(pkg.path)
        };
      }
    }

    // Use current directory
    const pm = getPackageManager({ projectDir: this.startDir });
    const ecosystem = detectPackageEcosystem(this.startDir);

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
    // Find package that contains this file
    const pkg = this.findPackageForFile(filePath);

    if (pkg) {
      const pm = getPackageManager({ projectDir: pkg.path });
      return {
        name: pm.name,
        ecosystem: pkg.ecosystem || detectPackageEcosystem(pkg.path)
      };
    }

    // Not in workspace package, use file directory
    const fileDir = path.dirname(filePath);
    const pm = getPackageManager({ projectDir: fileDir });

    return {
      name: pm.name,
      ecosystem: detectPackageEcosystem(fileDir)
    };
  }

  /**
   * Get ecosystem for workspace or package
   * @param {string} packageName - Optional package name
   * @returns {string} - 'nodejs', 'jvm', 'python', 'rust', 'unknown'
   */
  getEcosystem(packageName) {
    // If packageName provided and in workspace, find that package
    if (packageName && this._workspace) {
      const pkg = this._workspace.packages?.find(p => p.name === packageName);
      if (pkg) {
        return pkg.ecosystem || detectPackageEcosystem(pkg.path);
      }
    }

    // Use current directory
    return detectPackageEcosystem(this.startDir);
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
