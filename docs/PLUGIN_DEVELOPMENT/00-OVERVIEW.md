# Claude Code Plugin Development - Complete Specifications Guide

## Overview

This documentation provides COMPREHENSIVE, EXHAUSTIVE guidance for developing Claude Code plugins. Claude Code plugins extend the AI assistant with custom commands, agents, skills, hooks, and automation rules.

**Plugin Components:**
- **Slash Commands** - User-triggered actions with optional script execution
- **Agents** - Specialized AI subagents with custom models, tools, and skills
- **Skills** - Reusable domain knowledge and workflows
- **Hooks** - Event-driven automation on tool execution and session lifecycle
- **Rules** - Project-specific guidelines and conventions
- **Plugin Manifest** - Central configuration (plugin.json)

## Quick Architecture

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json              # Plugin metadata and manifest
├── commands/                    # Slash commands (markdown or Node.js)
│   ├── command1.md             # Markdown-based command
│   └── script-command.cjs       # Node.js-based command
├── agents/                      # Specialized subagents
│   └── agent-name.md           # Agent with custom model/tools
├── skills/                      # Reusable workflows
│   └── skill-name/
│       ├── SKILL.md            # Skill content
│       └── config.json         # Optional skill config
├── hooks/
│   └── hooks.json              # Event automation rules
└── rules/                       # Project guidelines
    └── guideline-name.md
