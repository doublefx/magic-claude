---
description: Complete automated setup for your project (workspace detection, package manager, tools, dependencies)
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-complete.cjs"
disable-model-invocation: false
---

# Complete Project Setup

Automated, interactive setup that handles everything:

1. **Workspace Detection** - Identifies monorepo/workspace structure
2. **Workspace Initialization** - Creates root package.json if needed
3. **Package Manager** - Detects and configures preferred package manager
4. **Ecosystem Detection** - Identifies Node.js, Python, Java, Rust projects
5. **Tool Checking** - Verifies required development tools
6. **Dependency Installation** - Installs workspace and package dependencies
7. **Configuration** - Sets up .claude/ configs

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
- Creates .claude/package-manager.json
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
│   └── package-manager.json  # Created
├── .prettierrc            # Created
├── .gitignore             # Created if missing
└── packages/
    ├── api/
    └── web/
```

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
