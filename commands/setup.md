---
description: Complete automated setup for your project (workspace detection, package manager, tools, dependencies)
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-complete.cjs"
disable-model-invocation: false
context: fork
allowed-tools: Read, Write, Edit, Bash, Bash(mcp-cli *), Grep, Glob, AskUserQuestion, TaskCreate, TaskUpdate, TaskList, Skill
---

# Complete Project Setup

## ⚠️ CRITICAL: Task Tracking Required

**YOU MUST use TaskCreate at the start to create tasks for ALL steps below, then TaskUpdate as you complete each one.**

```
TaskCreate for each step:
1. "Detect workspace structure"
2. "Initialize workspace if needed"
3. "Configure package manager" (create .claude/everything-claude-code.package-manager.json)
4. "Detect project ecosystems"
5. "Verify development tools"
6. "Install dependencies" (ask user first)
7. "Create project configuration files"
8. "Run Serena setup" (if installed - INVOKE /serena-setup skill)
9. "Save setup status"

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
7. **Configuration** - Sets up .claude/ configs
8. **Serena Integration** - **INVOKE /serena-setup skill** (activate, onboard, memories, CLAUDE.md migration)

## Step 8: Serena Integration (CRITICAL)

When Serena MCP is detected (check `mcp-cli info plugin_serena_serena/get_current_config`):

**YOU MUST invoke the `/serena-setup` skill using the Skill tool.**

This skill contains the complete 11-step workflow for:
- Activating project in Serena
- Running onboarding
- Creating memories from ALL documentation
- Configuring project.yml
- Migrating and minimizing CLAUDE.md
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
- Creates .claude/everything-claude-code.package-manager.json
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
✓ All tools available

Ready to proceed? [Y/n] y
✓ Setup complete!
```

### Monorepo/Workspace
```bash
$ cd my-monorepo
$ /setup

=== Project Setup ===
⚠️  Workspace detected (3 packages)
No root package.json found

Initialize workspace root? [Y/n] y
Preferred package manager [pnpm]: pnpm

✓ Created workspace root
✓ Configured pnpm workspace

Run install? [Y/n] y
✓ Installed dependencies

Setup complete!
```

### Automated Setup
```bash
$ /setup --yes

=== Project Setup ===
Workspace detected: pnpm-workspace
Packages: 5 (3 nodejs, 2 python)

✓ Workspace already configured
✓ Package manager: pnpm
✓ All tools available
✓ Dependencies installed

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
├── .claude/
│   ├── everything-claude-code.package-manager.json  # Package manager preference
│   ├── everything-claude-code.project-type.json     # Detected project types cache
│   ├── everything-claude-code.ecosystems.json       # Detected ecosystems per package
│   └── everything-claude-code.setup-status.json     # Setup completion status
├── .prettierrc            # Created
├── .gitignore             # Created if missing
└── packages/
    ├── api/
    └── web/
```

**Config file update triggers:**
- `package-manager.json` - Updated via `/setup-pm --project <pm>`
- `project-type.json` - Auto-invalidates when manifest files change
- `ecosystems.json` - Regenerated on `/setup`, delete to force refresh
- `setup-status.json` - Updated by `/setup` and `/serena-setup`

## Which Command Should I Use?

### Choose `/setup` when:
- ✓ First-time project setup
- ✓ You want everything configured automatically
- ✓ New team member onboarding
- ✓ "Just make it work" scenarios

### Choose `/setup-pm` when:
- ✓ Switching package managers (npm → pnpm)
- ✓ Checking current package manager detection
- ✓ Fixing package manager config only
- ✓ **WITHOUT** touching workspace structure or dependencies

### Choose `/setup-ecosystem` when:
- ✓ Initializing workspace root for monorepo
- ✓ Checking which development tools are installed
- ✓ Installing dependencies after adding packages
- ✓ **WITHOUT** changing package manager settings

## Command Hierarchy

```
/setup (Convenience - Does Everything)
├── /setup-pm (Granular - Package Manager Only)
│   ├── Detect current package manager
│   ├── Set global/project preference
│   └── Show detection priority
└── /setup-ecosystem (Granular - Workspace & Tools)
    ├── Detect workspace structure
    ├── Initialize workspace root
    ├── Check development tools
    └── Install dependencies
```

**Think of it like Git:**
- `/setup` = `git pull` (convenience)
- `/setup-pm` + `/setup-ecosystem` = `git fetch` + `git merge` (granular control)

## Troubleshooting

**"No package manager available"**
- Install npm (comes with Node.js)
- Or install pnpm: `npm install -g pnpm`

**"Workspace already has package.json"**
- Run `/setup-pm --detect` to see current config
- Run `/setup-ecosystem --detect` to check tools

**"Installation failed"**
- Check network connection
- Run manually: `pnpm install` or `npm install`
- Check for permission errors

**"Unknown ecosystem"**
- Currently supports: nodejs, python, jvm, rust
- For other ecosystems, tools must be installed manually

## See Also

- `/setup-pm` - Configure package manager only (granular control)
- `/setup-ecosystem` - Workspace and tools only (granular control)
- Both commands are orchestrated by `/setup` for convenience
