---
description: Install or update plugin rules to ~/.claude/rules/
argument-hint: "[--check|--install|--force|--uninstall]"
disable-model-invocation: true
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-rules.cjs"
---

# Rules Installation

Install plugin rules to `~/.claude/rules/` so they load into every Claude Code conversation.

> **Why is this needed?** Claude Code does NOT auto-load rules from plugins. Rules only load from `~/.claude/rules/` (user-level) or `.claude/rules/` (project-level). This command copies the plugin's 13 rules to your user directory.

## Usage

```bash
# Check which rules are missing
/setup-rules --check

# Install all plugin rules
/setup-rules --install

# Force overwrite (even user-modified rules)
/setup-rules --force

# Remove plugin-managed rules only
/setup-rules --uninstall
```

## How It Works

- Copies rules from the plugin's `rules/` directory to `~/.claude/rules/`
- Adds a `<!-- managed by magic-claude plugin -->` marker to track ownership
- Never overwrites user-modified files (unless `--force`)
- `--uninstall` only removes files with the managed marker

## File Status

| Symbol | Meaning |
|--------|---------|
| `✓` | Installed and up to date |
| `↻` | Outdated - will be updated |
| `○` | Missing - will be installed |
| `●` | User-owned - will be skipped |

## See Also

- `magic-claude:setup` - Complete automated setup (includes rules installation)
- `magic-claude:setup-pm` - Package manager configuration
- `magic-claude:setup-ecosystem` - Workspace and tools setup
