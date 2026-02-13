/**
 * Node.js Ecosystem Module
 * Handles Node.js projects with npm, pnpm, yarn, bun
 */

const { Ecosystem } = require('./types.cjs');

/**
 * Node.js Ecosystem implementation
 */
class NodejsEcosystem extends Ecosystem {
  constructor(config = {}) {
    super('nodejs', config);
  }

  getConstantKey() {
    return 'NODEJS';
  }

  getDetectionPriority() {
    return 40;
  }

  getName() {
    return 'Node.js';
  }

  getIndicators() {
    return [
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'bun.lockb',
      'node_modules'
    ];
  }

  getFileExtensions() {
    return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
  }

  getTools() {
    return {
      runtime: ['node'],
      packageManagers: ['npm', 'pnpm', 'yarn', 'bun']
    };
  }

  getVersionCommands() {
    return {
      node: 'node --version',
      npm: 'npm --version',
      pnpm: 'pnpm --version',
      yarn: 'yarn --version',
      bun: 'bun --version'
    };
  }

  getInstallationHelp() {
    return {
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
      }
    };
  }

  getSetupToolCategories() {
    return {
      critical: ['node'],
      packageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
      recommended: ['pnpm']
    };
  }

  getDebugPatterns() {
    return [{
      extensions: /\.(ts|tsx|js|jsx)$/,
      pattern: /console\.log/,
      name: 'console.log',
      message: 'Remove console.log before committing'
    }];
  }

  getPackageManagerCommands() {
    const pm = this.config.packageManager || 'npm';

    const commands = {
      npm: {
        install: 'npm install',
        add: 'npm install',
        remove: 'npm uninstall',
        run: 'npm run',
        test: 'npm test',
        build: 'npm run build',
        dev: 'npm run dev',
        exec: 'npx'
      },
      pnpm: {
        install: 'pnpm install',
        add: 'pnpm add',
        remove: 'pnpm remove',
        run: 'pnpm',
        test: 'pnpm test',
        build: 'pnpm build',
        dev: 'pnpm dev',
        exec: 'pnpm dlx'
      },
      yarn: {
        install: 'yarn',
        add: 'yarn add',
        remove: 'yarn remove',
        run: 'yarn',
        test: 'yarn test',
        build: 'yarn build',
        dev: 'yarn dev',
        exec: 'yarn dlx'
      },
      bun: {
        install: 'bun install',
        add: 'bun add',
        remove: 'bun remove',
        run: 'bun run',
        test: 'bun test',
        build: 'bun run build',
        dev: 'bun run dev',
        exec: 'bunx'
      }
    };

    return commands[pm] || commands.npm;
  }

  // --- Config-aware command generation ---

  getInstallCommand(config) {
    const pm = (config && config.packageManager) || this.config.packageManager || 'npm';
    switch (pm) {
      case 'pnpm': return 'pnpm install';
      case 'yarn': return 'yarn install';
      case 'bun': return 'bun install';
      default: return 'npm install';
    }
  }

  getRunCommand(script, config) {
    const pm = (config && config.packageManager) || this.config.packageManager || 'npm';
    switch (pm) {
      case 'pnpm': return `pnpm ${script}`;
      case 'yarn': return `yarn ${script}`;
      case 'bun': return `bun ${script}`;
      default: return `npm run ${script}`;
    }
  }

  getBuildCommand(config) {
    const pm = (config && config.packageManager) || this.config.packageManager || 'npm';
    switch (pm) {
      case 'pnpm': return 'pnpm build';
      case 'yarn': return 'yarn build';
      case 'bun': return 'bun run build';
      default: return 'npm run build';
    }
  }

  getTestCommand(config) {
    const pm = (config && config.packageManager) || this.config.packageManager || 'npm';
    switch (pm) {
      case 'pnpm': return 'pnpm test';
      case 'yarn': return 'yarn test';
      case 'bun': return 'bun test';
      default: return 'npm test';
    }
  }

  getFormatCommand(config) {
    const pm = (config && config.packageManager) || this.config.packageManager || 'npm';
    switch (pm) {
      case 'pnpm': return 'pnpm format';
      case 'yarn': return 'yarn format';
      case 'bun': return 'bun run format';
      default: return 'npm run format';
    }
  }

  getLintCommand(config) {
    const pm = (config && config.packageManager) || this.config.packageManager || 'npm';
    switch (pm) {
      case 'pnpm': return 'pnpm lint';
      case 'yarn': return 'yarn lint';
      case 'bun': return 'bun run lint';
      default: return 'npm run lint';
    }
  }
}

module.exports = {
  NodejsEcosystem
};
