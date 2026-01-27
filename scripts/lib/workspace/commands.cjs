/**
 * Workspace Commands - Command generation for all ecosystems
 * Generates platform-specific commands for package managers and build tools
 */

const path = require('path');
const fs = require('fs');

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
   * Generate install/dependency command
   * @returns {string}
   */
  install() {
    switch (this.ecosystem) {
      case 'nodejs':
        return this._nodejsInstall();
      case 'jvm':
        return this._jvmInstall();
      case 'python':
        return this._pythonInstall();
      case 'rust':
        return this._rustInstall();
      default:
        return 'echo "Unknown ecosystem"';
    }
  }

  /**
   * Generate test command
   * @returns {string}
   */
  test() {
    switch (this.ecosystem) {
      case 'nodejs':
        return this._nodejsTest();
      case 'jvm':
        return this._jvmTest();
      case 'python':
        return this._pythonTest();
      case 'rust':
        return this._rustTest();
      default:
        return 'echo "Unknown ecosystem"';
    }
  }

  /**
   * Generate build command
   * @returns {string}
   */
  build() {
    switch (this.ecosystem) {
      case 'nodejs':
        return this._nodejsBuild();
      case 'jvm':
        return this._jvmBuild();
      case 'python':
        return this._pythonBuild();
      case 'rust':
        return this._rustBuild();
      default:
        return 'echo "Unknown ecosystem"';
    }
  }

  /**
   * Generate run command with script name
   * @param {string} script - Script name to run
   * @returns {string}
   */
  run(script) {
    switch (this.ecosystem) {
      case 'nodejs':
        return this._nodejsRun(script);
      case 'jvm':
        return this._jvmRun(script);
      case 'python':
        return this._pythonRun(script);
      case 'rust':
        return this._rustRun(script);
      default:
        return 'echo "Unknown ecosystem"';
    }
  }

  /**
   * Generate format command
   * @returns {string}
   */
  format() {
    switch (this.ecosystem) {
      case 'nodejs':
        return this._nodejsFormat();
      case 'jvm':
        return this._jvmFormat();
      case 'python':
        return this._pythonFormat();
      case 'rust':
        return this._rustFormat();
      default:
        return 'echo "Unknown ecosystem"';
    }
  }

  /**
   * Generate lint command
   * @returns {string}
   */
  lint() {
    switch (this.ecosystem) {
      case 'nodejs':
        return this._nodejsLint();
      case 'jvm':
        return this._jvmLint();
      case 'python':
        return this._pythonLint();
      case 'rust':
        return this._rustLint();
      default:
        return 'echo "Unknown ecosystem"';
    }
  }

  // Node.js commands
  _nodejsInstall() {
    const pm = this.config.packageManager || 'npm';
    switch (pm) {
      case 'pnpm':
        return 'pnpm install';
      case 'yarn':
        return 'yarn install';
      case 'bun':
        return 'bun install';
      default:
        return 'npm install';
    }
  }

  _nodejsTest() {
    const pm = this.config.packageManager || 'npm';
    switch (pm) {
      case 'pnpm':
        return 'pnpm test';
      case 'yarn':
        return 'yarn test';
      case 'bun':
        return 'bun test';
      default:
        return 'npm test';
    }
  }

  _nodejsBuild() {
    const pm = this.config.packageManager || 'npm';
    switch (pm) {
      case 'pnpm':
        return 'pnpm build';
      case 'yarn':
        return 'yarn build';
      case 'bun':
        return 'bun run build';
      default:
        return 'npm run build';
    }
  }

  _nodejsRun(script) {
    const pm = this.config.packageManager || 'npm';
    switch (pm) {
      case 'pnpm':
        return `pnpm ${script}`;
      case 'yarn':
        return `yarn ${script}`;
      case 'bun':
        return `bun ${script}`;
      default:
        return `npm run ${script}`;
    }
  }

  _nodejsFormat() {
    const pm = this.config.packageManager || 'npm';
    switch (pm) {
      case 'pnpm':
        return 'pnpm format';
      case 'yarn':
        return 'yarn format';
      case 'bun':
        return 'bun run format';
      default:
        return 'npm run format';
    }
  }

  _nodejsLint() {
    const pm = this.config.packageManager || 'npm';
    switch (pm) {
      case 'pnpm':
        return 'pnpm lint';
      case 'yarn':
        return 'yarn lint';
      case 'bun':
        return 'bun run lint';
      default:
        return 'npm run lint';
    }
  }

  // JVM commands
  _jvmInstall() {
    const buildTool = this.config.buildTool || 'maven';
    const useWrapper = this.config.useWrapper !== false; // Default true

    if (buildTool === 'gradle') {
      if (useWrapper) {
        return this.platform === 'win32' ? 'gradlew.bat build' : './gradlew build';
      }
      return 'gradle build';
    } else {
      // Maven
      if (useWrapper) {
        return this.platform === 'win32' ? 'mvnw.cmd install' : './mvnw install';
      }
      return 'mvn install';
    }
  }

  _jvmTest() {
    const buildTool = this.config.buildTool || 'maven';
    const useWrapper = this.config.useWrapper !== false;

    if (buildTool === 'gradle') {
      if (useWrapper) {
        return this.platform === 'win32' ? 'gradlew.bat test' : './gradlew test';
      }
      return 'gradle test';
    } else {
      if (useWrapper) {
        return this.platform === 'win32' ? 'mvnw.cmd test' : './mvnw test';
      }
      return 'mvn test';
    }
  }

  _jvmBuild() {
    const buildTool = this.config.buildTool || 'maven';
    const useWrapper = this.config.useWrapper !== false;

    if (buildTool === 'gradle') {
      if (useWrapper) {
        return this.platform === 'win32' ? 'gradlew.bat build' : './gradlew build';
      }
      return 'gradle build';
    } else {
      if (useWrapper) {
        return this.platform === 'win32' ? 'mvnw.cmd package' : './mvnw package';
      }
      return 'mvn package';
    }
  }

  _jvmRun(script) {
    const buildTool = this.config.buildTool || 'maven';
    const useWrapper = this.config.useWrapper !== false;

    if (buildTool === 'gradle') {
      if (useWrapper) {
        return this.platform === 'win32' ? `gradlew.bat ${script}` : `./gradlew ${script}`;
      }
      return `gradle ${script}`;
    } else {
      if (useWrapper) {
        return this.platform === 'win32' ? `mvnw.cmd ${script}` : `./mvnw ${script}`;
      }
      return `mvn ${script}`;
    }
  }

  _jvmFormat() {
    const buildTool = this.config.buildTool || 'maven';
    const useWrapper = this.config.useWrapper !== false;

    if (buildTool === 'gradle') {
      if (useWrapper) {
        return this.platform === 'win32' ? 'gradlew.bat spotlessApply' : './gradlew spotlessApply';
      }
      return 'gradle spotlessApply';
    } else {
      if (useWrapper) {
        return this.platform === 'win32' ? 'mvnw.cmd spotless:apply' : './mvnw spotless:apply';
      }
      return 'mvn spotless:apply';
    }
  }

  _jvmLint() {
    const buildTool = this.config.buildTool || 'maven';
    const useWrapper = this.config.useWrapper !== false;

    if (buildTool === 'gradle') {
      if (useWrapper) {
        return this.platform === 'win32' ? 'gradlew.bat check' : './gradlew check';
      }
      return 'gradle check';
    } else {
      if (useWrapper) {
        return this.platform === 'win32' ? 'mvnw.cmd checkstyle:check' : './mvnw checkstyle:check';
      }
      return 'mvn checkstyle:check';
    }
  }

  // Python commands
  _pythonInstall() {
    const pm = this.config.packageManager || 'pip';
    switch (pm) {
      case 'poetry':
        return 'poetry install';
      case 'uv':
        return 'uv pip install -r requirements.txt';
      default:
        return 'pip install -r requirements.txt';
    }
  }

  _pythonTest() {
    const pm = this.config.packageManager || 'pip';
    if (pm === 'poetry') {
      return 'poetry run pytest';
    }
    return 'pytest';
  }

  _pythonBuild() {
    const pm = this.config.packageManager || 'pip';
    if (pm === 'poetry') {
      return 'poetry build';
    }
    return 'python -m build';
  }

  _pythonRun(script) {
    const pm = this.config.packageManager || 'pip';
    if (pm === 'poetry') {
      return `poetry run ${script}`;
    }
    return `python ${script}`;
  }

  _pythonFormat() {
    return 'black .';
  }

  _pythonLint() {
    return 'flake8 .';
  }

  // Rust commands
  _rustInstall() {
    return 'cargo fetch';
  }

  _rustTest() {
    return 'cargo test';
  }

  _rustBuild() {
    return 'cargo build';
  }

  _rustRun(script) {
    return `cargo run --bin ${script}`;
  }

  _rustFormat() {
    return 'cargo fmt';
  }

  _rustLint() {
    return 'cargo clippy';
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
