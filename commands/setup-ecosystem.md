---
description: Detect and install missing development tools for your project's ecosystem (Node.js, Python, Java, Rust)
disable-model-invocation: true
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ecosystem.cjs"
---

# Ecosystem Setup

Automatically detect your project's ecosystem and help install any missing development tools.

> **💡 First time here?** Use `/setup` for complete project setup. This command is for **granular control** over workspace initialization and tool checking only.

## Usage

```bash
# Detect ecosystem and check tools
/setup-ecosystem --detect

# Auto-initialize workspace (no prompts)
/setup-ecosystem --detect --yes

# Check specific ecosystem
/setup-ecosystem --check nodejs
/setup-ecosystem --check python
/setup-ecosystem --check jvm
/setup-ecosystem --check rust

# Get installation help for specific tool
/setup-ecosystem --help node
/setup-ecosystem --help python
/setup-ecosystem --help java

# Interactive setup (guides through installation)
/setup-ecosystem --interactive
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

2. **Auto-initializes** workspace roots when detected:
   - Finds sub-packages without root `package.json`
   - Offers to create workspace configuration
   - Sets up shared development tools
   - Configures package manager preference

3. **Checks** which tools are installed
4. **Reports** missing tools with severity levels
5. **Provides** platform-specific installation instructions
6. **Guides** through installation (interactive mode)

## Platform Support

- **Linux**: apt-get, dnf, pacman, or manual installation
- **macOS**: Homebrew or manual installation
- **Windows**: winget, chocolatey, or manual installation
- **WSL**: Linux instructions

## Examples

### Detect Current Project
```bash
$ /setup-ecosystem --detect

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
$ /setup-ecosystem --interactive

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
$ /setup-ecosystem --help python

=== Python Installation Guide ===

Platform: Linux (Ubuntu/Debian)

Install Python:
  sudo apt-get install python3.11 python3-pip

Alternative: Use pyenv for version management
  curl https://pyenv.run | bash
  pyenv install 3.11

Or use the interactive setup:
  /setup-ecosystem --interactive
```

### Workspace Auto-Initialization
```bash
$ cd my-monorepo
$ /setup-ecosystem --detect

⚠️  Workspace Structure Detected

Found 3 sub-package(s):
  - packages/api (nodejs)
  - packages/web (nodejs)
  - services/auth (nodejs)

But no root package.json found.
A root package.json is recommended for:
  • Shared development tools (prettier, eslint)
  • Workspace orchestration scripts
  • Documentation formatting
  • Hook compatibility

Initialize workspace root? [Y/n] y

Available package managers:
  ✓ pnpm (recommended)
  ✓ yarn
  ✓ npm

Preferred package manager [pnpm]: pnpm

=== Initializing Workspace Root ===

✓ Created package.json
✓ Created pnpm-workspace.yaml
✓ Created .claude/package-manager.json
✓ Created .prettierrc
✓ Created .gitignore

✓ Workspace root initialized!

Next steps:
  1. Run: pnpm install
  2. Review and adjust package.json scripts
  3. Configure shared tooling (.eslintrc, tsconfig.json)
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

## See Also

- `/setup` - Complete automated setup (package manager + workspace + tools)
- `/setup-pm` - Package manager configuration only
- This command focuses **only** on workspace initialization and tool checking
