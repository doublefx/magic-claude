# Plugin Structure - Complete Architecture Reference

## Overview

A Claude Code plugin is a self-contained directory with metadata, commands, agents, skills, hooks, MCP servers, LSP servers, and other resources.

## Complete Directory Structure

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json              # OPTIONAL: Plugin metadata (manifest)
├── commands/                    # OPTIONAL: Slash commands (legacy; use skills/ for new)
│   ├── setup.md                 # Markdown command
│   ├── deploy.md                # Another markdown command
│   └── deploy.cjs               # Node.js script command
├── agents/                      # OPTIONAL: Specialized AI agents
│   ├── planner.md               # Planning agent
│   ├── code-reviewer.md         # Code review agent
│   └── security-reviewer.md     # Security specialist
├── skills/                      # OPTIONAL: Reusable knowledge
│   ├── tdd-workflow/            # Complex skill with resources
│   │   ├── SKILL.md             # Main skill content
│   │   ├── config.json          # Optional configuration
│   │   └── templates/
│   │       ├── test-template.ts
│   │       └── impl-template.ts
│   ├── security-review/         # Another complex skill
│   │   └── SKILL.md
│   └── quick-reference.md       # Simple single-file skill
├── hooks/                       # OPTIONAL: Event automation
│   └── hooks.json               # Hook definitions
├── rules/                       # OPTIONAL: Project guidelines
│   ├── coding-style.md
│   ├── git-workflow.md
│   └── performance.md
├── .mcp.json                    # OPTIONAL: MCP server definitions
├── .lsp.json                    # OPTIONAL: LSP server configurations
├── scripts/                     # OPTIONAL: Utility scripts
│   ├── setup.cjs
│   ├── lib/
│   │   └── utils.js
│   └── hooks/
│       ├── formatter.js
│       └── security-check.js
├── docs/                        # OPTIONAL: Documentation
│   ├── GUIDES.md
│   └── API-REFERENCE.md
├── tests/                       # OPTIONAL: Plugin tests
│   ├── commands.test.js
│   ├── agents.test.js
│   └── hooks.test.js
├── templates/                   # OPTIONAL: Project templates
│   ├── node-app/
│   │   └── package.json.template
│   └── python-app/
│       └── main.py.template
├── package.json                 # Node.js metadata (optional)
├── README.md                    # Plugin documentation
├── CONTRIBUTING.md              # Contribution guidelines
└── LICENSE                      # License (MIT, Apache-2.0, etc)
```

> **Important:** The `.claude-plugin/` directory contains only `plugin.json`. All other directories (`commands/`, `agents/`, `skills/`, `hooks/`) must be at the plugin root, not inside `.claude-plugin/`.

## Core Components

### 1. plugin.json (OPTIONAL)

**Location:** `.claude-plugin/plugin.json`

The manifest is optional. If omitted, Claude Code auto-discovers components in default locations and derives the plugin name from the directory name. Use a manifest when you need to provide metadata or custom component paths.

If you include a manifest, `name` is the only required field.

**Complete Schema:**

```json
{
  "name": "plugin-name",
  "version": "1.2.0",
  "description": "Brief plugin description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://github.com/username"
  },
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "commands": ["./custom/commands/special.md"],
  "agents": "./custom/agents/",
  "skills": "./custom/skills/",
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json",
  "outputStyles": "./styles/",
  "lspServers": "./.lsp.json"
}
```

> **Note:** `commands/`, `agents/`, `skills/`, and `hooks/hooks.json` are auto-discovered from their default locations. You only need to specify component path fields for **non-default** paths (e.g., `"agents": "./custom/agents/reviewer.md"`). Custom paths **supplement** defaults, they don't replace them. To disable auto-discovery of a component, set its path to `null`.

**Field Reference:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Plugin identifier (kebab-case, no spaces, unique). Used for namespacing components. |
| `version` | string | No | Semantic version (e.g., "1.0.0", "2.3.4-beta"). If also set in marketplace entry, plugin.json takes priority. |
| `description` | string | No | Brief explanation of plugin purpose |
| `author` | object | No | Author details (name, email, url) |
| `license` | string | No | License type (MIT, Apache-2.0, etc) |
| `homepage` | string | No | Documentation URL |
| `repository` | string | No | Source code URL |
| `keywords` | array | No | Discovery tags (5-10 recommended) |
| `commands` | string\|array | No | Additional command files/dirs (default `commands/` auto-discovered). Legacy; use `skills/` for new. |
| `skills` | string\|array | No | Additional skill dirs (default `skills/` auto-discovered) |
| `agents` | string\|array | No | Additional agent files (default `agents/` auto-discovered) |
| `hooks` | string\|array\|object | No | Additional hook configs or inline (default `hooks/hooks.json` auto-discovered) |
| `mcpServers` | string\|array\|object | No | MCP server config paths or inline config (default `.mcp.json` auto-discovered) |
| `outputStyles` | string\|array | No | Additional output style files/directories |
| `lspServers` | string\|array\|object | No | LSP server configs for code intelligence (default `.lsp.json` auto-discovered) |

**Minimal Valid plugin.json:**

```json
{
  "name": "my-plugin"
}
```

**Real-world plugin.json (magic-claude, using auto-discovery):**

```json
{
  "name": "magic-claude",
  "version": "2.7.0",
  "description": "Enterprise Stack Extension - Claude Code plugin for Python, Java, Kotlin, Gradle, Maven, and CI/CD pipelines",
  "author": {
    "name": "doublefx",
    "url": "https://github.com/doublefx"
  },
  "license": "MIT",
  "homepage": "https://github.com/doublefx/magic-claude",
  "repository": "https://github.com/doublefx/magic-claude",
  "keywords": [
    "claude-code",
    "agents",
    "skills",
    "hooks",
    "tdd",
    "code-review",
    "python",
    "java",
    "ci-cd"
  ]
}
```

> This manifest relies entirely on auto-discovery for `commands/`, `agents/`, `skills/`, and `hooks/hooks.json`. No component path fields are needed when using default locations.

### 2. Commands Directory (Legacy)

**Location:** `commands/`

> **Note:** Per the official Claude Code specification, commands are considered legacy. Use `skills/` for new skills.

**Contents:**
- Markdown files (`.md`) for Claude-driven commands
- Node.js files (`.cjs`) for script-driven commands

**Structure:**

```
commands/
├── setup.md              # Basic command
├── setup-pm.md           # Another command
├── setup-ecosystem.md    # Yet another
├── ci-cd.cjs            # Node.js script
└── tdd.md               # TDD workflow command
```

**Rules:**
- Filename: lowercase-with-hyphens
- Each file = one command
- File name = command name (minus extension)

### 3. Agents Directory

**Location:** `agents/`

**Contents:**
- Markdown files (`.md`) only
- Each file describes one agent

**Structure:**

```
agents/
├── code-reviewer.md      # Code review specialist
├── tdd-guide.md          # TDD methodology
├── planner.md            # Feature planning
├── security-reviewer.md  # Security expert
└── architect.md          # Architecture specialist
```

**Rules:**
- Filename: lowercase-with-hyphens
- File name = agent name
- Frontmatter: `name`, `description`, `tools`, `model`

### 4. Skills Directory

**Location:** `skills/`

**Contents:**
- Directories with `SKILL.md` (complex skills)
- Markdown files (`.md`) (simple skills)

**Structure:**

```
skills/
├── tdd-workflow/         # Complex skill
│   ├── SKILL.md
│   ├── config.json
│   └── templates/
│       ├── test.ts
│       └── implementation.ts
├── security-review/      # Another complex skill
│   └── SKILL.md
├── coding-standards.md   # Simple skill
└── git-workflow.md       # Another simple skill
```

**Rules:**
- Directory-based: `skill-name/SKILL.md`
- File-based: `skill-name.md`
- Frontmatter: `name`, `description`, optional `context`
- Can include templates, config, resources

### 5. Hooks Directory

**Location:** `hooks/hooks.json`

**Structure:**

```json
{
  "hooks": {
    "PreToolUse": [ { /* hook rules */ } ],
    "PostToolUse": [ { /* hook rules */ } ],
    "PostToolUseFailure": [ { /* hook rules */ } ],
    "PermissionRequest": [ { /* hook rules */ } ],
    "Notification": [ { /* hook rules */ } ],
    "SubagentStart": [ { /* hook rules */ } ],
    "SubagentStop": [ { /* hook rules */ } ],
    "UserPromptSubmit": [ { /* hook rules */ } ],
    "SessionStart": [ { /* hook rules */ } ],
    "SessionEnd": [ { /* hook rules */ } ],
    "PreCompact": [ { /* hook rules */ } ],
    "Stop": [ { /* hook rules */ } ],
    "TeammateIdle": [ { /* hook rules */ } ],
    "TaskCompleted": [ { /* hook rules */ } ],
    "ConfigChange": [ { /* hook rules */ } ],
    "WorktreeCreate": [ { /* hook rules */ } ],
    "WorktreeRemove": [ { /* hook rules */ } ]
  }
}
```

**Each hook rule contains:**
- `matcher`: String/regex pattern (some events don't support matchers)
- `hooks`: Array of handlers (`type`: `command`, `prompt`, `agent`, or `http`)
- `description`: Explanation

**Hook handler types:**
- `command`: Execute shell commands or scripts
- `prompt`: Evaluate a prompt with an LLM (uses `$ARGUMENTS` placeholder for context)
- `agent`: Run an agentic verifier with tools for complex verification tasks
- `http`: POST hook input JSON to a URL endpoint (webhook integration)

### 6. MCP Servers

**Location:** `.mcp.json` in plugin root, or inline in plugin.json

Plugins can bundle Model Context Protocol (MCP) servers to connect Claude Code with external tools and services.

**Configuration:**

```json
{
  "mcpServers": {
    "plugin-database": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": {
        "DB_PATH": "${CLAUDE_PLUGIN_ROOT}/data"
      }
    }
  }
}
```

**Integration behavior:**
- Plugin MCP servers start automatically when the plugin is enabled
- Servers appear as standard MCP tools in Claude's toolkit
- Use `${CLAUDE_PLUGIN_ROOT}` for all plugin paths

### 7. LSP Servers

**Location:** `.lsp.json` in plugin root, or inline in plugin.json

Plugins can provide Language Server Protocol (LSP) servers for real-time code intelligence (go to definition, find references, diagnostics).

**Configuration:**

```json
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": {
      ".go": "go"
    }
  }
}
```

**Required fields:** `command`, `extensionToLanguage`

**Optional fields:** `args`, `transport`, `env`, `initializationOptions`, `settings`, `workspaceFolder`, `startupTimeout`, `shutdownTimeout`, `restartOnCrash`, `maxRestarts`

> **Important:** You must install the language server binary separately. LSP plugins configure how Claude Code connects to a language server, but they don't include the server itself.

### 8. Rules Directory (NOT Auto-Loaded)

**Location:** `rules/`

**Contents:**
- Markdown files (`.md`) with project guidelines
- **NOT auto-loaded from plugins** - Claude Code only loads rules from `~/.claude/rules/` (user-level) or `.claude/rules/` (project-level)

**Structure:**

```
rules/
├── coding-style.md       # Code style guidelines
├── git-workflow.md       # Git conventions
├── performance.md        # Performance rules
└── security.md          # Security guidelines
```

**Installation Required:**
- Standard markdown format
- No frontmatter required
- Must be copied to `~/.claude/rules/` to take effect
- Use `/setup-rules --install` to install plugin rules
- The `/setup` command includes rules installation automatically

### 9. Scripts Directory (Optional)

**Location:** `scripts/`

**Contents:**
- Node.js utility scripts (`.js`, `.cjs`, `.mjs`)
- Referenced by commands and hooks

**Structure:**

```
scripts/
├── setup-pm.cjs          # Package manager setup
├── deploy.cjs            # Deployment script
├── lib/
│   ├── utils.js          # Shared utilities
│   ├── package-manager.js
│   └── detection.js
└── hooks/
    ├── formatter.js      # Code formatter hook
    ├── security-check.js # Security check hook
    └── lib/
        └── shared.js
