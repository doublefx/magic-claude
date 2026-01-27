/**
 * Package Discovery
 * Find packages in workspace based on glob patterns
 */

const fs = require('fs');
const path = require('path');

/**
 * Convert glob pattern to regex
 * Supports * and ** wildcards
 * @param {string} pattern - Glob pattern
 * @returns {RegExp} Regular expression
 */
function globToRegex(pattern) {
  // Escape special regex characters except * and /
  let regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__DOUBLESTAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__DOUBLESTAR__/g, '.*');

  return new RegExp(`^${regexStr}$`);
}

/**
 * Find directories matching glob patterns
 * @param {string} workspaceRoot - Workspace root directory
 * @param {string[]} patterns - Glob patterns
 * @param {number} maxDepth - Maximum depth to search (default: 5)
 * @returns {string[]} Array of matching directory paths
 */
function findMatchingDirectories(workspaceRoot, patterns, maxDepth = 5) {
  const results = [];
  const regexPatterns = patterns.map(p => globToRegex(p));

  function walk(dir, depth = 0) {
    if (depth > maxDepth) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        // Skip node_modules and hidden directories
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(workspaceRoot, fullPath);

        // Check if path matches any pattern
        for (const regex of regexPatterns) {
          if (regex.test(relativePath)) {
            // Check if it has package.json
            if (fs.existsSync(path.join(fullPath, 'package.json'))) {
              results.push(fullPath);
            }
            break;
          }
        }

        // Continue walking
        walk(fullPath, depth + 1);
      }
    } catch (error) {
      // Permission error or other issue, skip
    }
  }

  walk(workspaceRoot);
  return results;
}

/**
 * Discover packages in workspace
 * @param {string} workspaceRoot - Workspace root directory
 * @param {string[]} patterns - Glob patterns for packages
 * @returns {Array} Array of package objects { name, path, packageJson }
 */
function discoverPackages(workspaceRoot, patterns) {
  if (!patterns || patterns.length === 0) {
    return [];
  }

  const packageDirs = findMatchingDirectories(workspaceRoot, patterns);
  const packages = [];

  for (const pkgDir of packageDirs) {
    try {
      const packageJsonPath = path.join(pkgDir, 'package.json');
      const content = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);

      packages.push({
        name: packageJson.name || path.basename(pkgDir),
        path: pkgDir,
        relativePath: path.relative(workspaceRoot, pkgDir),
        packageJson
      });
    } catch (error) {
      // Invalid package.json, skip
      continue;
    }
  }

  return packages;
}

/**
 * Discover NX packages (uses project.json files)
 * @param {string} workspaceRoot - Workspace root directory
 * @param {object} nxConfig - NX configuration
 * @returns {Array} Array of package objects
 */
function discoverNxPackages(workspaceRoot, nxConfig) {
  const packages = [];

  // NX can define projects in nx.json or use project.json files
  if (nxConfig.projects && typeof nxConfig.projects === 'object') {
    for (const [name, projectConfig] of Object.entries(nxConfig.projects)) {
      if (typeof projectConfig === 'string') {
        // Project path
        const projectPath = path.join(workspaceRoot, projectConfig);
        if (fs.existsSync(projectPath)) {
          const packageJsonPath = path.join(projectPath, 'package.json');
          let packageJson = { name };

          if (fs.existsSync(packageJsonPath)) {
            try {
              packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            } catch {}
          }

          packages.push({
            name,
            path: projectPath,
            relativePath: projectConfig,
            packageJson
          });
        }
      }
    }
  }

  // Also scan for project.json files
  const projectJsonFiles = findProjectJsonFiles(workspaceRoot);
  for (const projectJsonPath of projectJsonFiles) {
    const projectDir = path.dirname(projectJsonPath);
    const packageJsonPath = path.join(projectDir, 'package.json');

    let name = path.basename(projectDir);
    let packageJson = { name };

    if (fs.existsSync(packageJsonPath)) {
      try {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        name = packageJson.name || name;
      } catch {}
    }

    // Check if already added
    if (!packages.some(p => p.path === projectDir)) {
      packages.push({
        name,
        path: projectDir,
        relativePath: path.relative(workspaceRoot, projectDir),
        packageJson
      });
    }
  }

  return packages;
}

/**
 * Find project.json files in workspace
 * @param {string} workspaceRoot - Workspace root directory
 * @param {number} maxDepth - Maximum depth to search
 * @returns {string[]} Array of project.json file paths
 */
function findProjectJsonFiles(workspaceRoot, maxDepth = 5) {
  const results = [];

  function walk(dir, depth = 0) {
    if (depth > maxDepth) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath, depth + 1);
        } else if (entry.name === 'project.json') {
          results.push(fullPath);
        }
      }
    } catch (error) {
      // Skip
    }
  }

  walk(workspaceRoot);
  return results;
}

module.exports = {
  discoverPackages,
  discoverNxPackages,
  findMatchingDirectories,
  globToRegex
};
