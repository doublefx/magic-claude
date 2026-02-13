/**
 * Workspace Commands - Command generation for all ecosystems
 * Generates platform-specific commands for package managers and build tools.
 *
 * Delegates to ecosystem modules via the auto-discovery registry.
 * No hardcoded switch statements — each ecosystem is the single source of truth.
 */

const path = require('path');
const fs = require('fs');
const { getEcosystem } = require('../ecosystems/index.cjs');

/**
 * CommandGenerator class - Generate commands for an ecosystem
 */
class CommandGenerator {
  constructor(ecosystem, config = {}) {
    this.ecosystem = ecosystem;
    this.config = config;
    this.platform = config.platform || process.platform;
  }

  /**
   * Get the ecosystem instance with merged config
   * @private
   * @returns {import('../ecosystems/types.cjs').Ecosystem}
   */
  _eco() {
    return getEcosystem(this.ecosystem, this.config);
  }

  /**
   * Generate install/dependency command
   * @returns {string}
   */
  install() {
    const cmd = this._eco().getInstallCommand({ ...this.config, platform: this.platform });
    return cmd || 'echo "Unknown ecosystem"';
  }

  /**
   * Generate test command
   * @returns {string}
   */
  test() {
    const cmd = this._eco().getTestCommand({ ...this.config, platform: this.platform });
    return cmd || 'echo "Unknown ecosystem"';
  }

  /**
   * Generate build command
   * @returns {string}
   */
  build() {
    const cmd = this._eco().getBuildCommand({ ...this.config, platform: this.platform });
    return cmd || 'echo "Unknown ecosystem"';
  }

  /**
   * Generate run command with script name
   * @param {string} script - Script name to run
   * @returns {string}
   */
  run(script) {
    const cmd = this._eco().getRunCommand(script, { ...this.config, platform: this.platform });
    return cmd || 'echo "Unknown ecosystem"';
  }

  /**
   * Generate format command
   * @returns {string}
   */
  format() {
    const cmd = this._eco().getFormatCommand({ ...this.config, platform: this.platform });
    return cmd || 'echo "Unknown ecosystem"';
  }

  /**
   * Generate lint command
   * @returns {string}
   */
  lint() {
    const cmd = this._eco().getLintCommand({ ...this.config, platform: this.platform });
    return cmd || 'echo "Unknown ecosystem"';
  }
}

/**
 * Generate a command for an ecosystem
 * @param {string} ecosystem - Ecosystem name
 * @param {string} action - Action (install, test, build, etc.)
 * @param {object} config - Configuration options
 * @returns {string} - Generated command
 */
function generateCommand(ecosystem, action, config = {}) {
  const generator = new CommandGenerator(ecosystem, config);

  switch (action) {
    case 'install':
      return generator.install();
    case 'test':
      return generator.test();
    case 'build':
      return generator.build();
    case 'format':
      return generator.format();
    case 'lint':
      return generator.lint();
    default:
      // Assume it's a run command
      return generator.run(action);
  }
}

/**
 * Generate install command for an ecosystem
 * @param {string} ecosystem - Ecosystem name
 * @param {object} config - Configuration options
 * @returns {string} - Generated command
 */
function generateInstallCommand(ecosystem, config = {}) {
  const generator = new CommandGenerator(ecosystem, config);
  return generator.install();
}

/**
 * Generate test command for an ecosystem
 * @param {string} ecosystem - Ecosystem name
 * @param {object} config - Configuration options
 * @returns {string} - Generated command
 */
function generateTestCommand(ecosystem, config = {}) {
  const generator = new CommandGenerator(ecosystem, config);
  return generator.test();
}

/**
 * Generate build command for an ecosystem
 * @param {string} ecosystem - Ecosystem name
 * @param {object} config - Configuration options
 * @returns {string} - Generated command
 */
function generateBuildCommand(ecosystem, config = {}) {
  const generator = new CommandGenerator(ecosystem, config);
  return generator.build();
}

module.exports = {
  CommandGenerator,
  generateCommand,
  generateInstallCommand,
  generateTestCommand,
  generateBuildCommand
};
