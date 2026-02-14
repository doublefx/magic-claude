# Plugin Structure - Complete Architecture Reference

## Overview

A Claude Code plugin is a self-contained directory with metadata, commands, agents, skills, hooks, and other resources.

## Complete Directory Structure

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json              # REQUIRED: Plugin metadata
├── commands/                    # OPTIONAL: Slash commands
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

## Core Components

### 1. plugin.json (REQUIRED)

**Location:** `.claude-plugin/plugin.json`

**Complete Schema:**

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "What this plugin does",
  "author": {
    "name": "Your Name",
    "email": "your@email.com",
    "url": "https://github.com/username"
  },
  "license": "MIT",
  "homepage": "https://github.com/username/my-plugin",
  "repository": "https://github.com/username/my-plugin",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "commands": "./commands",
  "skills": "./skills",
  "engines": {
    "claude-code": ">=1.0.0"
  }
}
```

> **Note:** `agents/`, `hooks/hooks.json`, and `skills/` are auto-discovered from their default locations. You only need to specify `commands`, `skills`, `agents`, or `hooks` in plugin.json if using **non-default** paths (e.g., `"agents": "./custom/agents/reviewer.md"`). Custom paths **supplement** defaults, they don't replace them.

**Field Reference:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Plugin identifier (lowercase, hyphens, unique) |
| `version` | string | Yes | Semantic version (e.g., "1.0.0", "2.3.4-beta") |
| `description` | string | Yes | One-line description |
| `author` | object | No | Author details (name, email, url) |
| `license` | string | No | License type (MIT, Apache-2.0, etc) |
| `homepage` | string | No | Project homepage URL |
| `repository` | string | No | Repository URL |
| `keywords` | array | No | Search keywords (5-10 recommended) |
| `commands` | string\|array | No | Additional command files/dirs (default `commands/` auto-discovered) |
| `skills` | string\|array | No | Additional skill dirs (default `skills/` auto-discovered) |
| `agents` | string\|array | No | Additional agent files (default `agents/` auto-discovered) |
| `hooks` | string\|array\|object | No | Additional hook configs or inline (default `hooks/hooks.json` auto-discovered) |
| `engines` | object | No | Version requirements |

**Minimal Valid plugin.json:**

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My first plugin"
}
```

**Complete plugin.json:**

```json
{
  "name": "magic-claude",
  "version": "2.0.0-enterprise",
  "description": "Enterprise Stack Extension - Complete collection of battle-tested Claude Code configs",
  "author": {
    "name": "doublefx",
    "email": "contact@example.com",
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
  ],
  "commands": "./commands",
  "skills": "./skills",
  "engines": {
    "claude-code": ">=1.0.0"
  }
}
```

### 2. Commands Directory

**Location:** `commands/`

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
    "Setup": [ { /* hook rules */ } ],
    "Stop": [ { /* hook rules */ } ],
    "TeammateIdle": [ { /* hook rules */ } ],
    "TaskCompleted": [ { /* hook rules */ } ]
  }
}
```

**Each hook rule contains:**
- `matcher`: String/regex pattern (some events don't support matchers)
- `hooks`: Array of handlers (`type`: `command`, `prompt`, or `agent`)
- `description`: Explanation

### 6. Rules Directory (NOT Auto-Loaded)

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

### 7. Scripts Directory (Optional)

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

In Node.js scripts:
```javascript
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
const scriptPath = path.join(pluginRoot, 'scripts', 'utility.js');
```

### Path Resolution Rules

**Absolute Paths:**
- Always work
- Use `${CLAUDE_PLUGIN_ROOT}` for plugin-relative paths
- Use `process.env.HOME` for user home
- Use `process.env.PWD` for current directory

**Relative Paths (in commands/hooks):**
- Relative to plugin root when specified
- Use `${CLAUDE_PLUGIN_ROOT}` to be explicit

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

## Plugin Installation

### Installation Process

```
User: /plugin install /path/to/my-plugin
  ↓
Claude Code locates plugin root
  ↓
Claude Code reads .claude-plugin/plugin.json
  ↓
Claude Code discovers:
  - Commands from ./commands
  - Agents from ./agents
  - Skills from ./skills
  - Hooks from ./hooks/hooks.json
  ↓
