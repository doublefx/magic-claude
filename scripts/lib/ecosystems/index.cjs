/**
 * Ecosystem Registry
 * Multi-level auto-discovery registry for all supported ecosystems.
 *
 * Discovery locations (scanned in order, later levels override earlier):
 *   1. Plugin-level:  ${CLAUDE_PLUGIN_ROOT}/scripts/lib/ecosystems/
 *   2. User-level:    ~/.claude/ecosystems/
 *   3. Project-level: ./.claude/ecosystems/
 *
 * Adding a new ecosystem requires only dropping a single .cjs file into any of
 * these directories. The file must export a class extending Ecosystem.
 */

const fs = require('fs');
const path = require('path');
const { ECOSYSTEMS, Ecosystem } = require('./types.cjs');

/**
 * Unknown/fallback ecosystem
 */
class UnknownEcosystem extends Ecosystem {
  constructor(config) {
    super(ECOSYSTEMS.UNKNOWN, config);
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

// --- Auto-discovery registry ---

const ECOSYSTEM_REGISTRY = {};

// Files that are not ecosystem modules
const SKIP_FILES = new Set(['types.cjs', 'index.cjs']);

/**
 * Get all directories to scan for ecosystem modules.
 * @returns {string[]} Directories in priority order (plugin, user, project)
 */
function getEcosystemDirs() {
  const dirs = [];

  // 1. Plugin-level (base — always present)
  dirs.push(__dirname);

  // 2. User-level (~/.claude/ecosystems/)
  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (home) {
    const userDir = path.join(home, '.claude', 'ecosystems');
    if (fs.existsSync(userDir)) {
      dirs.push(userDir);
    }
  }

  // 3. Project-level (./.claude/ecosystems/) — highest priority
  const projectDir = path.join(process.cwd(), '.claude', 'ecosystems');
  if (fs.existsSync(projectDir)) {
    dirs.push(projectDir);
  }

  return dirs;
}

/**
 * Load and register all ecosystem modules from discovery directories.
 * Later directories override earlier ones (project > user > plugin).
 */
function loadEcosystems() {
  for (const dir of getEcosystemDirs()) {
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch {
      continue;
    }

    files.filter(f => f.endsWith('.cjs') && !SKIP_FILES.has(f))
      .sort()
      .forEach(file => {
        try {
          const mod = require(path.join(dir, file));
          const EcoClass = Object.values(mod).find(
            v => typeof v === 'function' && v.prototype instanceof Ecosystem
          );
          if (EcoClass) {
            const instance = new EcoClass();
            // Later directories override earlier ones (project > user > plugin)
            ECOSYSTEM_REGISTRY[instance.getType()] = EcoClass;
            const key = instance.getConstantKey();
            if (key && key !== 'UNKNOWN') {
              ECOSYSTEMS[key] = instance.getType();
            }
          }
        } catch {
          // Skip files that fail to load
        }
      });
  }

  // Always register the unknown fallback
  ECOSYSTEM_REGISTRY[ECOSYSTEMS.UNKNOWN] = UnknownEcosystem;

  // Freeze to prevent accidental mutation after discovery
  Object.freeze(ECOSYSTEMS);
}

// Run discovery on module load
loadEcosystems();

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
 * Get the full registry map (type -> class)
 * @returns {object}
 */
function getRegistry() {
  return ECOSYSTEM_REGISTRY;
}

/**
 * Get all discovered ecosystem instances sorted by detection priority (lower first).
 * Excludes 'unknown'.
 * @returns {Ecosystem[]}
 */
function getEcosystemsByPriority() {
  return Object.keys(ECOSYSTEM_REGISTRY)
    .filter(type => type !== ECOSYSTEMS.UNKNOWN)
    .map(type => new ECOSYSTEM_REGISTRY[type]())
    .sort((a, b) => a.getDetectionPriority() - b.getDetectionPriority());
}

/**
 * Detect ecosystem from directory by checking for indicator files.
 * Iterates in detection-priority order (lowest number first).
 * @param {string} dir - Directory to check
 * @returns {string} Ecosystem type from ECOSYSTEMS constants
 */
function detectEcosystem(dir) {
  if (!dir || typeof dir !== 'string') {
    return ECOSYSTEMS.UNKNOWN;
  }

  try {
    if (!fs.existsSync(dir)) return ECOSYSTEMS.UNKNOWN;
    const stats = fs.statSync(dir);
    if (!stats.isDirectory()) return ECOSYSTEMS.UNKNOWN;
  } catch {
    return ECOSYSTEMS.UNKNOWN;
  }

  for (const eco of getEcosystemsByPriority()) {
    for (const indicator of eco.getIndicators()) {
      if (fs.existsSync(path.join(dir, indicator))) {
        return eco.getType();
      }
    }
  }

  return ECOSYSTEMS.UNKNOWN;
}

/**
 * Detect multiple ecosystems in a directory.
 * Useful for monorepos with mixed languages.
 * @param {string} dir - Directory to check
 * @returns {string[]} Array of detected ecosystem types
 */
function detectMultipleEcosystems(dir) {
  if (!dir || typeof dir !== 'string') {
    return [];
  }

  try {
    if (!fs.existsSync(dir)) return [];
    const stats = fs.statSync(dir);
    if (!stats.isDirectory()) return [];
  } catch {
    return [];
  }

  const detected = [];

  for (const eco of getEcosystemsByPriority()) {
    for (const indicator of eco.getIndicators()) {
      if (fs.existsSync(path.join(dir, indicator))) {
        if (!detected.includes(eco.getType())) {
          detected.push(eco.getType());
        }
        break;
      }
    }
  }

  return detected.length > 0 ? detected : [ECOSYSTEMS.UNKNOWN];
}

/**
 * Aggregate debug patterns from all discovered ecosystems.
 * @returns {Array<{ extensions: RegExp, pattern: RegExp, name: string, message: string, skipPattern?: RegExp }>}
 */
function getAllDebugPatterns() {
  const patterns = [];
  for (const eco of getEcosystemsByPriority()) {
    patterns.push(...eco.getDebugPatterns());
  }
  return patterns;
}

/**
 * Aggregate project sub-types from all discovered ecosystems.
 * @returns {{ [subtype: string]: string[] }}
 */
function getAllProjectSubTypes() {
  const subTypes = {};
  for (const eco of getEcosystemsByPriority()) {
    Object.assign(subTypes, eco.getProjectSubTypes());
  }
  return subTypes;
}

/**
 * Aggregate setup tool categories from all discovered ecosystems.
 * @returns {{ [ecosystemType: string]: { critical?, packageManagers?, buildTools?, recommended? } }}
 */
function getAllSetupToolCategories() {
  const categories = {};
  for (const eco of getEcosystemsByPriority()) {
    categories[eco.getType()] = eco.getSetupToolCategories();
  }
  return categories;
}

/**
 * Aggregate tool definitions from all discovered ecosystems.
 * @returns {{ [ecosystemType: string]: { runtime?, packageManagers?, buildTools? } }}
 */
function getAllEcosystemTools() {
  const tools = {};
  for (const eco of getEcosystemsByPriority()) {
    tools[eco.getType()] = eco.getTools();
  }
  return tools;
}

/**
 * Aggregate version commands from all discovered ecosystems.
 * @returns {{ [tool: string]: string }}
 */
function getAllVersionCommands() {
  const commands = {};
  for (const eco of getEcosystemsByPriority()) {
    Object.assign(commands, eco.getVersionCommands());
  }
  return commands;
}

/**
 * Aggregate installation help from all discovered ecosystems.
 * @returns {{ [tool: string]: { win32: string, darwin: string, linux: string } }}
 */
function getAllInstallationHelp() {
  const help = {};
  for (const eco of getEcosystemsByPriority()) {
    Object.assign(help, eco.getInstallationHelp());
  }
  return help;
}

/**
 * Aggregate per-file formatter definitions from all discovered ecosystems.
 * Each entry is augmented with an `ecosystem` field for traceability.
 * @returns {Array<{ extensions: string[], tool: string, command?: string, args: (filePath: string) => string[], projectTypes?: string[], ecosystem: string }>}
 */
function getAllFileFormatters() {
  const formatters = [];
  for (const eco of getEcosystemsByPriority()) {
    for (const fmt of eco.getFileFormatters()) {
      formatters.push({ ...fmt, ecosystem: eco.getType() });
    }
  }
  return formatters;
}

// --- Backward-compatible named exports ---
// Derived from registry after loading so they exist even if file names change.

const NodejsEcosystem = ECOSYSTEM_REGISTRY['nodejs'] || UnknownEcosystem;
const JvmEcosystem = ECOSYSTEM_REGISTRY['jvm'] || UnknownEcosystem;
const PythonEcosystem = ECOSYSTEM_REGISTRY['python'] || UnknownEcosystem;
const RustEcosystem = ECOSYSTEM_REGISTRY['rust'] || UnknownEcosystem;

module.exports = {
  ECOSYSTEMS,
  Ecosystem,
  NodejsEcosystem,
  JvmEcosystem,
  PythonEcosystem,
  RustEcosystem,
  UnknownEcosystem,
  getEcosystem,
  getRegistry,
  getEcosystemDirs,
  getEcosystemsByPriority,
  detectEcosystem,
  detectMultipleEcosystems,
  getAllDebugPatterns,
  getAllProjectSubTypes,
  getAllSetupToolCategories,
  getAllEcosystemTools,
  getAllVersionCommands,
  getAllInstallationHelp,
  getAllFileFormatters
};
