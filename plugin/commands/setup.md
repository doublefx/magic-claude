---
description: Complete automated setup (workspace, package manager, tools, deps)
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-complete.cjs" $ARGUMENTS
disable-model-invocation: false
---

# Complete Project Setup

## CRITICAL: Task Tracking Required

**YOU MUST use TaskCreate at the start to create tasks for ALL steps below, then TaskUpdate as you complete each one.**

```
TaskCreate for each step:
1. "Detect workspace structure"
2. "Initialize workspace if needed"
3. "Detect package manager" (from lock files)
4. "Detect project ecosystems"
5. "Verify development tools"
6. "Install dependencies" (ask user first)
7. "Install plugin rules" (copies rules to ~/.claude/rules/)
8. "Check optional integrations" (claude-code-docs, claude-mem, frontend-design)
9. "Run Serena setup" (if installed - INVOKE magic-claude:serena-setup skill)
10. "Verify setup complete" (.serena/project.yml exists)

Mark each task in_progress before starting, completed when done.
Do NOT skip tasks - if a step is not applicable, mark it completed with a note.
```

---

Automated, interactive setup that handles everything:

1. **Workspace Detection** - Identifies monorepo/workspace structure
2. **Workspace Initialization** - Creates root package.json if needed
3. **Package Manager** - Detects and configures preferred package manager
4. **Ecosystem Detection** - Identifies Node.js, Python, Java, Rust projects
5. **Tool Checking** - Verifies required development tools
6. **Dependency Installation** - Installs workspace and package dependencies
7. **Rules Installation** - Copies plugin rules to `~/.claude/rules/`
8. **Optional Integrations** - Checks claude-code-docs, claude-mem, frontend-design; suggests install commands for missing ones
9. **Configuration** - Sets up .claude/ configs
10. **Serena Integration** - **INVOKE magic-claude:serena-setup skill** (activate, onboard, memories, CLAUDE.md migration)

## Step 9: Serena Integration (CRITICAL)

When Serena MCP is detected (call `mcp__plugin_serena_serena__get_current_config`):

**YOU MUST invoke the `magic-claude:serena-setup` skill using the Skill tool.**

This skill contains the complete workflow for:
- Activating project in Serena
- Configuring project.yml (languages, ignored paths)
- Installing git hooks (append to existing, don't overwrite)

## Usage

```bash
# Interactive setup (asks questions)
/setup

# Fully automated (auto-accept defaults)
/setup --yes

# Skip dependency installation
/setup --no-install

# Specific directory
/setup /path/to/project

# Help
/setup --help
```

## What It Does

### Detection Phase
- Scans directory structure for packages
- Identifies workspace type (pnpm, yarn, npm, lerna, nx)
- Detects ecosystems (nodejs, python, jvm, rust)
- Checks package manager availability

### Initialization Phase
- Creates workspace root package.json (if missing)
- Sets up workspace configuration
- Creates .claude/magic-claude.package-manager.json
- Adds .prettierrc, .gitignore

### Installation Phase
- Runs package manager install in workspace root
- Installs shared devDependencies (prettier, eslint)
- Links workspace packages

### Configuration Phase
- Configures package manager preference
- Sets up tool paths
- Creates project configuration

## Examples

### Simple Project
```bash
$ cd my-app
$ /setup

=== Project Setup ===
Detected: Single Node.js project
Package manager: npm (from package-lock.json)
[OK]All tools available

Ready to proceed? [Y/n] y
[OK]Setup complete!
```

### Monorepo/Workspace
```bash
$ cd my-monorepo
$ /setup

=== Project Setup ===
WARNING: Workspace detected (3 packages)
No root package.json found

Initialize workspace root? [Y/n] y
Preferred package manager [pnpm]: pnpm

[OK]Created workspace root
[OK]Configured pnpm workspace

Run install? [Y/n] y
[OK]Installed dependencies

Setup complete!
```

### Automated Setup
```bash
$ /setup --yes

=== Project Setup ===
Workspace detected: pnpm-workspace
Packages: 5 (3 nodejs, 2 python)

[OK]Workspace already configured
[OK]Package manager: pnpm
[OK]All tools available
[OK]Dependencies installed

Setup complete!
```

## Options

| Flag | Description |
|------|-------------|
| `--yes`, `-y` | Auto-accept all prompts with defaults |
| `--no-install` | Skip dependency installation |
| `--check` | Check only (don't modify anything) |
| `--verbose` | Show detailed output |
| `--help`, `-h` | Show help message |

## What Gets Created

For workspaces without root package.json:

```
workspace-root/
├── package.json           # Created
├── pnpm-workspace.yaml    # Created (or workspaces in package.json)
├── .serena/
│   └── project.yml        # Created by Serena (source of truth for setup status)
├── .prettierrc            # Created
├── .gitignore             # Created if missing
└── packages/
    ├── api/
    └── web/
```

**Configuration stored in Serena memories** (no JSON config files):
- Package manager preference → `project_config_context` memory
- Project types and ecosystems → `project_config_context` memory
- Setup status → `.serena/project.yml` existence

## Which Command Should I Use?

### Choose `magic-claude:setup` when:
- First-time project setup
- You want everything configured automatically
- New team member onboarding
- "Just make it work" scenarios

### Choose `magic-claude:setup-pm` when:
- Switching package managers (npm -> pnpm)
- Checking current package manager detection
- Fixing package manager config only
- **WITHOUT** touching workspace structure or dependencies

### Choose `magic-claude:setup-ecosystem` when:
- Initializing workspace root for monorepo
- Checking which development tools are installed
- Installing dependencies after adding packages
- **WITHOUT** changing package manager settings

## Command Hierarchy

```
magic-claude:setup (Convenience - Does Everything)
├── magic-claude:setup-pm (Granular - Package Manager Only)
│   ├── Detect current package manager
│   ├── Set global/project preference
│   └── Show detection priority
├── magic-claude:setup-ecosystem (Granular - Workspace & Tools)
│   ├── Detect workspace structure
│   ├── Initialize workspace root
│   ├── Check development tools
│   └── Install dependencies
└── magic-claude:setup-rules (Granular - Rules Only)
    ├── Check rule installation status
    ├── Install/update managed rules
    └── Uninstall managed rules
```

**Think of it like Git:**
- `magic-claude:setup` = `git pull` (convenience)
- `magic-claude:setup-pm` + `magic-claude:setup-ecosystem` = `git fetch` + `git merge` (granular control)

## Troubleshooting

**"No package manager available"**
- Install npm (comes with Node.js)
- Or install pnpm: `npm install -g pnpm`

**"Workspace already has package.json"**
- Run `magic-claude:setup-pm --detect` to see current config
- Run `magic-claude:setup-ecosystem --detect` to check tools

**"Installation failed"**
- Check network connection
- Run manually: `pnpm install` or `npm install`
- Check for permission errors

**"Unknown ecosystem"**
- Currently supports: nodejs, python, jvm, rust
- For other ecosystems, tools must be installed manually

## See Also

- `magic-claude:setup-pm` - Configure package manager only (granular control)
- `magic-claude:setup-ecosystem` - Workspace and tools only (granular control)
- `magic-claude:setup-rules` - Install plugin rules to `~/.claude/rules/`
- All three commands are orchestrated by `magic-claude:setup` for convenience