```

**Rules:**
- Use CommonJS (`.cjs`) for cross-platform compatibility
- Can use `.js` with `"type": "module"` in package.json
- Should be referenced with `${CLAUDE_PLUGIN_ROOT}`

## Environment Variables and Path Handling

### ${CLAUDE_PLUGIN_ROOT} Variable

**What it is:**
Absolute path to plugin root directory

**When available:**
- In commands (frontmatter `command` field)
- In hooks (script path references)
- In MCP server and LSP server configs
- In scripts (when executed)
- At runtime (process.env.CLAUDE_PLUGIN_ROOT)

**Usage:**

In command frontmatter:
```markdown
---
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-pm.cjs"
---
```

In hook definitions:
```json
{
  "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/formatter.js\""
}
```

In MCP server configs:
```json
{
  "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
  "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"]
}
```

In Node.js scripts:
```javascript
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
const scriptPath = path.join(pluginRoot, 'scripts', 'utility.js');
```

### Other Plugin Environment Variables

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS` | Override the default git operation timeout (in milliseconds) for plugin-related git operations. Useful for large plugins or slow networks |

### Path Behavior Rules

**Important:** Custom paths supplement default directories - they don't replace them.

- If `commands/` exists, it's loaded in addition to custom command paths
- All paths must be relative to plugin root and start with `./`
- Commands from custom paths use the same naming and namespacing rules
- Multiple paths can be specified as arrays

