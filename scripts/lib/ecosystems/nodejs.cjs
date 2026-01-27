/**
 * Node.js Ecosystem Module
 * Handles Node.js projects with npm, pnpm, yarn, bun
 */

const { Ecosystem, ECOSYSTEMS } = require('./types.cjs');

/**
 * Node.js Ecosystem implementation
 */
class NodejsEcosystem extends Ecosystem {
  constructor(config = {}) {
    super(ECOSYSTEMS.NODEJS, config);
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

  getPackageManagerCommands() {
    // Default to npm, can be overridden via config
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

  getBuildCommand() {
    const commands = this.getPackageManagerCommands();
    return commands.build;
  }

  getTestCommand() {
    const commands = this.getPackageManagerCommands();
    return commands.test;
  }

  getFormatCommand() {
    // Assume prettier is available
    return 'npx prettier --write';
  }

  getLintCommand() {
    // Assume eslint is available
    return 'npx eslint';
  }
}

module.exports = {
  NodejsEcosystem
};
