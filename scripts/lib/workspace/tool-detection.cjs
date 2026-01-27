/**
 * Tool Detection - Cross-platform tool availability checking
 * Detects if development tools are installed and provides installation guidance
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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
    const versionCommands = {
      node: 'node --version',
      npm: 'npm --version',
      pnpm: 'pnpm --version',
      yarn: 'yarn --version',
      bun: 'bun --version',
      java: 'java -version',
      javac: 'javac -version',
      mvn: 'mvn --version',
      gradle: 'gradle --version',
      python: 'python --version',
      python3: 'python3 --version',
      pip: 'pip --version',
      pip3: 'pip3 --version',
      poetry: 'poetry --version',
      uv: 'uv --version',
      cargo: 'cargo --version',
      rustc: 'rustc --version'
    };

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
 * Ecosystem tool definitions
 * Maps ecosystem names to required tools
 */
const ECOSYSTEM_TOOLS = {
  nodejs: {
    runtime: ['node'],
    packageManagers: ['npm', 'pnpm', 'yarn', 'bun']
  },
  jvm: {
    runtime: ['java', 'javac'],
    buildTools: ['mvn', 'gradle']
  },
  python: {
    runtime: ['python', 'python3'],
    packageManagers: ['pip', 'pip3', 'poetry', 'uv']
  },
  rust: {
    runtime: ['rustc'],
    packageManagers: ['cargo']
  }
};

/**
 * Check tools for a specific ecosystem
 * @param {string} ecosystem - Ecosystem name (nodejs, jvm, python, rust)
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
 * Platform-specific installation instructions
 */
const INSTALLATION_HELP = {
  node: {
    win32: 'Install Node.js from https://nodejs.org or use winget:\n  winget install OpenJS.NodeJS\n\nOr use the /setup-ecosystem command for guided setup.',
    darwin: 'Install Node.js using Homebrew:\n  brew install node\n\nOr download from https://nodejs.org\n\nOr use the /setup-ecosystem command for guided setup.',
    linux: 'Install Node.js using your package manager:\n  Ubuntu/Debian: sudo apt-get install nodejs npm\n  Fedora: sudo dnf install nodejs npm\n  Arch: sudo pacman -S nodejs npm\n\nOr use NVM: https://github.com/nvm-sh/nvm\n\nOr use the /setup-ecosystem command for guided setup.'
  },
  npm: {
    win32: 'npm is included with Node.js. Install Node.js first.\nSee: node installation help',
    darwin: 'npm is included with Node.js. Install Node.js first.\nSee: node installation help',
    linux: 'npm is included with Node.js. Install Node.js first.\nSee: node installation help'
  },
  pnpm: {
    win32: 'Install pnpm using npm:\n  npm install -g pnpm\n\nOr use standalone installer:\n  iwr https://get.pnpm.io/install.ps1 -useb | iex',
    darwin: 'Install pnpm using npm:\n  npm install -g pnpm\n\nOr using Homebrew:\n  brew install pnpm',
    linux: 'Install pnpm using npm:\n  npm install -g pnpm\n\nOr using standalone script:\n  curl -fsSL https://get.pnpm.io/install.sh | sh -'
  },
  yarn: {
    win32: 'Install Yarn using npm:\n  npm install -g yarn',
    darwin: 'Install Yarn using npm:\n  npm install -g yarn\n\nOr using Homebrew:\n  brew install yarn',
    linux: 'Install Yarn using npm:\n  npm install -g yarn'
  },
  bun: {
    win32: 'Install Bun using npm:\n  npm install -g bun\n\nOr use installer:\n  powershell -c "irm bun.sh/install.ps1 | iex"',
    darwin: 'Install Bun using installer:\n  curl -fsSL https://bun.sh/install | bash',
    linux: 'Install Bun using installer:\n  curl -fsSL https://bun.sh/install | bash'
  },
  java: {
    win32: 'Install Java using winget:\n  winget install EclipseAdoptium.Temurin.11.JDK\n\nOr download from https://adoptium.net\n\nOr use the /setup-ecosystem command for guided setup.',
    darwin: 'Install Java using Homebrew:\n  brew install openjdk@11\n\nOr download from https://adoptium.net\n\nOr use the /setup-ecosystem command for guided setup.',
    linux: 'Install Java using your package manager:\n  Ubuntu/Debian: sudo apt-get install openjdk-11-jdk\n  Fedora: sudo dnf install java-11-openjdk-devel\n  Arch: sudo pacman -S jdk11-openjdk\n\nOr use SDKMAN: https://sdkman.io\n\nOr use the /setup-ecosystem command for guided setup.'
  },
  mvn: {
    win32: 'Install Maven using winget:\n  winget install Apache.Maven\n\nOr download from https://maven.apache.org',
    darwin: 'Install Maven using Homebrew:\n  brew install maven',
    linux: 'Install Maven using your package manager:\n  Ubuntu/Debian: sudo apt-get install maven\n  Fedora: sudo dnf install maven\n  Arch: sudo pacman -S maven\n\nOr use SDKMAN: sdk install maven'
  },
  gradle: {
    win32: 'Install Gradle using winget:\n  winget install Gradle.Gradle\n\nOr download from https://gradle.org',
    darwin: 'Install Gradle using Homebrew:\n  brew install gradle',
    linux: 'Install Gradle using your package manager:\n  Ubuntu/Debian: sudo apt-get install gradle\n  Fedora: sudo dnf install gradle\n  Arch: sudo pacman -S gradle\n\nOr use SDKMAN: sdk install gradle'
  },
  python: {
    win32: 'Install Python from https://python.org or use winget:\n  winget install Python.Python.3.11\n\nOr use the /setup-ecosystem command for guided setup.',
    darwin: 'Install Python using Homebrew:\n  brew install python@3.11\n\nOr download from https://python.org\n\nOr use the /setup-ecosystem command for guided setup.',
    linux: 'Python is usually pre-installed. To install specific version:\n  Ubuntu/Debian: sudo apt-get install python3.11\n  Fedora: sudo dnf install python3.11\n  Arch: sudo pacman -S python\n\nOr use pyenv: https://github.com/pyenv/pyenv\n\nOr use the /setup-ecosystem command for guided setup.'
  },
  pip: {
    win32: 'pip is included with Python. Install Python first.\nSee: python installation help',
    darwin: 'pip is included with Python. Install Python first.\nSee: python installation help',
    linux: 'pip is included with Python. Install Python first.\nSee: python installation help'
  },
  poetry: {
    win32: 'Install Poetry using pip:\n  pip install poetry\n\nOr use installer:\n  (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -',
    darwin: 'Install Poetry using installer:\n  curl -sSL https://install.python-poetry.org | python3 -',
    linux: 'Install Poetry using installer:\n  curl -sSL https://install.python-poetry.org | python3 -'
  },
  cargo: {
    win32: 'Install Rust (includes cargo) from https://rustup.rs:\n  Download and run rustup-init.exe\n\nOr use the /setup-ecosystem command for guided setup.',
    darwin: 'Install Rust (includes cargo) using rustup:\n  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh\n\nOr use the /setup-ecosystem command for guided setup.',
    linux: 'Install Rust (includes cargo) using rustup:\n  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh\n\nOr use the /setup-ecosystem command for guided setup.'
  }
};

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
