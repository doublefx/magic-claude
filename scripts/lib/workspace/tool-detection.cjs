/**
 * Tool Detection - Cross-platform tool availability checking
 * Detects if development tools are installed and provides installation guidance.
 *
 * All ecosystem-specific data (tools, version commands, installation help) is
 * aggregated from the auto-discovery ecosystem registry — no hardcoded maps.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const {
  getAllEcosystemTools,
  getAllVersionCommands,
  getAllInstallationHelp
} = require('../ecosystems/index.cjs');

/**
 * ToolDetector class - Check tool availability and versions
 */
class ToolDetector {
  constructor() {
    this.platform = process.platform;
    this._cache = {};
  }

  /**
   * Check if a tool is available on the system
   * @param {string} tool - Tool name to check
   * @returns {boolean} - True if tool is available
   */
  isAvailable(tool) {
    const cacheKey = `available:${tool}`;
    if (this._cache[cacheKey] !== undefined) {
      return this._cache[cacheKey];
    }

    const available = this._checkCommand(tool);
    this._cache[cacheKey] = available;
    return available;
  }

  /**
   * Get version string for a tool
   * @param {string} tool - Tool name
   * @returns {string|null} - Version string or null if not available
   */
  getVersion(tool) {
    if (!this.isAvailable(tool)) {
      return null;
    }

    const cacheKey = `version:${tool}`;
    if (this._cache[cacheKey] !== undefined) {
      return this._cache[cacheKey];
    }

    const version = this._getVersionString(tool);
    this._cache[cacheKey] = version;
    return version;
  }

  /**
   * Check multiple tools at once
   * @param {Array<string>} tools - Array of tool names
   * @returns {object} - Map of tool name to availability status
   */
  checkAll(tools) {
    const results = {};
    for (const tool of tools) {
      results[tool] = this.isAvailable(tool);
    }
    return results;
  }

  /**
   * Check if command exists on system
   * @private
   * @param {string} command - Command to check
   * @returns {boolean}
   */
  _checkCommand(command) {
    try {
      const checkCmd = this.platform === 'win32' ? 'where' : 'which';
      execSync(`${checkCmd} ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get version string for a tool
   * @private
   * @param {string} tool - Tool name
   * @returns {string|null}
   */
  _getVersionString(tool) {
    const versionCommands = getAllVersionCommands();

    const command = versionCommands[tool];
    if (!command) {
      return null;
    }

    try {
      const output = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      // Extract version number from output
      const versionMatch = output.match(/\d+\.\d+\.\d+/);
      return versionMatch ? versionMatch[0] : output.trim().split('\n')[0];
    } catch {
      return null;
    }
  }
}

/**
 * Ecosystem tool definitions — built dynamically from the registry.
 */
const ECOSYSTEM_TOOLS = getAllEcosystemTools();

/**
 * Check tools for a specific ecosystem
 * @param {string} ecosystem - Ecosystem name (nodejs, jvm, python, rust, or any discovered)
 * @returns {object} - Map of tool names to availability
 */
function checkEcosystemTools(ecosystem) {
  const detector = new ToolDetector();
  const ecosystemDef = ECOSYSTEM_TOOLS[ecosystem];

  if (!ecosystemDef) {
    return {};
  }

  const results = {};

  // Check runtime tools
  if (ecosystemDef.runtime) {
    for (const tool of ecosystemDef.runtime) {
      results[tool] = detector.isAvailable(tool);
    }
  }

  // Check package managers
  if (ecosystemDef.packageManagers) {
    for (const tool of ecosystemDef.packageManagers) {
      results[tool] = detector.isAvailable(tool);
    }
  }

  // Check build tools
  if (ecosystemDef.buildTools) {
    for (const tool of ecosystemDef.buildTools) {
      results[tool] = detector.isAvailable(tool);
    }
  }

  return results;
}

/**
 * Detect tool with detailed information
 * @param {string} tool - Tool name
 * @returns {object} - { available: boolean, version: string|null }
 */
function detectTool(tool) {
  const detector = new ToolDetector();
  return {
    available: detector.isAvailable(tool),
    version: detector.getVersion(tool)
  };
}

/**
 * Platform-specific installation instructions — built dynamically from the registry.
 */
const INSTALLATION_HELP = getAllInstallationHelp();

/**
 * Get installation help for a tool
 * @param {string} tool - Tool name
 * @param {string} platform - Platform (win32, darwin, linux) - defaults to current platform
 * @returns {string} - Installation instructions
 */
function getInstallationHelp(tool, platform = process.platform) {
  const help = INSTALLATION_HELP[tool];

  if (!help) {
    return `No installation instructions available for '${tool}'.\nPlease refer to the tool's official documentation.`;
  }

  return help[platform] || help.linux || 'Installation instructions not available for this platform.';
}

module.exports = {
  ToolDetector,
  detectTool,
  checkEcosystemTools,
  getInstallationHelp
};
