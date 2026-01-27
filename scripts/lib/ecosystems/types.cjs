/**
 * Ecosystem Types and Constants
 * Defines ecosystem identifiers and base Ecosystem class
 */

/**
 * Ecosystem type constants
 */
const ECOSYSTEMS = {
  NODEJS: 'nodejs',
  JVM: 'jvm',
  PYTHON: 'python',
  RUST: 'rust',
  UNKNOWN: 'unknown'
};

/**
 * Base Ecosystem class
 * Each ecosystem extends this and provides specific implementations
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
   * Get package manager commands for this ecosystem
   * @returns {object} Object mapping command types to actual commands
   */
  getPackageManagerCommands() {
    throw new Error('getPackageManagerCommands() must be implemented by subclass');
  }

  /**
   * Get build command for this ecosystem
   * @returns {string|null}
   */
  getBuildCommand() {
    return null;
  }

  /**
   * Get test command for this ecosystem
   * @returns {string|null}
   */
  getTestCommand() {
    return null;
  }

  /**
   * Get format command for this ecosystem
   * @returns {string|null}
   */
  getFormatCommand() {
    return null;
  }

  /**
   * Get lint command for this ecosystem
   * @returns {string|null}
   */
  getLintCommand() {
    return null;
  }
}

module.exports = {
  ECOSYSTEMS,
  Ecosystem
};