**Path examples:**

```json
{
  "commands": [
    "./specialized/deploy.md",
    "./utilities/batch-process.md"
  ],
  "agents": [
    "./custom-agents/reviewer.md",
    "./custom-agents/tester.md"
  ]
}
```

**Best Practice:**

```javascript
const path = require('path');

// GOOD: Explicit, cross-platform
const scriptPath = path.join(
  process.env.CLAUDE_PLUGIN_ROOT,
  'scripts',
  'setup.js'
);

// BAD: Relative path, ambiguous
const scriptPath = './scripts/setup.js';

// BAD: Hardcoded path, platform-specific
const scriptPath = '/home/user/plugin/scripts/setup.js';
```

## Plugin Caching and File Resolution

Plugins are copied to a cache directory when installed rather than used in-place. This has important implications:

- Plugins cannot reference files outside their copied directory structure
- Paths that traverse outside the plugin root (such as `../shared-utils`) will not work
- Symlinks are honored during the copy process (use for external dependencies)

## Plugin Installation

### Installation Process

```
User: /plugin install plugin-name@marketplace
  ↓
Claude Code locates plugin via marketplace
  ↓
Claude Code copies plugin to cache directory
  ↓
Claude Code reads .claude-plugin/plugin.json (if present)
  ↓
Claude Code auto-discovers:
  - Commands from ./commands
  - Agents from ./agents
  - Skills from ./skills
  - Hooks from ./hooks/hooks.json
  - MCP servers from ./.mcp.json
  - LSP servers from ./.lsp.json
  ↓
Plugin is registered and available
  ↓
NOTE: Rules in rules/ are NOT auto-loaded.
Run /setup-rules --install to copy to ~/.claude/rules/
```

