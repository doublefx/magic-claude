/**
 * Tests for scripts/lib/ecosystems/ modules
 * Ecosystem registry, auto-discovery, and ecosystem-specific modules (Node.js, JVM, Python, Rust)
 *
 * Run with: node tests/lib/ecosystems.test.cjs
 */

const assert = require('assert');
const path = require('path');

// Test helper
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

// Try to import the modules (will fail in RED phase)
let Ecosystem, getEcosystem, detectEcosystem, ECOSYSTEMS;
let getRegistry, getEcosystemDirs, getEcosystemsByPriority;
let getAllDebugPatterns, getAllProjectSubTypes, getAllSetupToolCategories;
let getAllEcosystemTools, getAllVersionCommands, getAllInstallationHelp;
let getAllFileFormatters;
let moduleLoaded = false;

try {
  const ecosystemModule = require('../../plugin/scripts/lib/ecosystems/index.cjs');
  Ecosystem = ecosystemModule.Ecosystem;
  getEcosystem = ecosystemModule.getEcosystem;
  detectEcosystem = ecosystemModule.detectEcosystem;
  ECOSYSTEMS = ecosystemModule.ECOSYSTEMS;
  getRegistry = ecosystemModule.getRegistry;
  getEcosystemDirs = ecosystemModule.getEcosystemDirs;
  getEcosystemsByPriority = ecosystemModule.getEcosystemsByPriority;
  getAllDebugPatterns = ecosystemModule.getAllDebugPatterns;
  getAllProjectSubTypes = ecosystemModule.getAllProjectSubTypes;
  getAllSetupToolCategories = ecosystemModule.getAllSetupToolCategories;
  getAllEcosystemTools = ecosystemModule.getAllEcosystemTools;
  getAllVersionCommands = ecosystemModule.getAllVersionCommands;
  getAllInstallationHelp = ecosystemModule.getAllInstallationHelp;
  getAllFileFormatters = ecosystemModule.getAllFileFormatters;
  moduleLoaded = true;
} catch (error) {
  console.log('\n⚠️  Module not found (expected in TDD RED phase)');
  console.log(`   Error: ${error.message}\n`);

  // Create stubs for initial test run
  ECOSYSTEMS = {
    NODEJS: 'nodejs',
    JVM: 'jvm',
    PYTHON: 'python',
    RUST: 'rust',
    UNKNOWN: 'unknown'
  };

  class Ecosystem {
    constructor(type, config = {}) {
      this.type = type;
      this.config = config;
    }
    getType() { return this.type; }
    getConstantKey() { return this.type.toUpperCase(); }
    getDetectionPriority() { return 50; }
    getName() { return 'Node.js'; }
    getIndicators() { return []; }
    getFileExtensions() { return []; }
    getPackageManagerCommands() { return {}; }
    getTools() { return {}; }
    getVersionCommands() { return {}; }
    getInstallationHelp() { return {}; }
    getSetupToolCategories() { return {}; }
    getDebugPatterns() { return []; }
    getProjectSubTypes() { return {}; }
    getBuildCommand() { return null; }
    getTestCommand() { return null; }
    getFormatCommand() { return null; }
    getLintCommand() { return null; }
    getInstallCommand() { return null; }
    getRunCommand() { return null; }
  }

  getEcosystem = (type) => new Ecosystem(type);
  detectEcosystem = (dir) => ECOSYSTEMS.NODEJS;
  getRegistry = () => ({});
  getEcosystemDirs = () => [];
  getEcosystemsByPriority = () => [];
  getAllDebugPatterns = () => [];
  getAllProjectSubTypes = () => ({});
  getAllSetupToolCategories = () => ({});
  getAllEcosystemTools = () => ({});
  getAllVersionCommands = () => ({});
  getAllInstallationHelp = () => ({});
  getAllFileFormatters = () => [];
}

