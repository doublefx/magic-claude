/**
 * Rust Ecosystem Module
 * Handles Rust projects with Cargo
 */

const { Ecosystem, ECOSYSTEMS } = require('./types.cjs');

/**
 * Rust Ecosystem implementation
 */
class RustEcosystem extends Ecosystem {
  constructor(config = {}) {
    super(ECOSYSTEMS.RUST, config);
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

  getBuildCommand() {
    return 'cargo build';
  }

  getTestCommand() {
    return 'cargo test';
  }

  getFormatCommand() {
    return 'cargo fmt';
  }

  getLintCommand() {
    return 'cargo clippy';
  }
}

module.exports = {
  RustEcosystem
};