### Installation Scopes

| Scope | Settings file | Use case |
|-------|--------------|----------|
| `user` | `~/.claude/settings.json` | Personal plugins across all projects (default) |
| `project` | `.claude/settings.json` | Team plugins shared via version control |
| `local` | `.claude/settings.local.json` | Project-specific plugins, gitignored |
| `managed` | `managed-settings.json` | Managed plugins (read-only, update only) |

### File Locations Reference

| Component | Default Location | Purpose |
|-----------|-----------------|---------|
| **Manifest** | `.claude-plugin/plugin.json` | Plugin metadata and configuration (optional) |
| **Commands** | `commands/` | Skill Markdown files (legacy; use `skills/` for new skills) |
| **Agents** | `agents/` | Subagent Markdown files |
| **Skills** | `skills/` | Skills with `<name>/SKILL.md` structure |
| **Hooks** | `hooks/hooks.json` | Hook configuration |
| **MCP servers** | `.mcp.json` | MCP server definitions |
| **LSP servers** | `.lsp.json` | Language server configurations |
| **Settings** | `settings.json` | Plugin settings (only `agent` key supported — configures default agent behavior) |
| **Rules** | `rules/` | Project guidelines (NOT auto-loaded; manual install required) |

### Disabling Components

To disable auto-discovery of a component, set its path to `null` in plugin.json:

