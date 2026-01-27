/**
 * Workspace Ecosystems
 * Multi-ecosystem support: detect ecosystems per package in workspace
 * Integrates ecosystem detection (Phase 1) with workspace detection (Phase 2)
 */

const { detectEcosystem, ECOSYSTEMS } = require('../ecosystems/index.cjs');
const { detectWorkspace } = require('./detection.cjs');

/**
 * Detect ecosystem for a single package
 * @param {string} packagePath - Package directory path
 * @returns {string} Ecosystem type (nodejs, jvm, python, rust, unknown)
 */
function detectPackageEcosystem(packagePath) {
  return detectEcosystem(packagePath);
}

/**
 * Detect all ecosystems present in a workspace
 * Returns object with ecosystem counts
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {object} Object mapping ecosystem type to count { nodejs: 2, jvm: 1, ... }
 */
function detectWorkspaceEcosystems(workspaceRoot) {
  const workspace = detectWorkspace(workspaceRoot);

  if (!workspace || !workspace.packages) {
    return {};
  }

  const ecosystemCounts = {};

  for (const pkg of workspace.packages) {
    const ecosystem = detectPackageEcosystem(pkg.path);

    if (ecosystem && ecosystem !== ECOSYSTEMS.UNKNOWN) {
      ecosystemCounts[ecosystem] = (ecosystemCounts[ecosystem] || 0) + 1;
    }
  }

  return ecosystemCounts;
}

/**
 * Enrich packages with ecosystem information
 * Adds ecosystem property to each package
 * @param {Array} packages - Array of package objects
 * @returns {Array} Array of packages with ecosystem property added
 */
function enrichPackagesWithEcosystems(packages) {
  if (!Array.isArray(packages)) {
    return [];
  }

  return packages.map(pkg => ({
    ...pkg,
    ecosystem: detectPackageEcosystem(pkg.path)
  }));
}

/**
 * Get packages grouped by ecosystem
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {object} Object mapping ecosystem type to array of packages
 */
function getPackagesByEcosystem(workspaceRoot) {
  const workspace = detectWorkspace(workspaceRoot);

  if (!workspace || !workspace.packages) {
    return {};
  }

  const enriched = enrichPackagesWithEcosystems(workspace.packages);
  const grouped = {};

  for (const pkg of enriched) {
    const ecosystem = pkg.ecosystem || ECOSYSTEMS.UNKNOWN;

    if (!grouped[ecosystem]) {
      grouped[ecosystem] = [];
    }

    grouped[ecosystem].push(pkg);
  }

  return grouped;
}

/**
 * Check if workspace has multiple ecosystems
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {boolean}
 */
function isMultiEcosystem(workspaceRoot) {
  const ecosystems = detectWorkspaceEcosystems(workspaceRoot);
  const count = Object.keys(ecosystems).length;
  return count > 1;
}

/**
 * Get primary ecosystem for workspace
 * Returns the most common ecosystem type
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {string|null} Primary ecosystem type or null
 */
function getPrimaryEcosystem(workspaceRoot) {
  const ecosystems = detectWorkspaceEcosystems(workspaceRoot);

  if (Object.keys(ecosystems).length === 0) {
    return null;
  }

  // Find ecosystem with highest count
  let primary = null;
  let maxCount = 0;

  for (const [ecosystem, count] of Object.entries(ecosystems)) {
    if (count > maxCount) {
      maxCount = count;
      primary = ecosystem;
    }
  }

  return primary;
}

module.exports = {
  detectPackageEcosystem,
  detectWorkspaceEcosystems,
  enrichPackagesWithEcosystems,
  getPackagesByEcosystem,
  isMultiEcosystem,
  getPrimaryEcosystem
};