```

## Plugin Metadata (plugin.json)

Complete schema with ALL fields and options.

**File:** `.claude-plugin/plugin.json`

### All Plugin Fields

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "Human-readable plugin description",
  "author": {
    "name": "Author Name",
    "email": "email@example.com",
    "url": "https://github.com/username"
  },
  "license": "MIT",
  "homepage": "https://github.com/username/plugin-name",
  "repository": "https://github.com/username/plugin-name",
  "keywords": ["keyword1", "keyword2"],
  "commands": "./commands",
  "skills": "./skills",
  "agents": "./agents",
  "rules": "./rules",
  "hooks": "./hooks",
  "engines": {
    "claude-code": ">=1.0.0"
  }
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Plugin identifier (lowercase, hyphens only, unique) |
| `version` | string | Yes | Semantic versioning (e.g., "1.0.0", "2.3.4-beta") |
| `description` | string | Yes | One-line description shown in plugin marketplace |
| `author` | object | No | Plugin creator details (name, email, url) |
| `license` | string | No | License type (MIT, Apache-2.0, GPL-3.0, etc.) |
| `homepage` | string | No | Project homepage URL |
| `repository` | string | No | Repository URL (GitHub, GitLab, etc.) |
| `keywords` | array[string] | No | Search keywords (5-10 items recommended) |
| `commands` | string | No | Path to commands directory (default: "./commands") |
| `skills` | string | No | Path to skills directory (default: "./skills") |
| `agents` | string | No | Path to agents directory (default: "./agents") |
| `rules` | string | No | Path to rules directory (default: "./rules") |
| `hooks` | string | No | Path to hooks.json file (default: "./hooks/hooks.json") |
| `engines` | object | No | Version requirements (claude-code minimum version) |

## Component Overview Table

| Component | Purpose | File Format | Activation | Model Control |
|-----------|---------|-------------|-----------|---|
| **Commands** | User-triggered actions | `.md` or `.cjs` | User types `/name` | Claude (or disabled) |
| **Agents** | Specialized assistants | `.md` only | User mentions or delegation | Custom per-agent |
| **Skills** | Reusable knowledge | `/SKILL.md` or `.md` | Referenced explicitly | Claude (guidance) |
| **Hooks** | Event automation | `hooks.json` | Event trigger | Node.js only |
| **Rules** | Project guidelines | `.md` | Auto-loaded into context | Claude (guidance) |

## Component Field Summary

### Commands
- **Frontmatter Fields:** `description`, `command`, `disable-model-invocation`
- **Execution:** Markdown reads followed by Claude instructions OR pure Node.js script
- **Variable Support:** `${CLAUDE_PLUGIN_ROOT}`, command arguments

### Agents
- **Frontmatter Fields:** `name`, `description`, `tools`, `model`
- **Optional Fields:** `skills` (preload into context), `hooks` (trigger hooks)
- **Models:** `opus`, `sonnet`, `haiku`
- **Tools:** Subset of built-in tools (Read, Bash, Edit, etc.)

### Skills
- **Frontmatter Fields:** `name`, `description`
- **Optional Fields:** `context` (fork behavior)
- **Structure:** Directory-based with SKILL.md or single .md file
- **Activation:** Explicit reference or `context: fork`

### Hooks
- **Trigger Events:** PreToolUse, PostToolUse, SessionStart, SessionEnd, PreCompact, Stop
- **Key Fields:** `matcher` (CEL expression), `hooks` (command array), `description`
- **Execution:** Node.js scripts with stdin/stdout JSON
- **Blocking:** Only PreToolUse can block execution

### Plugin.json
- **Location:** `.claude-plugin/plugin.json`
- **Purpose:** Central metadata registry
- **Usage:** Auto-discovery of components
- **${CLAUDE_PLUGIN_ROOT}:** Environment variable for absolute paths

## Key Concepts in Detail

### Variable Substitution

**Environment Variables Available in All Components:**

| Variable | Value | Availability | Example |
|----------|-------|---------------|---------|
| `${CLAUDE_PLUGIN_ROOT}` | Absolute plugin directory path | Commands, Hooks, Scripts | `${CLAUDE_PLUGIN_ROOT}/scripts/setup.js` |
| `${CLAUDE_SESSION_ID}` | Unique session identifier | Commands, Hooks | Log/cache file naming |
| Command Arguments | `$0`, `$1`, `$2`... | Markdown commands | User-provided arguments |
| `$ARGUMENTS` | Full argument string | Markdown commands | Pass all args to script |

**Usage Examples:**
```markdown
---
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-pm.cjs" $ARGUMENTS
---
```

### Context Fork for Skills

**What is `context: fork`?**

When a skill is activated with `context: fork`, the skill content is injected into a forked context:
- AI assistant gets skill content in system prompt
- Separate from main conversation context
- Enables skill guidance without losing current context
- Used for long-form instructions (patterns, methodologies)

**When to Use:**
- Long-form guides (>500 lines)
- Domain-specific workflows
- Progressive disclosure
- Reference documentation

### Command Types

**Type 1: Pure Markdown** (Claude-driven)
- Description in frontmatter
- Markdown body = instructions for Claude
- Claude reads and interprets
- Good for: Guidance, walkthroughs, decision trees

**Type 2: Script-Driven** (disable-model-invocation: true)
- Pure Node.js execution
- No Claude interpretation
- Fast, non-blocking
- Good for: Setup, detection, configuration

**Type 3: Hybrid** (disable-model-invocation: false, command present)
- Frontmatter command executes FIRST
- Claude reads body AFTER
- Combine output with markdown guidance
- Good for: Setup with context

### Agent Models and Cost

| Model | Tokens/Cost | Latency | Best For | Use When |
|-------|------------|---------|----------|----------|
| **opus** | Highest cost | Slowest | Complex reasoning, architecture | Planning, security review, deep analysis |
| **sonnet** | Medium cost | Medium | Balanced capability | Feature implementation, code generation |
| **haiku** | ~1/3 cost of sonnet | Fast | Simple tasks, high frequency | Worker agents, quick fixes, bulk operations |

**Strategy:**
- Default to Sonnet for main work
- Use Opus for complex decisions (architecture, security)
- Use Haiku for frequent, simple operations

### Permission Modes (Future/Advanced)

While not currently documented in this version, permission modes control agent capabilities:
- **read** - Can read files
- **write** - Can create/modify files
- **execute** - Can run commands
- **network** - Can access external services

### Hook Input/Output JSON

**PreToolUse Input:**
```json
{
  "tool": "Edit",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "old_string": "...",
    "new_string": "..."
  }
}
```

**Hook Script Stdin:** Same as above (passed as JSON)

**Hook Script Output:** Exit code determines behavior
- `exit(0)` = Continue execution
- `exit(1)` = Block execution (PreToolUse only)

**PostToolUse Input Includes:**
```json
{
  "tool": "Bash",
  "tool_input": { "command": "npm test" },
  "tool_output": { "output": "...", "error": "" }
}
```

## Installation and Usage

### Install Plugin
```bash
/plugin install /path/to/my-plugin
```

### Use Commands
```bash
/command-name --option value
/command-name --option value another
```

### Invoke Agents
- Mention by name: "Use the code-reviewer agent"
- Direct invocation: Agent name appears in available agents
- Delegation: Use in task commands

### Activate Skills
- Reference in context: "Use security-review skill"
- Implicit activation: Some commands auto-activate related skills
- Explicit invocation: User can request skill activation

## Best Practices Summary

| Category | Practice |
|----------|----------|
| **Naming** | lowercase-with-hyphens for all files/folders |
| **File Size** | Commands/Agents/Skills < 800 lines typical |
| **Hooks** | Keep execution < 1 second |
| **Context** | Don't enable all MCPs simultaneously |
| **Testing** | Test on Windows, macOS, Linux |
| **Security** | No hardcoded secrets in plugins |
| **Documentation** | Clear descriptions and examples |

## File Naming Conventions

| Type | Convention | Examples |
|------|-----------|----------|
| Commands | `lowercase-with-hyphens.md/.cjs` | `setup-pm.md`, `build-fix.cjs` |
| Agents | `lowercase-with-hyphens.md` | `code-reviewer.md`, `tdd-guide.md` |
| Skills | `kebab-case-folder/SKILL.md` | `tdd-workflow/SKILL.md`, `security-review/SKILL.md` |
| Hooks | `hooks/hooks.json` | Single file for all hooks |
| Rules | `lowercase-with-hyphens.md` | `coding-style.md`, `git-workflow.md` |

## Cross-Platform Considerations

**Critical Rules:**
- Use Node.js for scripts (NOT bash/shell)
- All file paths must be absolute or use `${CLAUDE_PLUGIN_ROOT}`
- Test on Windows, macOS, and Linux
- Use `path.resolve()` for path operations
- Use `child_process` for shell commands

**Example (Correct):**
```javascript
const path = require('path');
const scriptPath = path.join(process.env.CLAUDE_PLUGIN_ROOT, 'scripts', 'setup.js');
```

**Example (Incorrect):**
```bash
#!/bin/bash
# DON'T USE - Won't work on Windows
npm run setup
```

## Context Window Management

**MCPs (Model Context Protocol):**
- Each MCP consumes token budget
- Having 20-30 MCPs configured is normal
- Keep < 10 active per project
- Use `disabledMcpServers` in `.claude/project.json`

**Recommendation:**
```json
{
  "disabledMcpServers": ["unused-mcp-1", "unused-mcp-2"]
}
```

## Document Navigation

| Document | Focus | Audience |
|----------|-------|----------|
| **01-COMMANDS-SKILLS.md** | Command and skill creation | Feature developers |
| **02-AGENTS.md** | Agent design and configuration | Task delegation designers |
| **03-HOOKS.md** | Event automation and scripts | Automation engineers |
| **04-PLUGIN-STRUCTURE.md** | Architecture and layout | All plugin developers |
| **05-BEST-PRACTICES.md** | Patterns and security | Advanced developers |
| **06-EXAMPLES.md** | Real-world implementations | Learning and reference |

## Next Steps

1. Start with [01-COMMANDS-SKILLS.md](./01-COMMANDS-SKILLS.md) to create your first command
2. Design agents in [02-AGENTS.md](./02-AGENTS.md) for specialized tasks
3. Automate workflows in [03-HOOKS.md](./03-HOOKS.md)
4. Understand architecture in [04-PLUGIN-STRUCTURE.md](./04-PLUGIN-STRUCTURE.md)
5. Follow patterns in [05-BEST-PRACTICES.md](./05-BEST-PRACTICES.md)
6. Study examples in [06-EXAMPLES.md](./06-EXAMPLES.md)

---

**Last Updated:** 2025-01-27
**Version:** 2.0.0
**Status:** Complete Specification
**License:** MIT
