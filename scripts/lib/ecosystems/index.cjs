/**
 * Ecosystem Registry
 * Central registry for all supported ecosystems
 */

const fs = require('fs');
const path = require('path');
const { ECOSYSTEMS, Ecosystem } = require('./types.cjs');
const { NodejsEcosystem } = require('./nodejs.cjs');
const { JvmEcosystem } = require('./jvm.cjs');
const { PythonEcosystem } = require('./python.cjs');
const { RustEcosystem } = require('./rust.cjs');

/**
 * Unknown/fallback ecosystem
 */
class UnknownEcosystem extends Ecosystem {
  constructor() {
    super(ECOSYSTEMS.UNKNOWN);
  }

  getName() {
    return 'Unknown';
  }

  getIndicators() {
    return [];
  }

  getPackageManagerCommands() {
    return {};
  }
}

/**
 * Ecosystem registry mapping
 */
const ECOSYSTEM_REGISTRY = {
  [ECOSYSTEMS.NODEJS]: NodejsEcosystem,
  [ECOSYSTEMS.JVM]: JvmEcosystem,
  [ECOSYSTEMS.PYTHON]: PythonEcosystem,
  [ECOSYSTEMS.RUST]: RustEcosystem,
  [ECOSYSTEMS.UNKNOWN]: UnknownEcosystem
};

/**
 * Get ecosystem instance by type
 * @param {string} type - Ecosystem type from ECOSYSTEMS constants
 * @param {object} config - Optional configuration
 * @returns {Ecosystem} Ecosystem instance
 */
function getEcosystem(type, config = {}) {
  const EcosystemClass = ECOSYSTEM_REGISTRY[type] || UnknownEcosystem;
  return new EcosystemClass(config);
}

/**
 * Detect ecosystem from directory by checking for indicator files
 * @param {string} dir - Directory to check
 * @returns {string} Ecosystem type from ECOSYSTEMS constants
 */
function detectEcosystem(dir) {
  // Handle invalid directory
  if (!dir || typeof dir !== 'string') {
    return ECOSYSTEMS.UNKNOWN;
  }

  // Check if directory exists
  try {
    if (!fs.existsSync(dir)) {
      return ECOSYSTEMS.UNKNOWN;
    }

    const stats = fs.statSync(dir);
    if (!stats.isDirectory()) {
      return ECOSYSTEMS.UNKNOWN;
    }
  } catch (error) {
    return ECOSYSTEMS.UNKNOWN;
  }

  // Detection priority order
  // Check Rust first (most specific)
  const rustEco = getEcosystem(ECOSYSTEMS.RUST);
  for (const indicator of rustEco.getIndicators()) {
    if (fs.existsSync(path.join(dir, indicator))) {
      return ECOSYSTEMS.RUST;
    }
  }

  // Check JVM (Maven/Gradle)
  const jvmEco = getEcosystem(ECOSYSTEMS.JVM);
  for (const indicator of jvmEco.getIndicators()) {
    if (fs.existsSync(path.join(dir, indicator))) {
      return ECOSYSTEMS.JVM;
    }
  }

  // Check Python
  const pythonEco = getEcosystem(ECOSYSTEMS.PYTHON);
  for (const indicator of pythonEco.getIndicators()) {
    if (fs.existsSync(path.join(dir, indicator))) {
      return ECOSYSTEMS.PYTHON;
    }
  }

  // Check Node.js (most common, check last)
  const nodejsEco = getEcosystem(ECOSYSTEMS.NODEJS);
  for (const indicator of nodejsEco.getIndicators()) {
    if (fs.existsSync(path.join(dir, indicator))) {
      return ECOSYSTEMS.NODEJS;
    }
  }

  return ECOSYSTEMS.UNKNOWN;
}

/**
 * Detect multiple ecosystems in a directory
 * Useful for monorepos with mixed languages
 * @param {string} dir - Directory to check
 * @returns {string[]} Array of detected ecosystem types
 */
function detectMultipleEcosystems(dir) {
  // Handle invalid directory
  if (!dir || typeof dir !== 'string') {
    return [];
  }

  // Check if directory exists
  try {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const stats = fs.statSync(dir);
    if (!stats.isDirectory()) {
      return [];
    }
  } catch (error) {
    return [];
  }

  const detected = [];

  // Check all ecosystems
  for (const type of Object.values(ECOSYSTEMS)) {
    if (type === ECOSYSTEMS.UNKNOWN) continue;

    const eco = getEcosystem(type);
    for (const indicator of eco.getIndicators()) {
      if (fs.existsSync(path.join(dir, indicator))) {
        if (!detected.includes(type)) {
          detected.push(type);
        }
        break;
      }
    }
  }

  return detected.length > 0 ? detected : [ECOSYSTEMS.UNKNOWN];
}

module.exports = {
  ECOSYSTEMS,
  Ecosystem,
  NodejsEcosystem,
  JvmEcosystem,
  PythonEcosystem,
  RustEcosystem,
  UnknownEcosystem,
  getEcosystem,
  detectEcosystem,
  detectMultipleEcosystems
};
