# Plugin Structure - Architecture Reference

## Directory Layout

A complete Claude Code plugin follows this directory structure:

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest and metadata
├── commands/                    # Slash commands (/command-name)
│   ├── setup.md                 # Markdown-based command
│   ├── another.md               # Another command
│   └── script-command.cjs       # Node.js script command
├── agents/                      # Specialized subagents
│   ├── planner.md               # Planning agent (Opus)
│   ├── code-reviewer.md         # Code review agent (Opus)
│   └── tdd-guide.md             # TDD guide agent (Sonnet)
├── skills/                      # Reusable workflows and knowledge
│   ├── tdd-workflow/            # Complex skill with config
│   │   ├── SKILL.md             # Main skill content
│   │   ├── config.json          # Optional configuration
│   │   └── templates/           # Optional templates
│   │       ├── test-template.md
│   │       └── impl-template.md
│   ├── coding-standards.md      # Simple single-file skill
│   └── security-review/         # Another complex skill
│       └── SKILL.md
├── hooks/                       # Event automation
│   └── hooks.json               # All hook definitions
├── rules/                       # Custom guidelines (optional)
│   ├── coding-style.md          # Code style guide
│   ├── git-workflow.md          # Git conventions
│   └── performance.md           # Performance guidelines
├── contexts/                    # MCP contexts (optional)
│   └── context-name.json        # Context configuration
├── mcp-configs/                 # MCP server configs (optional)
│   ├── server1.json
│   └── server2.json
├── templates/                   # Project templates (optional)
│   ├── node-app/
│   │   ├── package.json.template
│   │   └── src/
│   │       └── index.js.template
│   └── python-app/
│       └── main.py.template
├── scripts/                     # Utility scripts (optional)
│   ├── setup.js                 # Setup script
│   └── lib/
│       └── utility.js           # Shared utilities
├── docs/                        # Additional documentation (optional)
│   ├── GUIDES.md
│   └── API.md
├── tests/                       # Tests for plugin (optional)
│   ├── commands.test.js
│   └── agents.test.js
├── package.json                 # Node.js package metadata
├── README.md                    # Plugin documentation
├── CONTRIBUTING.md              # Contribution guidelines
└── LICENSE                      # License file
```

## Core Files

### plugin.json (Required)

Plugin manifest file that tells Claude Code about your plugin.

**Location:** `.claude-plugin/plugin.json`

**Structure:**
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": {
    "name": "Your Name",
    "email": "your@email.com",
    "url": "https://github.com/yourname"
  },
  "homepage": "https://github.com/yourname/my-plugin",
  "repository": "https://github.com/yourname/my-plugin",
  "license": "MIT",
  "keywords": ["claude-code", "plugin", "productivity"],
  "commands": "./commands",
  "skills": "./skills",
  "agents": "./agents",
  "hooks": "./hooks/hooks.json",
  "rules": "./rules",
  "contexts": "./contexts",
  "mcp-configs": "./mcp-configs"
}
```

**Fields Explained:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique plugin identifier (lowercase, no spaces) |
| `version` | string | Yes | Semantic version (1.0.0) |
| `description` | string | Yes | One-line plugin description |
| `author` | object | No | Author information |
| `homepage` | string | No | Plugin home page URL |
| `repository` | string | No | Repository URL (GitHub preferred) |
| `license` | string | No | License identifier (MIT, Apache-2.0, etc.) |
| `keywords` | array | No | Tags for discovery |
| `commands` | string | No | Path to commands directory |
| `skills` | string | No | Path to skills directory |
| `agents` | string | No | Path to agents directory |
| `hooks` | string | No | Path to hooks.json file |
| `rules` | string | No | Path to rules directory |
| `contexts` | string | No | Path to contexts directory |
| `mcp-configs` | string | No | Path to MCP configs directory |

**Complete Example:**
```json
{
  "name": "everything-claude-code",
  "version": "2.0.0-enterprise",
  "description": "Enterprise Stack Extension - Complete collection of battle-tested Claude Code configs with Python, Java, Kotlin, Maven, Gradle, and CI/CD pipeline support",
  "author": {
    "name": "Affaan Mustafa (Original) + doublefx (Enterprise Extension)",
    "url": "https://github.com/doublefx"
  },
  "homepage": "https://github.com/doublefx/everything-claude-code",
  "repository": "https://github.com/doublefx/everything-claude-code",
  "license": "MIT",
  "keywords": [
    "claude-code",
    "agents",
    "skills",
    "hooks",
    "commands",
    "rules",
    "tdd",
    "code-review",
    "security",
    "python",
    "java",
    "kotlin",
    "gradle",
    "maven",
    "ci-cd"
  ],
  "commands": "./commands",
  "skills": "./skills"
}
```

### hooks.json (Optional but Recommended)

