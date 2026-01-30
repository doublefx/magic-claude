---
description: Configure your preferred package manager (npm/pnpm/yarn/bun)
disable-model-invocation: true
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-package-manager.cjs"
---

# Package Manager Setup

Configure your preferred package manager for this project or globally.

> **💡 First time here?** Use `/setup` for complete project setup. This command is for **granular control** over package manager configuration only.

## Usage

```bash
# Detect current package manager
/setup-pm --detect

# Set global preference
/setup-pm --global pnpm

# Set project preference
/setup-pm --project bun

# List available package managers
/setup-pm --list
```

## Detection Priority

When determining which package manager to use, the following order is checked:

1. **Environment variable**: `CLAUDE_PACKAGE_MANAGER`
2. **Project config**: `.claude/everything-claude-code.package-manager.json`
3. **package.json**: `packageManager` field
4. **Lock file**: Presence of package-lock.json, yarn.lock, pnpm-lock.yaml, or bun.lockb
5. **Global config**: `~/.claude/everything-claude-code.package-manager.json`
6. **Fallback**: First available package manager (pnpm > bun > yarn > npm)

## Configuration Files

### Global Configuration
```json
// ~/.claude/everything-claude-code.package-manager.json
{
  "packageManager": "pnpm"
}
```

### Project Configuration
```json
// .claude/everything-claude-code.package-manager.json
{
  "packageManager": "bun"
}
```

### package.json
```json
{
  "packageManager": "pnpm@8.6.0"
}
```

## Environment Variable

Set `CLAUDE_PACKAGE_MANAGER` to override all other detection methods:

```bash
# Windows (PowerShell)
$env:CLAUDE_PACKAGE_MANAGER = "pnpm"

# macOS/Linux
export CLAUDE_PACKAGE_MANAGER=pnpm
```

## Run the Detection

To see current package manager detection results, run:

```bash
/setup-pm --detect
```

## See Also

- `/setup` - Complete automated setup (package manager + workspace + tools)
- `/setup-ecosystem` - Workspace initialization and tool checking
- This command focuses **only** on package manager configuration