// Test suite
function runTests() {
  console.log('\n=== Testing Ecosystem Modules ===\n');

  const results = {
    passed: 0,
    failed: 0
  };

  // ECOSYSTEMS Constants
  console.log('ECOSYSTEMS Constants:');

  results[test('should have all ecosystem types defined', () => {
    assert.ok(ECOSYSTEMS.NODEJS);
    assert.ok(ECOSYSTEMS.JVM);
    assert.ok(ECOSYSTEMS.PYTHON);
    assert.ok(ECOSYSTEMS.RUST);
    assert.ok(ECOSYSTEMS.UNKNOWN);
  }) ? 'passed' : 'failed']++;

  results[test('should use lowercase ecosystem names', () => {
    assert.strictEqual(ECOSYSTEMS.NODEJS, 'nodejs');
    assert.strictEqual(ECOSYSTEMS.JVM, 'jvm');
    assert.strictEqual(ECOSYSTEMS.PYTHON, 'python');
    assert.strictEqual(ECOSYSTEMS.RUST, 'rust');
    assert.strictEqual(ECOSYSTEMS.UNKNOWN, 'unknown');
  }) ? 'passed' : 'failed']++;

  results[test('ECOSYSTEMS should be frozen after auto-discovery', () => {
    if (!moduleLoaded) return; // Skip in stub mode
    assert.ok(Object.isFrozen(ECOSYSTEMS), 'ECOSYSTEMS should be frozen');
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Auto-Discovery Registry
  console.log('Auto-Discovery Registry:');

  results[test('registry should contain all four ecosystems plus unknown', () => {
    const registry = getRegistry();
    assert.ok(registry['nodejs'], 'nodejs should be in registry');
    assert.ok(registry['jvm'], 'jvm should be in registry');
    assert.ok(registry['python'], 'python should be in registry');
    assert.ok(registry['rust'], 'rust should be in registry');
    assert.ok(registry['unknown'], 'unknown should be in registry');
  }) ? 'passed' : 'failed']++;

  results[test('getEcosystemDirs should include plugin-level directory', () => {
    const dirs = getEcosystemDirs();
    assert.ok(Array.isArray(dirs));
    assert.ok(dirs.length >= 1, 'should have at least the plugin directory');
  }) ? 'passed' : 'failed']++;

  results[test('getEcosystemsByPriority should return sorted instances', () => {
    const sorted = getEcosystemsByPriority();
    assert.ok(Array.isArray(sorted));
    // Verify sorted by priority (lower first)
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(
        sorted[i].getDetectionPriority() >= sorted[i - 1].getDetectionPriority(),
        `Priority should be ascending: ${sorted[i - 1].getType()}=${sorted[i - 1].getDetectionPriority()} <= ${sorted[i].getType()}=${sorted[i].getDetectionPriority()}`
      );
    }
  }) ? 'passed' : 'failed']++;

  results[test('getEcosystemsByPriority should exclude unknown', () => {
    const sorted = getEcosystemsByPriority();
    const types = sorted.map(e => e.getType());
    assert.ok(!types.includes('unknown'), 'unknown should not be in priority list');
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Ecosystem Class
  console.log('Ecosystem Class:');

  results[test('should create ecosystem instance', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    assert.ok(eco);
    assert.strictEqual(eco.type, ECOSYSTEMS.NODEJS);
  }) ? 'passed' : 'failed']++;

  results[test('should return ecosystem type', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    assert.strictEqual(eco.getType(), ECOSYSTEMS.NODEJS);
  }) ? 'passed' : 'failed']++;

  results[test('should return human-readable name', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const name = eco.getName();
    assert.strictEqual(typeof name, 'string');
    assert.ok(name.length > 0);
  }) ? 'passed' : 'failed']++;

  results[test('should return file indicators', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const indicators = eco.getIndicators();
    assert.ok(Array.isArray(indicators));
  }) ? 'passed' : 'failed']++;

  results[test('should return package manager commands', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const commands = eco.getPackageManagerCommands();
    assert.strictEqual(typeof commands, 'object');
  }) ? 'passed' : 'failed']++;

  results[test('should return build command', () => {
    const eco = getEcosystem(ECOSYSTEMS.JVM);
    const command = eco.getBuildCommand();
    assert.ok(command === null || typeof command === 'string');
  }) ? 'passed' : 'failed']++;

  results[test('should return test command', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const command = eco.getTestCommand();
    assert.ok(command === null || typeof command === 'string');
  }) ? 'passed' : 'failed']++;

  console.log('');

  // New Self-Describing Methods
  console.log('Self-Describing Methods:');

  results[test('getConstantKey should return uppercase type', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    assert.strictEqual(eco.getConstantKey(), 'NODEJS');
    const jvm = getEcosystem(ECOSYSTEMS.JVM);
    assert.strictEqual(jvm.getConstantKey(), 'JVM');
  }) ? 'passed' : 'failed']++;

  results[test('getDetectionPriority should return a number', () => {
    const eco = getEcosystem(ECOSYSTEMS.RUST);
    const priority = eco.getDetectionPriority();
    assert.strictEqual(typeof priority, 'number');
    assert.ok(priority > 0);
  }) ? 'passed' : 'failed']++;

  results[test('detection priority order should be rust < jvm < python < nodejs', () => {
    const rust = getEcosystem(ECOSYSTEMS.RUST).getDetectionPriority();
    const jvm = getEcosystem(ECOSYSTEMS.JVM).getDetectionPriority();
    const python = getEcosystem(ECOSYSTEMS.PYTHON).getDetectionPriority();
    const nodejs = getEcosystem(ECOSYSTEMS.NODEJS).getDetectionPriority();
    assert.ok(rust < jvm, `rust (${rust}) < jvm (${jvm})`);
    assert.ok(jvm < python, `jvm (${jvm}) < python (${python})`);
    assert.ok(python < nodejs, `python (${python}) < nodejs (${nodejs})`);
  }) ? 'passed' : 'failed']++;

  results[test('getFileExtensions should return array of strings', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const exts = eco.getFileExtensions();
    assert.ok(Array.isArray(exts));
    assert.ok(exts.length > 0);
    assert.ok(exts.includes('.js') || exts.includes('.ts'));
  }) ? 'passed' : 'failed']++;

  results[test('getTools should return tool definitions', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const tools = eco.getTools();
    assert.ok(tools.runtime || tools.packageManagers || tools.buildTools);
  }) ? 'passed' : 'failed']++;

  results[test('getVersionCommands should return tool-to-command map', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const cmds = eco.getVersionCommands();
    assert.ok(cmds.node, 'should have node version command');
    assert.strictEqual(typeof cmds.node, 'string');
  }) ? 'passed' : 'failed']++;

  results[test('getInstallationHelp should return platform-specific help', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const help = eco.getInstallationHelp();
    assert.ok(help.node, 'should have node installation help');
    assert.ok(help.node.linux, 'should have linux instructions');
  }) ? 'passed' : 'failed']++;

  results[test('getSetupToolCategories should return categories', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const cats = eco.getSetupToolCategories();
    assert.ok(cats.critical, 'should have critical tools');
    assert.ok(Array.isArray(cats.critical));
  }) ? 'passed' : 'failed']++;

  results[test('getDebugPatterns should return pattern objects', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const patterns = eco.getDebugPatterns();
    assert.ok(Array.isArray(patterns));
    assert.ok(patterns.length > 0, 'nodejs should have at least one debug pattern');
    assert.ok(patterns[0].extensions instanceof RegExp);
    assert.ok(patterns[0].pattern instanceof RegExp);
    assert.strictEqual(typeof patterns[0].name, 'string');
    assert.strictEqual(typeof patterns[0].message, 'string');
  }) ? 'passed' : 'failed']++;

  results[test('getProjectSubTypes should return subtypes with indicators', () => {
    const jvm = getEcosystem(ECOSYSTEMS.JVM);
    const subTypes = jvm.getProjectSubTypes();
    assert.ok(subTypes.maven, 'JVM should have maven sub-type');
    assert.ok(subTypes.gradle, 'JVM should have gradle sub-type');
    assert.ok(Array.isArray(subTypes.maven));
    assert.ok(subTypes.maven.includes('pom.xml'));
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Config-Aware Command Generation
  console.log('Config-Aware Commands:');

  results[test('nodejs getInstallCommand respects packageManager config', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    assert.strictEqual(eco.getInstallCommand({ packageManager: 'pnpm' }), 'pnpm install');
    assert.strictEqual(eco.getInstallCommand({ packageManager: 'yarn' }), 'yarn install');
    assert.strictEqual(eco.getInstallCommand({ packageManager: 'npm' }), 'npm install');
  }) ? 'passed' : 'failed']++;

  results[test('jvm getInstallCommand respects buildTool and platform', () => {
    const eco = getEcosystem(ECOSYSTEMS.JVM);
    assert.strictEqual(eco.getInstallCommand({ buildTool: 'gradle', useWrapper: true, platform: 'linux' }), './gradlew build');
    assert.strictEqual(eco.getInstallCommand({ buildTool: 'gradle', useWrapper: true, platform: 'win32' }), 'gradlew.bat build');
    assert.strictEqual(eco.getInstallCommand({ buildTool: 'maven', useWrapper: true, platform: 'linux' }), './mvnw install');
  }) ? 'passed' : 'failed']++;

  results[test('python getTestCommand respects packageManager', () => {
    const eco = getEcosystem(ECOSYSTEMS.PYTHON);
    assert.strictEqual(eco.getTestCommand({ packageManager: 'poetry' }), 'poetry run pytest');
    assert.strictEqual(eco.getTestCommand({ packageManager: 'pip' }), 'pytest');
  }) ? 'passed' : 'failed']++;

  results[test('rust commands are simple and config-independent', () => {
    const eco = getEcosystem(ECOSYSTEMS.RUST);
    assert.strictEqual(eco.getInstallCommand(), 'cargo fetch');
    assert.strictEqual(eco.getBuildCommand(), 'cargo build');
    assert.strictEqual(eco.getTestCommand(), 'cargo test');
    assert.strictEqual(eco.getFormatCommand(), 'cargo fmt');
    assert.strictEqual(eco.getLintCommand(), 'cargo clippy');
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Aggregation Functions
  console.log('Aggregation Functions:');

  results[test('getAllDebugPatterns should aggregate from all ecosystems', () => {
    const patterns = getAllDebugPatterns();
    assert.ok(Array.isArray(patterns));
    // Should have at least nodejs (console.log), python (print), jvm (System.out)
    assert.ok(patterns.length >= 3, `Expected at least 3 patterns, got ${patterns.length}`);
  }) ? 'passed' : 'failed']++;

  results[test('getAllProjectSubTypes should include maven and gradle', () => {
    const subTypes = getAllProjectSubTypes();
    assert.ok(subTypes.maven, 'should have maven');
    assert.ok(subTypes.gradle, 'should have gradle');
    assert.ok(subTypes.nodejs || subTypes.rust, 'should have at least one non-JVM type');
  }) ? 'passed' : 'failed']++;

  results[test('getAllSetupToolCategories should have entries for all ecosystems', () => {
    const cats = getAllSetupToolCategories();
    assert.ok(cats.nodejs, 'should have nodejs');
    assert.ok(cats.jvm, 'should have jvm');
    assert.ok(cats.python, 'should have python');
    assert.ok(cats.rust, 'should have rust');
  }) ? 'passed' : 'failed']++;

  results[test('getAllEcosystemTools should have entries for all ecosystems', () => {
    const tools = getAllEcosystemTools();
    assert.ok(tools.nodejs, 'should have nodejs tools');
    assert.ok(tools.nodejs.runtime, 'nodejs should have runtime');
    assert.ok(tools.jvm.buildTools, 'jvm should have build tools');
  }) ? 'passed' : 'failed']++;

  results[test('getAllVersionCommands should aggregate all tool commands', () => {
    const cmds = getAllVersionCommands();
    assert.ok(cmds.node, 'should have node');
    assert.ok(cmds.java, 'should have java');
    assert.ok(cmds.python, 'should have python');
    assert.ok(cmds.cargo, 'should have cargo');
  }) ? 'passed' : 'failed']++;

  results[test('getAllInstallationHelp should aggregate all tool help', () => {
    const help = getAllInstallationHelp();
    assert.ok(help.node, 'should have node');
    assert.ok(help.java, 'should have java');
    assert.ok(help.python, 'should have python');
    assert.ok(help.cargo, 'should have cargo');
  }) ? 'passed' : 'failed']++;

  results[test('getAllFileFormatters should aggregate formatters from all ecosystems', () => {
    const formatters = getAllFileFormatters();
    assert.ok(Array.isArray(formatters));
    // Should have formatters for at least python (.py), java (.java), kotlin (.kt), typescript (.ts), rust (.rs)
    assert.ok(formatters.length >= 4, `Expected at least 4 formatters, got ${formatters.length}`);
    // Each should have ecosystem field added by aggregation
    for (const fmt of formatters) {
      assert.ok(fmt.ecosystem, 'formatter should have ecosystem field');
      assert.ok(Array.isArray(fmt.extensions), 'should have extensions array');
      assert.strictEqual(typeof fmt.tool, 'string', 'tool should be a string');
      assert.strictEqual(typeof fmt.args, 'function', 'args should be a function');
    }
  }) ? 'passed' : 'failed']++;

  console.log('');

  // File Formatter Methods
  console.log('File Formatter Methods:');

  results[test('nodejs getFileFormatters should define prettier for JS/TS', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const formatters = eco.getFileFormatters();
    assert.ok(Array.isArray(formatters));
    assert.ok(formatters.length >= 1);
    const prettierFmt = formatters.find(f => f.tool === 'prettier');
    assert.ok(prettierFmt, 'should have prettier formatter');
    assert.ok(prettierFmt.extensions.includes('.ts'));
    assert.ok(prettierFmt.extensions.includes('.js'));
    assert.ok(prettierFmt.command === 'npx', 'should use npx to run prettier');
    const args = prettierFmt.args('/test/file.ts');
    assert.ok(Array.isArray(args));
    assert.ok(args.includes('/test/file.ts'));
  }) ? 'passed' : 'failed']++;

  results[test('jvm getFileFormatters should define java and kotlin formatters', () => {
    const eco = getEcosystem(ECOSYSTEMS.JVM);
    const formatters = eco.getFileFormatters();
    assert.ok(formatters.length >= 2, 'should have at least java + kotlin formatters');
    const javaFmt = formatters.find(f => f.extensions.includes('.java'));
    assert.ok(javaFmt, 'should have .java formatter');
    assert.strictEqual(javaFmt.tool, 'google-java-format');
    const ktFmt = formatters.find(f => f.extensions.includes('.kt'));
    assert.ok(ktFmt, 'should have .kt formatter');
  }) ? 'passed' : 'failed']++;

  results[test('jvm should have ktfmt and ktlint as ordered fallbacks for kotlin', () => {
    const eco = getEcosystem(ECOSYSTEMS.JVM);
    const formatters = eco.getFileFormatters();
    const ktFormatters = formatters.filter(f => f.extensions.includes('.kt'));
    assert.ok(ktFormatters.length >= 2, 'should have at least 2 kotlin formatters (ktfmt + ktlint)');
    assert.strictEqual(ktFormatters[0].tool, 'ktfmt', 'ktfmt should come first');
    assert.strictEqual(ktFormatters[1].tool, 'ktlint', 'ktlint should be fallback');
  }) ? 'passed' : 'failed']++;

  results[test('python getFileFormatters should define ruff for .py', () => {
    const eco = getEcosystem(ECOSYSTEMS.PYTHON);
    const formatters = eco.getFileFormatters();
    assert.ok(formatters.length >= 1);
    const ruffFmt = formatters.find(f => f.tool === 'ruff');
    assert.ok(ruffFmt, 'should have ruff formatter');
    assert.ok(ruffFmt.extensions.includes('.py'));
    const args = ruffFmt.args('/test/file.py');
    assert.deepStrictEqual(args, ['format', '/test/file.py']);
  }) ? 'passed' : 'failed']++;

  results[test('rust getFileFormatters should define rustfmt for .rs', () => {
    const eco = getEcosystem(ECOSYSTEMS.RUST);
    const formatters = eco.getFileFormatters();
    assert.ok(formatters.length >= 1);
    const rustFmt = formatters.find(f => f.tool === 'rustfmt');
    assert.ok(rustFmt, 'should have rustfmt formatter');
    assert.ok(rustFmt.extensions.includes('.rs'));
  }) ? 'passed' : 'failed']++;

  results[test('formatter args functions should return file path in args', () => {
    const formatters = getAllFileFormatters();
    for (const fmt of formatters) {
      const args = fmt.args('/some/test/file.ext');
      assert.ok(Array.isArray(args), `${fmt.tool} args should return array`);
      assert.ok(args.includes('/some/test/file.ext'), `${fmt.tool} args should include file path`);
    }
  }) ? 'passed' : 'failed']++;

  console.log('');

  // getEcosystem Factory
  console.log('getEcosystem Factory:');

  results[test('should return nodejs ecosystem', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    assert.ok(eco);
    assert.strictEqual(eco.getType(), ECOSYSTEMS.NODEJS);
  }) ? 'passed' : 'failed']++;

  results[test('should return jvm ecosystem', () => {
    const eco = getEcosystem(ECOSYSTEMS.JVM);
    assert.ok(eco);
    assert.strictEqual(eco.getType(), ECOSYSTEMS.JVM);
  }) ? 'passed' : 'failed']++;

  results[test('should return python ecosystem', () => {
    const eco = getEcosystem(ECOSYSTEMS.PYTHON);
    assert.ok(eco);
    assert.strictEqual(eco.getType(), ECOSYSTEMS.PYTHON);
  }) ? 'passed' : 'failed']++;

  results[test('should return rust ecosystem', () => {
    const eco = getEcosystem(ECOSYSTEMS.RUST);
    assert.ok(eco);
    assert.strictEqual(eco.getType(), ECOSYSTEMS.RUST);
  }) ? 'passed' : 'failed']++;

  results[test('should handle unknown ecosystem type', () => {
    const eco = getEcosystem('invalid');
    assert.ok(eco);
    assert.strictEqual(eco.getType(), ECOSYSTEMS.UNKNOWN);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // detectEcosystem Function
  console.log('detectEcosystem Function:');

  results[test('should detect ecosystem from directory', () => {
    const type = detectEcosystem(process.cwd());
    assert.strictEqual(typeof type, 'string');
    assert.ok(Object.values(ECOSYSTEMS).includes(type));
  }) ? 'passed' : 'failed']++;

  results[test('should return unknown for non-existent directory', () => {
    const type = detectEcosystem('/nonexistent/path/that/does/not/exist');
    assert.strictEqual(type, ECOSYSTEMS.UNKNOWN);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Node.js Ecosystem Specifics
  console.log('Node.js Ecosystem:');

  results[test('nodejs should have package.json indicator', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const indicators = eco.getIndicators();
    assert.ok(indicators.includes('package.json'));
  }) ? 'passed' : 'failed']++;

  results[test('nodejs should have npm commands', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const commands = eco.getPackageManagerCommands();
    assert.ok(commands.npm || commands.install);
  }) ? 'passed' : 'failed']++;

  results[test('nodejs should have test command', () => {
    const eco = getEcosystem(ECOSYSTEMS.NODEJS);
    const command = eco.getTestCommand();
    assert.ok(command);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // JVM Ecosystem Specifics
  console.log('JVM Ecosystem:');

  results[test('jvm should have pom.xml or build.gradle indicator', () => {
    const eco = getEcosystem(ECOSYSTEMS.JVM);
    const indicators = eco.getIndicators();
    assert.ok(indicators.includes('pom.xml') || indicators.includes('build.gradle'));
  }) ? 'passed' : 'failed']++;

  results[test('jvm should have maven or gradle commands', () => {
    const eco = getEcosystem(ECOSYSTEMS.JVM);
    const commands = eco.getPackageManagerCommands();
    // Should have build and test commands regardless of maven/gradle
    assert.ok(commands.build);
    assert.ok(commands.test);
  }) ? 'passed' : 'failed']++;

  results[test('jvm should have build command', () => {
    const eco = getEcosystem(ECOSYSTEMS.JVM);
    const command = eco.getBuildCommand();
    assert.ok(command);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Python Ecosystem Specifics
  console.log('Python Ecosystem:');

  results[test('python should have requirements.txt or pyproject.toml indicator', () => {
    const eco = getEcosystem(ECOSYSTEMS.PYTHON);
    const indicators = eco.getIndicators();
    assert.ok(
      indicators.includes('requirements.txt') ||
      indicators.includes('pyproject.toml')
    );
  }) ? 'passed' : 'failed']++;

  results[test('python should have pip or poetry commands', () => {
    const eco = getEcosystem(ECOSYSTEMS.PYTHON);
    const commands = eco.getPackageManagerCommands();
    // Should have install and test commands regardless of pip/poetry
    assert.ok(commands.install);
    assert.ok(commands.test);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Rust Ecosystem Specifics
  console.log('Rust Ecosystem:');

  results[test('rust should have Cargo.toml indicator', () => {
    const eco = getEcosystem(ECOSYSTEMS.RUST);
    const indicators = eco.getIndicators();
    assert.ok(indicators.includes('Cargo.toml'));
  }) ? 'passed' : 'failed']++;

  results[test('rust should have cargo commands', () => {
    const eco = getEcosystem(ECOSYSTEMS.RUST);
    const commands = eco.getPackageManagerCommands();
    assert.ok(commands.cargo || commands.build);
  }) ? 'passed' : 'failed']++;

  results[test('rust should have no debug patterns', () => {
    const eco = getEcosystem(ECOSYSTEMS.RUST);
    const patterns = eco.getDebugPatterns();
    assert.ok(Array.isArray(patterns));
    assert.strictEqual(patterns.length, 0);
  }) ? 'passed' : 'failed']++;

  console.log('');

  // Summary
  console.log('=== Summary ===');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('');

  if (!moduleLoaded) {
    console.log('⚠️  TDD RED PHASE: Module not implemented yet');
    console.log('   Next step: Implement scripts/lib/ecosystems/');
    console.log('');
  }

  return results.failed === 0;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