Event automation configuration.

**Location:** `hooks/hooks.json`

**Structure:**
```json
{
  "hooks": {
    "PreToolUse": [ /* hooks */ ],
    "PostToolUse": [ /* hooks */ ],
    "SessionStart": [ /* hooks */ ],
    "SessionEnd": [ /* hooks */ ],
    "PreCompact": [ /* hooks */ ],
    "Stop": [ /* hooks */ ]
  }
}
```

See [Hooks Documentation](./03-HOOKS.md) for complete reference.

## Commands Directory

Slash commands that users invoke directly.

```
commands/
├── setup.md               # /setup command
├── review.md              # /review command
├── tdd.md                 # /tdd command
└── install.cjs            # Node.js command
```

**File Naming:** `kebab-case.md` or `kebab-case.cjs`

**Auto-Discovery:** All `.md` files are automatically detected as commands.

See [Commands & Skills Documentation](./01-COMMANDS-SKILLS.md) for complete reference.

## Agents Directory

Specialized AI assistants with specific expertise.

```
agents/
├── planner.md             # Feature planning (Opus)
├── code-reviewer.md       # Code review (Opus)
├── tdd-guide.md           # TDD workflow (Sonnet)
├── security-reviewer.md   # Security analysis (Opus)
└── refactor-cleaner.md    # Code cleanup (Haiku)
```

**File Naming:** `kebab-case.md`

**Auto-Discovery:** All `.md` files are automatically detected as agents.

**Model Assignment:** Each agent specifies `model: opus|sonnet|haiku` in frontmatter.

See [Agents Documentation](./02-AGENTS.md) for complete reference.

## Skills Directory

Reusable domain knowledge and workflows.

```
skills/
├── tdd-workflow/
│   ├── SKILL.md           # Main content
│   ├── config.json        # Optional config
│   └── templates/
│       ├── unit-test.md
│       └── integration-test.md
├── coding-standards/
│   ├── SKILL.md
│   ├── typescript.md      # Sub-file
│   ├── javascript.md      # Sub-file
│   └── python.md          # Sub-file
└── security-review.md     # Simple single-file
```

**Directory Types:**
- **Complex Skills:** `skills/skill-name/SKILL.md` (with optional config.json and templates)
- **Simple Skills:** `skills/skill-name.md` (single file)

**Auto-Discovery:**
- Directories with `SKILL.md` are discovered as skills
- `.md` files in skills directory are discovered as skills

See [Commands & Skills Documentation](./01-COMMANDS-SKILLS.md) for complete reference.

## Rules Directory

Custom guidelines and conventions for the project.

```
rules/
├── coding-style.md        # Code style guidelines
├── git-workflow.md        # Git conventions
├── performance.md         # Performance guidelines
└── security.md            # Security best practices
```

**Purpose:** Provide project-specific guidance that's referenced in agents and skills.

**File Naming:** `kebab-case.md`

**Content Examples:**
- Code formatting and style
- Naming conventions
- Git commit messages
- Testing requirements
- Performance targets
- Security standards

Rules are not auto-executed but are referenced in CLAUDE.md or other configuration.

## Optional Directories

### Contexts Directory

Model Context Protocol (MCP) context definitions.

```
contexts/
├── my-context.json
└── another-context.json
```

See Claude Code MCP documentation for details.

### MCP Configs Directory

MCP server configurations.

```
mcp-configs/
├── github.json
├── filesystem.json
└── custom-server.json
```

### Templates Directory

Project templates for initialization.

```
templates/
├── node-app/
│   ├── package.json.template
│   ├── .gitignore.template
│   └── src/
│       └── index.js.template
├── python-app/
│   ├── pyproject.toml.template
│   └── main.py.template
└── go-app/
    ├── go.mod.template
    └── main.go.template
```

### Scripts Directory

Utility scripts for plugin operations.

```
scripts/
├── setup.js               # Plugin setup
├── validate.js            # Validation
└── lib/
    ├── utils.js
    └── helpers.js
```

### Docs Directory

Additional documentation.

```
docs/
├── GUIDES.md              # How-to guides
├── API.md                 # API reference
├── EXAMPLES.md            # Code examples
└── MIGRATION.md           # Migration guide
```

### Tests Directory

Plugin tests.

```
tests/
├── commands.test.js
├── agents.test.js
├── skills.test.js
└── hooks.test.js
```

## Required Root Files

### package.json

Node.js package metadata.

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "main": "index.js",
  "scripts": {
    "test": "node tests/run-all.js",
    "lint": "eslint ."
  },
  "keywords": ["claude-code"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {},
  "devDependencies": {}
}
```

### README.md

Plugin documentation and installation instructions.

```markdown
# My Plugin

Plugin description.

## Features

- Feature 1
- Feature 2

## Installation

