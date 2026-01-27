---
description: Detect and install missing development tools for your project's ecosystem (Node.js, Python, Java, Rust)
disable-model-invocation: true
---

# Ecosystem Setup

Automatically detect your project's ecosystem and help install any missing development tools.

## Usage

```bash
# Detect ecosystem and check tools
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ecosystem.cjs" --detect

# Check specific ecosystem
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ecosystem.cjs" --check nodejs
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ecosystem.cjs" --check python
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ecosystem.cjs" --check jvm
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ecosystem.cjs" --check rust

# Get installation help for specific tool
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ecosystem.cjs" --help node
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ecosystem.cjs" --help python
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ecosystem.cjs" --help java

# Interactive setup (guides through installation)
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ecosystem.cjs" --interactive
```

## Supported Ecosystems

### Node.js
- **Runtime**: node
- **Package Managers**: npm, pnpm, yarn, bun

### Python
- **Runtime**: python, python3
- **Package Managers**: pip, pip3, poetry, uv

### JVM (Java/Kotlin)
- **Runtime**: java, javac
- **Build Tools**: maven, gradle

### Rust
- **Runtime**: rustc
- **Package Manager**: cargo

## What It Does

1. **Detects** your project's ecosystem from files:
   - Node.js: `package.json`
   - Python: `requirements.txt`, `pyproject.toml`
   - JVM: `pom.xml`, `build.gradle`
   - Rust: `Cargo.toml`

2. **Checks** which tools are installed
3. **Reports** missing tools with severity levels
4. **Provides** platform-specific installation instructions
5. **Guides** through installation (interactive mode)

## Platform Support

- **Linux**: apt-get, dnf, pacman, or manual installation
- **macOS**: Homebrew or manual installation
- **Windows**: winget, chocolatey, or manual installation
- **WSL**: Linux instructions

## Examples

### Detect Current Project
```bash
$ node scripts/setup-ecosystem.cjs --detect

=== Ecosystem Detection ===
Detected: nodejs

Required Tools:
  ✓ node (v20.11.0)
  ✓ npm (v10.2.4)
  ✗ pnpm (not installed)

Recommended Tools:
  ✓ yarn (v1.22.19)
  ✗ bun (not installed)
```

### Interactive Setup
```bash
$ node scripts/setup-ecosystem.cjs --interactive

=== Ecosystem Setup Wizard ===
Detected ecosystem: nodejs

Missing critical tool: pnpm
Install pnpm now? [Y/n] y

Installing pnpm...
[Installation steps...]

✓ pnpm installed successfully!
```

### Get Installation Help
```bash
$ node scripts/setup-ecosystem.cjs --help python

=== Python Installation Guide ===

Platform: Linux (Ubuntu/Debian)

Install Python:
  sudo apt-get install python3.11 python3-pip

Alternative: Use pyenv for version management
  curl https://pyenv.run | bash
  pyenv install 3.11

Or use the interactive setup:
  node scripts/setup-ecosystem.cjs --interactive
```

## Integration with Workspace Detection

For monorepos with multiple ecosystems, the tool detects all ecosystems and checks tools for each:

```bash
=== Workspace: Mixed Ecosystem ===
Packages: 8

Node.js packages (3):
  ✓ node, npm, pnpm

Python packages (2):
  ✓ python3, pip
  ✗ poetry (recommended)

Rust packages (1):
  ✓ rustc, cargo

JVM packages (2):
  ✓ java, javac
  ✗ gradle (using wrapper)
```
