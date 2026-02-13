/**
 * Rust Ecosystem Module
 * Handles Rust projects with Cargo
 */

const { Ecosystem } = require('./types.cjs');

/**
 * Rust Ecosystem implementation
 */
class RustEcosystem extends Ecosystem {
  constructor(config = {}) {
    super('rust', config);
  }

  getConstantKey() {
    return 'RUST';
  }

  getDetectionPriority() {
    return 10;
  }

  getName() {
    return 'Rust';
  }

  getIndicators() {
    return [
      'Cargo.toml',
      'Cargo.lock'
    ];
  }

  getFileExtensions() {
    return ['.rs'];
  }

  getTools() {
    return {
      runtime: ['rustc'],
      packageManagers: ['cargo']
    };
  }

  getVersionCommands() {
    return {
      cargo: 'cargo --version',
      rustc: 'rustc --version'
    };
  }

  getInstallationHelp() {
    return {
      cargo: {
        win32: 'Install Rust (includes cargo) from https://rustup.rs:\n  Download and run rustup-init.exe\n\nOr use the /setup-ecosystem command for guided setup.',
        darwin: 'Install Rust (includes cargo) using rustup:\n  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh\n\nOr use the /setup-ecosystem command for guided setup.',
        linux: 'Install Rust (includes cargo) using rustup:\n  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh\n\nOr use the /setup-ecosystem command for guided setup.'
      }
    };
  }

  getSetupToolCategories() {
    return {
      critical: ['rustc', 'cargo'],
      packageManagers: ['cargo'],
      recommended: ['cargo']
    };
  }

  getDebugPatterns() {
    return [];
  }

  getPackageManagerCommands() {
    return {
      cargo: {
        install: 'cargo install',
        add: 'cargo add',
        remove: 'cargo remove',
        build: 'cargo build',
        test: 'cargo test',
        run: 'cargo run',
        check: 'cargo check',
        update: 'cargo update',
        doc: 'cargo doc'
      }
    };
  }

  // --- Config-aware command generation ---

  getInstallCommand(config) {
    return 'cargo fetch';
  }

  getRunCommand(script, config) {
    return `cargo run --bin ${script}`;
  }

  getBuildCommand(config) {
    return 'cargo build';
  }

  getTestCommand(config) {
    return 'cargo test';
  }

  getFormatCommand(config) {
    return 'cargo fmt';
  }

  getLintCommand(config) {
    return 'cargo clippy';
  }
}

module.exports = {
  RustEcosystem
};