```json
{
  "commands": null,
  "skills": null
}
```

## Component Naming and File Conventions

### File Naming Rules

**MUST:**
- Use lowercase with hyphens: `my-command.md`
- Never use camelCase: `myCommand.md`
- Never use underscores: `my_command.md`
- Never use spaces: `my command.md`

**Should:**
- Be descriptive: `code-review.md`
- Indicate purpose: `tdd-guide.md`
- Avoid abbreviations unless well-known: `ci-cd.md`

**Examples:**

| File | OK | Reason |
|------|-----|--------|
| `setup-pm.md` | Yes | Clear, descriptive |
| `code-reviewer.md` | Yes | Clear purpose |
| `tdd-guide.md` | Yes | Indicates TDD guidance |
| `setupPm.md` | No | camelCase not allowed |
| `setup_pm.md` | No | Underscores not allowed |
| `setup.pm.md` | No | Dots confusing |

## Configuration Files

### Optional: package.json

If using Node.js dependencies:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My plugin",
  "type": "module",
  "scripts": {
    "test": "node tests/run.js",
    "lint": "eslint ."
  },
  "dependencies": {
    "commander": "^11.0.0"
  },
  "devDependencies": {
    "eslint": "^8.0.0"
  }
}
```

### Optional: .npmrc or .npmignore

For npm-specific configuration (if publishing to npm registry).

## Multi-Plugin Architecture

You can install multiple plugins together:

```
~/.claude/plugins/
├── plugin-1/
│   ├── .claude-plugin/plugin.json
│   ├── commands/
│   ├── agents/
│   └── skills/
├── plugin-2/
│   ├── .claude-plugin/plugin.json
│   ├── commands/
│   └── agents/
└── plugin-3/
    ├── .claude-plugin/plugin.json
    └── commands/
```

**Considerations:**
- Command names must be unique across plugins
- Agent names must be unique
- Skill names must be unique
- Hooks combine from all plugins
- Plugin name is used for namespacing (e.g., `plugin-dev:agent-creator`)

## Plugin Publishing (Marketplaces)

Plugins are distributed via **marketplaces** - catalogs that list plugins and their sources.

### Creating a Marketplace

Create `.claude-plugin/marketplace.json` in a git repository:

```json
{
  "name": "my-marketplace",
  "owner": {
    "name": "Your Name"
  },
  "plugins": [
    {
      "name": "my-plugin",
      "source": "./plugins/my-plugin",
      "description": "What this plugin does"
    }
  ]
}
```

### Plugin Sources

Marketplaces support multiple source types:
- **Relative paths:** `"source": "./plugins/my-plugin"` (same repository)
- **GitHub:** `"source": { "source": "github", "repo": "owner/repo" }`
- **Git URL:** `"source": { "source": "url", "url": "https://gitlab.com/team/plugin.git" }`

### Distribution

```bash
# Add marketplace
/plugin marketplace add owner/marketplace-repo

