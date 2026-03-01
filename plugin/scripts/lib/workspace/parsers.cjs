/**
 * Workspace Configuration Parsers
 * Parsers for different workspace types: pnpm, nx, lerna, yarn, npm, turborepo
 */

const fs = require('fs');
const path = require('path');
const { WORKSPACE_TYPES } = require('./types.cjs');

/**
 * Parse pnpm-workspace.yaml
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {object|null} Parsed workspace config
 */
function parsePnpmWorkspace(workspaceRoot) {
  const yamlPath = path.join(workspaceRoot, 'pnpm-workspace.yaml');
  const ymlPath = path.join(workspaceRoot, 'pnpm-workspace.yml');

  let configPath = null;
  if (fs.existsSync(yamlPath)) {
    configPath = yamlPath;
  } else if (fs.existsSync(ymlPath)) {
    configPath = ymlPath;
  } else {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');

    // Simple YAML parser for packages array
    // Format: packages:\n  - "pattern1"\n  - "pattern2"
    const packagesMatch = content.match(/packages:\s*\n((?:\s*-\s*['"]?.+['"]?\s*\n?)+)/);

    if (!packagesMatch) {
      return { type: WORKSPACE_TYPES.PNPM, packages: [] };
    }

    const packagesStr = packagesMatch[1];
    const patterns = [];

    const lines = packagesStr.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*-\s*['"]?([^'"]+)['"]?\s*$/);
      if (match) {
        patterns.push(match[1]);
      }
    }

    return {
      type: WORKSPACE_TYPES.PNPM,
      packages: patterns
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse nx.json
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {object|null} Parsed workspace config
 */
function parseNxWorkspace(workspaceRoot) {
  const nxPath = path.join(workspaceRoot, 'nx.json');

  if (!fs.existsSync(nxPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(nxPath, 'utf8');
    const config = JSON.parse(content);

    // NX uses project.json files in each package
    // Or projects defined in nx.json
    return {
      type: WORKSPACE_TYPES.NX,
      projects: config.projects || {},
      npmScope: config.npmScope
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse lerna.json
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {object|null} Parsed workspace config
 */
function parseLernaWorkspace(workspaceRoot) {
  const lernaPath = path.join(workspaceRoot, 'lerna.json');

  if (!fs.existsSync(lernaPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(lernaPath, 'utf8');
    const config = JSON.parse(content);

    return {
      type: WORKSPACE_TYPES.LERNA,
      packages: config.packages || ['packages/*'],
      version: config.version,
      npmClient: config.npmClient
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse turbo.json
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {object|null} Parsed workspace config
 */
function parseTurborepoWorkspace(workspaceRoot) {
  const turboPath = path.join(workspaceRoot, 'turbo.json');

  if (!fs.existsSync(turboPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(turboPath, 'utf8');
    const config = JSON.parse(content);

    return {
      type: WORKSPACE_TYPES.TURBOREPO,
      pipeline: config.pipeline || {}
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse package.json workspaces field (Yarn/NPM)
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {object|null} Parsed workspace config
 */
function parsePackageJsonWorkspaces(workspaceRoot) {
  const pkgPath = path.join(workspaceRoot, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(content);

    if (!pkg.workspaces) {
      return null;
    }

    // Workspaces can be array or object with packages property
    let packages = [];
    if (Array.isArray(pkg.workspaces)) {
      packages = pkg.workspaces;
    } else if (pkg.workspaces.packages) {
      packages = pkg.workspaces.packages;
    }

    // Detect if yarn or npm by checking lock files
    const hasYarnLock = fs.existsSync(path.join(workspaceRoot, 'yarn.lock'));
    const type = hasYarnLock ? WORKSPACE_TYPES.YARN : WORKSPACE_TYPES.NPM;

    return {
      type,
      packages
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse workspace configuration
 * Detects workspace type and parses config
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {object|null} Parsed workspace config
 */
function parseWorkspaceConfig(workspaceRoot) {
  // Try parsers in order of specificity
  // Most specific first (explicit workspace files)

  // 1. Try pnpm (most specific)
  const pnpmConfig = parsePnpmWorkspace(workspaceRoot);
  if (pnpmConfig) return pnpmConfig;

  // 2. Try NX
  const nxConfig = parseNxWorkspace(workspaceRoot);
  if (nxConfig) return nxConfig;

  // 3. Try Lerna
  const lernaConfig = parseLernaWorkspace(workspaceRoot);
  if (lernaConfig) return lernaConfig;

  // 4. Try Turborepo
  const turboConfig = parseTurborepoWorkspace(workspaceRoot);
  if (turboConfig) return turboConfig;

  // 5. Try Yarn/NPM workspaces (least specific)
  const packageJsonConfig = parsePackageJsonWorkspaces(workspaceRoot);
  if (packageJsonConfig) return packageJsonConfig;

  return null;
}

module.exports = {
  parsePnpmWorkspace,
  parseNxWorkspace,
  parseLernaWorkspace,
  parseTurborepoWorkspace,
  parsePackageJsonWorkspaces,
  parseWorkspaceConfig
};