Plugin is registered and available
  ↓
NOTE: Rules in rules/ are NOT auto-loaded.
Run /setup-rules --install to copy to ~/.claude/rules/
```

### Plugin Discovery

**Components Auto-Discovered:**

| Component | Location | Auto-Loaded |
|-----------|----------|-------------|
| Commands | Directory in plugin.json | Yes |
| Agents | Directory in plugin.json | Yes |
| Skills | Directory in plugin.json | Yes |
| Hooks | File path in plugin.json | Yes (if specified) |
| Rules | `~/.claude/rules/` or `.claude/rules/` | No (manual install required) |

**Disabling Components:**

To disable auto-discovery of a component, set its path to `null` in plugin.json:

```json
{
  "commands": null,      // Disable commands auto-discovery
  "skills": null         // Disable skills auto-discovery
}
```

## Component Naming and File Conventions

### File Naming Rules

**MUST:**
- Use lowercase with hyphens: `my-command.md`
- Never use camelCase: ❌ `myCommand.md`
- Never use underscores: ❌ `my_command.md`
- Never use spaces: ❌ `my command.md`

**Should:**
- Be descriptive: `code-review.md` ✓
- Indicate purpose: `tdd-guide.md` ✓
- Avoid acronyms: `ci-cd.md` ✓

**Examples:**

| File | ✓/❌ | Reason |
|------|-----|--------|
| `setup-pm.md` | ✓ | Clear, descriptive |
| `code-reviewer.md` | ✓ | Clear purpose |
| `tdd-guide.md` | ✓ | Indicates TDD guidance |
| `setupPm.md` | ❌ | camelCase not allowed |
| `setup_pm.md` | ❌ | Underscores not allowed |
| `setup.pm.md` | ❌ | Dots confusing |

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

## Inline vs External Configuration

### Inline Configuration (Recommended for Simple Plugins)

**Structure:**
- Everything in plugin.json
- Commands/agents/skills in separate files
- Hooks all in hooks.json
- Scripts in scripts/ directory

**Advantages:**
- Simple to understand
- Clear structure
- Self-contained

### External Configuration (For Complex Plugins)

Can reference external config files:

```markdown
---
name: skill-name
config-file: ./skills/skill-name/config.json
---
```

**Not fully standardized yet**, but allows separate configuration.

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

## Testing Plugin Structure

### Validate plugin.json

```bash
# Check JSON validity
node -e "console.log(JSON.stringify(require('./​.claude-plugin/plugin.json'), null, 2))"
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
├── .claude-plugin/plugin.json  # Metadata first
├── commands/                   # User-facing
├── agents/                     # AI specialists
├── skills/                     # Knowledge base
├── hooks/                      # Automation
├── scripts/                    # Supporting
└── docs/                       # Documentation
```

### 2. Meaningful Names

- `code-reviewer.md` ✓ (clear purpose)
- `agent.md` ❌ (vague)
- `setup-ecosystem.md` ✓ (specific function)
- `setup.md` ❌ (which setup?)

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
1. `.claude-plugin/plugin.json` exists
2. JSON is valid (no syntax errors)
3. Required fields are present
4. Paths in plugin.json are correct

### Commands Not Appearing

**Check:**
1. `commands` directory exists
2. Files have correct naming
3. Files have YAML frontmatter with `description`
4. Path in plugin.json is correct

### Agents Not Available

**Check:**
1. `agents` directory exists
2. Files have correct naming
3. Frontmatter has `name`, `description`, `tools`, `model`
4. Path in plugin.json is correct

### Hooks Not Firing

**Check:**
1. `hooks.json` exists at correct path
2. JSON is valid
3. Matchers are correct CEL expressions
4. Scripts exist and are executable
5. Path in plugin.json is correct

## Plugin Publishing (Future)

When plugin marketplace becomes available:

```bash
# Package plugin
tar czf my-plugin.tgz my-plugin/

# Publish to registry
claude-code publish my-plugin.tgz

# Others can install
/plugin install my-plugin
```

---

**Last Updated:** 2026-02-14
**Version:** 3.1.0
**Status:** Complete Specification