```
/plugin install /path/to/my-plugin
```

## Usage

### Commands

- `/command1` - Description
- `/command2` - Description

### Agents

- `agent-name` - Description

### Skills

- `skill-name` - Description

## Configuration

...

## Contributing

...
```

### LICENSE

Open source license file.

```
MIT License

Copyright (c) 2025 Your Name

...
```

## Auto-Discovery Behavior

Claude Code automatically discovers components from plugin.json paths:

| Component | File Pattern | Discovery |
|-----------|--------------|-----------|
| **Commands** | `commands/*.md` | All `.md` files |
| **Agents** | `agents/*.md` | All `.md` files |
| **Skills** | `skills/**/SKILL.md` or `skills/*.md` | Directory with SKILL.md or top-level .md |
| **Hooks** | `hooks/hooks.json` | Single file |
| **Rules** | `rules/*.md` | All `.md` files (referenced, not auto-activated) |

### No Manual Registration Needed

When you add a new file to `commands/`, `agents/`, or `skills/`, it's automatically available without updating any configuration!

## Plugin Installation

### From Repository

```bash
/plugin install /path/to/plugin-directory
```

### From GitHub

```bash
/plugin install https://github.com/username/plugin-repo
```

### From Marketplace

```bash
/plugin search "keyword"
/plugin install marketplace-plugin-name
```

## Plugin Configuration

### Global Plugin Settings

Users can configure plugin-wide settings in:
```
~/.claude/plugins/my-plugin/settings.json
```

### Project-Specific Settings

Plugins can store project settings in:
```
.claude/plugins/my-plugin/config.json
```

## Size and Performance Considerations

### Plugin Size
- **Minimal:** 10-20 KB (basic commands)
- **Small:** 50-100 KB (commands + skills)
- **Medium:** 100-500 KB (agents + skills + hooks)
- **Large:** 500KB+ (comprehensive plugin)

### Context Window Impact

Each plugin component uses context:
- **Command:** 1-5 KB (description only)
- **Agent:** 5-20 KB (instructions + tools)
- **Skill:** 10-50 KB (detailed guidance)
- **Hook:** 0.5-2 KB (metadata only)

Keep enabled MCPs under 80 total tools to avoid context bloat.

## Cross-Platform Compatibility

### File Paths
- Use forward slashes: `./commands/setup.md`
- Use `${CLAUDE_PLUGIN_ROOT}` for absolute paths
- Never use Windows-specific paths

### Scripts
- Use Node.js for all scripts (not bash/shell)
- Use `child_process` for system commands
- Test on Windows, macOS, and Linux

### File Encoding
- Use UTF-8 encoding for all files
- Avoid platform-specific line endings (use LF)

## Validation Checklist

Before releasing your plugin:

- [ ] `plugin.json` is valid JSON with required fields
- [ ] All referenced paths exist
- [ ] Commands have clear descriptions
- [ ] Agents have name, description, model
- [ ] Skills have structured content
- [ ] Hooks have valid CEL matchers
- [ ] No hardcoded paths (use ${CLAUDE_PLUGIN_ROOT})
- [ ] No console.log in production code
- [ ] README.md is comprehensive
- [ ] LICENSE file is present
- [ ] Tested on Windows, macOS, Linux
- [ ] Package.json is valid JSON
- [ ] No sensitive data in config files

## Example Plugin Structure

Here's a complete minimal plugin:

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   └── hello.md
├── agents/
│   └── my-agent.md
├── hooks/
│   └── hooks.json
├── README.md
├── LICENSE
└── package.json
```

**plugin.json:**
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My first plugin",
  "author": { "name": "Your Name" },
  "license": "MIT",
  "commands": "./commands",
  "skills": "./skills"
}
```

**commands/hello.md:**
```markdown
---
description: Say hello
---

# Hello Command

Greets the user with a friendly message.

Hello! How can I help you today?
```

**agents/my-agent.md:**
```markdown
---
name: my-agent
description: Helpful assistant
model: sonnet
tools: Read, Bash
---

You are a helpful assistant. Help the user with their tasks.
```

**hooks/hooks.json:**
```json
{
  "hooks": {}
}
```

## Publishing Your Plugin

### To GitHub

1. Create repository
2. Add all plugin files
3. Update README with installation instructions
4. Tag with semantic version: `git tag v1.0.0`
5. Share repository URL

### To Claude Code Marketplace

(When available)

1. Publish to GitHub first
2. Submit to marketplace
3. Wait for review
4. Plugin appears in `/plugin search`

## Versioning

Use semantic versioning:

- **MAJOR.MINOR.PATCH** (e.g., 1.0.0)
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

Update version in:
- `plugin.json`
- `package.json`
- Git tag (v1.0.0)
- Release notes

---

**Last Updated:** 2025-01-27
**Version:** 2.0.0