# Install from marketplace
/plugin install plugin-name@marketplace-name

# Update plugin
/plugin update plugin-name@marketplace-name
```

See the [official marketplace documentation](https://code.claude.com/docs/en/plugin-marketplaces) for complete details.

## Testing Plugin Structure

### Validate plugin.json

```bash
# Validate plugin
claude plugin validate .

# Or from within Claude Code
/plugin validate .
```

### Check File Locations

```bash
# Verify commands exist
ls -la commands/

# Verify agents exist
ls -la agents/

# Verify skills exist
ls -la skills/
```

### Test Command Execution

```bash
# Test script command
node commands/my-command.cjs --help

# Test hook script
echo '{}' | node scripts/hooks/my-hook.js
```

## Best Practices

### 1. Clear Structure

```
my-plugin/
├── .claude-plugin/plugin.json  # Metadata (optional)
├── commands/                   # User-facing (legacy)
├── agents/                     # AI specialists
├── skills/                     # Knowledge base (preferred)
├── hooks/                      # Automation
├── .mcp.json                   # MCP servers
├── .lsp.json                   # LSP servers
├── scripts/                    # Supporting
└── docs/                       # Documentation
```

### 2. Meaningful Names

- `code-reviewer.md` (clear purpose)
- `agent.md` (too vague)
- `setup-ecosystem.md` (specific function)
- `setup.md` (which setup?)

### 3. DRY (Don't Repeat Yourself)

- Share scripts between commands and hooks
- Use utilities in scripts/lib/
- Reference skills in agents

### 4. Performance

- Keep hook execution < 1 second
- Use efficient matchers
- Avoid redundant file I/O
- Cache results

## Troubleshooting

### Plugin Not Loading

**Check:**
1. If using a manifest, `.claude-plugin/plugin.json` exists
2. JSON is valid (no syntax errors)
3. `name` field is present (only required field)
4. Component directories are at plugin root, not inside `.claude-plugin/`

### Commands Not Appearing

**Check:**
1. `commands` directory exists at plugin root
2. Files have correct naming (lowercase-with-hyphens)
3. Files have YAML frontmatter with `description`
4. Custom paths in plugin.json are correct

### Agents Not Available

**Check:**
1. `agents` directory exists at plugin root
2. Files have correct naming
3. Frontmatter has `name`, `description`, `tools`, `model`

### Hooks Not Firing

**Check:**
1. `hooks/hooks.json` exists at plugin root
2. JSON is valid
3. Matchers are correct (case-sensitive event names)
4. Scripts exist and are executable (`chmod +x`)
5. Scripts use `${CLAUDE_PLUGIN_ROOT}` for paths

### MCP Server Fails

**Check:**
1. `.mcp.json` exists at plugin root
2. Server command is installed and accessible
3. All paths use `${CLAUDE_PLUGIN_ROOT}` variable
4. Run `claude --debug` for initialization errors

### Path Errors After Installation

**Check:**
1. All paths are relative and start with `./`
2. No `../` traversal outside plugin root
3. External files accessed via symlinks (copied during install)

## Official References

- [Plugin specification](https://code.claude.com/docs/en/plugins-reference)
- [Plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Creating plugins](https://code.claude.com/docs/en/plugins)
- [Skills](https://code.claude.com/docs/en/skills)
- [Hooks](https://code.claude.com/docs/en/hooks)
- [MCP](https://code.claude.com/docs/en/mcp)

---

**Last Updated:** 2026-02-28
**Version:** 4.1.0
**Claude Code Version:** 2.1.63
**Status:** Aligned with official Claude Code plugin specification
**Reference:** [Official Anthropic Docs](https://code.claude.com/docs/en/plugins) | [Platform llms.txt](https://platform.claude.com/llms.txt)
