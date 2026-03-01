/**
 * Workspace Detection
 * Detects and parses workspace configurations (pnpm, nx, lerna, yarn, npm, turborepo)
 */

const fs = require('fs');
const path = require('path');
const { WORKSPACE_TYPES, WORKSPACE_INDICATORS } = require('./types.cjs');
const { parseWorkspaceConfig } = require('./parsers.cjs');
const { discoverPackages, discoverNxPackages } = require('./packages.cjs');

/**
 * WorkspaceDetector class
 * Detects workspace and provides workspace information
 */
class WorkspaceDetector {
  constructor(startDir = process.cwd()) {
    this.startDir = startDir || process.cwd();
    this._workspace = null;
    this._detected = false;
  }

  /**
   * Detect workspace
   * @returns {object|null} Workspace info or null
   */
  detect() {
    if (this._detected) {
      return this._workspace;
    }

    this._detected = true;

    // Find workspace root
    const root = findWorkspaceRoot(this.startDir);
    if (!root) {
      this._workspace = null;
      return null;
    }

    // Parse workspace configuration
    const config = parseWorkspaceConfig(root);
    if (!config) {
      this._workspace = null;
      return null;
    }

    // Discover packages
    let packages = [];
    if (config.type === WORKSPACE_TYPES.NX) {
      packages = discoverNxPackages(root, config);
    } else if (config.packages) {
      packages = discoverPackages(root, config.packages);
    }

    this._workspace = {
      type: config.type,
      root,
      packages,
      config
    };

    return this._workspace;
  }

  /**
   * Get workspace type
   * @returns {string|null}
   */
  getType() {
    if (!this._detected) {
      this.detect();
    }
    return this._workspace?.type || WORKSPACE_TYPES.NONE;
  }

  /**
   * Get workspace root
   * @returns {string}
   */
  getRoot() {
    if (!this._detected) {
      this.detect();
    }
    return this._workspace?.root || this.startDir;
  }

  /**
   * Get packages in workspace
   * @returns {Array}
   */
  getPackages() {
    if (!this._detected) {
      this.detect();
    }
    return this._workspace?.packages || [];
  }

  /**
   * Get workspace configuration
   * @returns {object}
   */
  getConfig() {
    if (!this._detected) {
      this.detect();
    }
    return this._workspace?.config || {};
  }
}

/**
 * Find workspace root by walking up directory tree
 * @param {string} startDir - Starting directory
 * @param {number} maxDepth - Maximum depth to walk up (default: 10)
 * @returns {string|null} Workspace root or null
 */
function findWorkspaceRoot(startDir, maxDepth = 10) {
  if (!startDir || typeof startDir !== 'string') {
    return null;
  }

  // Check if directory exists
  try {
    if (!fs.existsSync(startDir)) {
      return null;
    }

    const stats = fs.statSync(startDir);
    if (!stats.isDirectory()) {
      return null;
    }
  } catch (error) {
    return null;
  }

  let currentDir = path.resolve(startDir);
  let depth = 0;

  while (depth < maxDepth) {
    // Check for workspace indicator files
    // 1. Check pnpm-workspace.yaml
    if (
      fs.existsSync(path.join(currentDir, 'pnpm-workspace.yaml')) ||
      fs.existsSync(path.join(currentDir, 'pnpm-workspace.yml'))
    ) {
      return currentDir;
    }

    // 2. Check nx.json
    if (fs.existsSync(path.join(currentDir, 'nx.json'))) {
      return currentDir;
    }

    // 3. Check lerna.json
    if (fs.existsSync(path.join(currentDir, 'lerna.json'))) {
      return currentDir;
    }

    // 4. Check turbo.json
    if (fs.existsSync(path.join(currentDir, 'turbo.json'))) {
      return currentDir;
    }

    // 5. Check package.json with workspaces field
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const content = fs.readFileSync(packageJsonPath, 'utf8');
        const pkg = JSON.parse(content);
        if (pkg.workspaces) {
          return currentDir;
        }
      } catch (error) {
        // Invalid package.json, continue
      }
    }

    // Move up one directory
    const parentDir = path.dirname(currentDir);

    // Reached filesystem root
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
    depth++;
  }

  return null;
}

/**
 * Detect workspace from directory
 * Convenience function that creates detector and returns workspace info
 * @param {string} dir - Directory to check
 * @returns {object|null} Workspace info or null
 */
function detectWorkspace(dir = process.cwd()) {
  const detector = new WorkspaceDetector(dir);
  return detector.detect();
}

/**
 * Check if directory is in a workspace
 * @param {string} dir - Directory to check
 * @returns {boolean}
 */
function isInWorkspace(dir = process.cwd()) {
  return findWorkspaceRoot(dir) !== null;
}

module.exports = {
  WorkspaceDetector,
  WORKSPACE_TYPES,
  WORKSPACE_INDICATORS,
  detectWorkspace,
  findWorkspaceRoot,
  isInWorkspace
};
