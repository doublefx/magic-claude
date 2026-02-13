/**
 * Ecosystem Types and Constants
 * Defines ecosystem identifiers and base Ecosystem class
 */

/**
 * Ecosystem type constants
 * Populated by auto-discovery registry in index.cjs
 * Seed with UNKNOWN only — discovered ecosystems are added dynamically
 */
const ECOSYSTEMS = {
  UNKNOWN: 'unknown'
};

/**
 * Base Ecosystem class
 * Each ecosystem extends this and provides specific implementations.
 * Self-describing: all metadata lives here, consumers delegate to the registry.
 */
class Ecosystem {
  constructor(type, config = {}) {
    this.type = type;
    this.config = config;
  }

  /**
   * Get ecosystem type
   * @returns {string}
   */
  getType() {
    return this.type;
  }

  /**
   * Get constant key for ECOSYSTEMS object (e.g. 'NODEJS', 'JVM')
   * @returns {string}
   */
  getConstantKey() {
    return this.type.toUpperCase();
  }

  /**
   * Get detection priority — lower = checked first
   * @returns {number}
   */
  getDetectionPriority() {
    return 50;
  }

  /**
   * Get human-readable ecosystem name
   * @returns {string}
   */
  getName() {
    throw new Error('getName() must be implemented by subclass');
  }

  /**
   * Get file indicators for this ecosystem
   * @returns {string[]} Array of file names that indicate this ecosystem
   */
  getIndicators() {
    throw new Error('getIndicators() must be implemented by subclass');
  }

  /**
   * Get file extensions associated with this ecosystem
   * @returns {string[]}
   */
  getFileExtensions() {
    return [];
  }

  /**
   * Get package manager commands for this ecosystem
   * @returns {object} Object mapping command types to actual commands
   */
  getPackageManagerCommands() {
    throw new Error('getPackageManagerCommands() must be implemented by subclass');
  }

  /**
   * Get tool definitions for tool-detection
   * @returns {{ runtime?: string[], packageManagers?: string[], buildTools?: string[] }}
   */
  getTools() {
    return {};
  }

  /**
   * Get version commands for each tool
   * @returns {{ [tool: string]: string }}
   */
  getVersionCommands() {
    return {};
  }

  /**
   * Get platform-specific installation instructions
   * @returns {{ [tool: string]: { win32: string, darwin: string, linux: string } }}
   */
  getInstallationHelp() {
    return {};
  }

  /**
   * Get setup tool categories for setup-ecosystem.cjs
   * @returns {{ critical?: string[], packageManagers?: string[], buildTools?: string[], recommended?: string[] }}
   */
  getSetupToolCategories() {
    return {};
  }

  /**
   * Get debug statement patterns for hook scripts
   * @returns {Array<{ extensions: RegExp, pattern: RegExp, name: string, message: string, skipPattern?: RegExp }>}
   */
  getDebugPatterns() {
    return [];
  }

  /**
   * Get project sub-types and their indicators
   * For ecosystems with distinct sub-types (e.g. JVM has maven and gradle)
   * @returns {{ [subtype: string]: string[] }}
   */
  getProjectSubTypes() {
    return { [this.type]: this.getIndicators() };
  }

  // --- Config-aware command generation ---
  // These delegate to the existing simple methods by default.
  // Subclasses override to add platform/tool/wrapper awareness.

  /**
   * Get build command for this ecosystem
   * @param {object} [config] - Optional configuration
   * @returns {string|null}
   */
  getBuildCommand(config) {
    return null;
  }

  /**
   * Get test command for this ecosystem
   * @param {object} [config] - Optional configuration
   * @returns {string|null}
   */
  getTestCommand(config) {
    return null;
  }

  /**
   * Get format command for this ecosystem
   * @param {object} [config] - Optional configuration
   * @returns {string|null}
   */
  getFormatCommand(config) {
    return null;
  }

  /**
   * Get lint command for this ecosystem
   * @param {object} [config] - Optional configuration
   * @returns {string|null}
   */
  getLintCommand(config) {
    return null;
  }

  /**
   * Get install command for this ecosystem
   * @param {object} [config] - Optional configuration
   * @returns {string|null}
   */
  getInstallCommand(config) {
    return null;
  }

  /**
   * Get run command for a script
   * @param {string} script - Script/task to run
   * @param {object} [config] - Optional configuration
   * @returns {string|null}
   */
  getRunCommand(script, config) {
    return null;
  }
}

module.exports = {
  ECOSYSTEMS,
  Ecosystem
};
