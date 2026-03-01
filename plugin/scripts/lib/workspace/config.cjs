/**
 * Configuration Hierarchy
 * Loads and merges configuration from global, workspace, and package levels
 * Precedence: package > workspace > global
 */

const fs = require('fs');
const path = require('path');
const { getClaudeDir } = require('../utils.cjs');
const { findWorkspaceRoot } = require('./detection.cjs');

/**
 * ConfigLoader class
 * Handles loading configuration with hierarchy support
 */
class ConfigLoader {
  constructor(workspaceRoot = process.cwd()) {
    this.workspaceRoot = workspaceRoot || process.cwd();
    this._cache = {};
  }

  /**
   * Load configuration with full hierarchy
   * Merges global, workspace, and package-level configs
   * @param {string} configName - Config file name (without .json extension)
   * @param {string} packagePath - Optional package path for package-level config
   * @returns {object} Merged configuration
   */
  load(configName, packagePath = null) {
    const cacheKey = `${configName}:${packagePath || 'root'}`;

    // Check cache
    if (this._cache[cacheKey]) {
      return this._cache[cacheKey];
    }

    const configs = [];

    // 1. Load global config
    const globalConfig = this.loadGlobal(configName);
    if (Object.keys(globalConfig).length > 0) {
      configs.push(globalConfig);
    }

    // 2. Load workspace config
    const workspaceConfig = this.loadWorkspace(configName);
    if (Object.keys(workspaceConfig).length > 0) {
      configs.push(workspaceConfig);
    }

    // 3. Load package-level config if provided
    if (packagePath) {
      const packageConfig = this.loadPackage(packagePath, configName);
      if (Object.keys(packageConfig).length > 0) {
        configs.push(packageConfig);
      }
    }

    // Merge configs (later configs override earlier)
    const merged = mergeConfigs(configs);

    // Cache result
    this._cache[cacheKey] = merged;

    return merged;
  }

  /**
   * Load global configuration from ~/.claude/
   * @param {string} configName - Config file name (without .json)
   * @returns {object} Configuration object or empty object
   */
  loadGlobal(configName) {
    const configPath = path.join(getClaudeDir(), `${configName}.json`);
    return this._loadConfigFile(configPath);
  }

  /**
   * Load workspace configuration from workspace root
   * @param {string} configName - Config file name (without .json)
   * @returns {object} Configuration object or empty object
   */
  loadWorkspace(configName) {
    const configPath = path.join(this.workspaceRoot, '.claude', `${configName}.json`);
    return this._loadConfigFile(configPath);
  }

  /**
   * Load package-level configuration
   * @param {string} packagePath - Package directory path
   * @param {string} configName - Config file name (without .json)
   * @returns {object} Configuration object or empty object
   */
  loadPackage(packagePath, configName) {
    const configPath = path.join(packagePath, '.claude', `${configName}.json`);
    return this._loadConfigFile(configPath);
  }

  /**
   * Load configuration file
   * @private
   * @param {string} filePath - Full path to config file
   * @returns {object} Configuration object or empty object
   */
  _loadConfigFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return {};
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(content);

      return config || {};
    } catch (error) {
      // Invalid JSON or read error, return empty config
      return {};
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this._cache = {};
  }
}

/**
 * Merge multiple configuration objects
 * Later configs override earlier ones
 * @param {Array<object>} configs - Array of configuration objects
 * @returns {object} Merged configuration
 */
function mergeConfigs(configs) {
  if (!Array.isArray(configs) || configs.length === 0) {
    return {};
  }

  const result = {};

  for (const config of configs) {
    deepMerge(result, config);
  }

  return result;
}

/**
 * Deep merge two objects
 * Arrays are replaced, not merged
 * @private
 * @param {object} target - Target object (mutated)
 * @param {object} source - Source object
 */
function deepMerge(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];

      // If source value is null or undefined, set it
      if (sourceValue === null || sourceValue === undefined) {
        target[key] = sourceValue;
        continue;
      }

      // If source is an array, replace (don't merge arrays)
      if (Array.isArray(sourceValue)) {
        target[key] = [...sourceValue];
        continue;
      }

      // If source is an object (not array, not null), deep merge
      if (typeof sourceValue === 'object') {
        // If target doesn't have this key or it's not an object, create new object
        if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
          target[key] = {};
        }
        deepMerge(target[key], sourceValue);
        continue;
      }

      // Primitive value, just set it
      target[key] = sourceValue;
    }
  }
}

/**
 * Load configuration for a specific package
 * Convenience function that creates loader and loads config
 * @param {string} packagePath - Package directory path
 * @param {string} configName - Config file name (without .json)
 * @returns {object} Merged configuration
 */
function getConfigForPackage(packagePath, configName) {
  // Find workspace root
  const workspaceRoot = findWorkspaceRoot(packagePath) || path.dirname(packagePath);

  const loader = new ConfigLoader(workspaceRoot);
  return loader.load(configName, packagePath);
}

/**
 * Load configuration for a directory
 * Convenience function that determines context and loads appropriate config
 * @param {string} dir - Directory path
 * @param {string} configName - Config file name (without .json)
 * @returns {object} Merged configuration
 */
function loadConfig(dir, configName) {
  // Find workspace root
  const workspaceRoot = findWorkspaceRoot(dir);

  if (workspaceRoot) {
    // In workspace, load with hierarchy
    const loader = new ConfigLoader(workspaceRoot);

    // Check if dir is a package or workspace root
    if (dir === workspaceRoot) {
      return loader.load(configName);
    } else {
      return loader.load(configName, dir);
    }
  } else {
    // Not in workspace, just load from dir or global
    const loader = new ConfigLoader(dir);
    return loader.load(configName);
  }
}

module.exports = {
  ConfigLoader,
  mergeConfigs,
  loadConfig,
  getConfigForPackage
};
