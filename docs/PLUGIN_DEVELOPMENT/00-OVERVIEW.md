# Claude Code Plugin Development - Complete Guide

## Overview

This documentation provides comprehensive guidance for developing Claude Code plugins. Claude Code plugins extend the AI assistant with custom commands, agents, skills, hooks, and automation rules.

**Key Features:**
- Slash commands for user-triggered actions
- Subagents with specialized models and tools
- Reusable skills with progressive disclosure
- Event-driven hooks for automation
- Custom rules and configurations
- Cross-platform compatibility (Windows, macOS, Linux)

## Quick Start

### 1. Basic Structure
```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata
├── commands/                # Slash commands
├── agents/                  # Specialized subagents
├── skills/                  # Reusable workflows
├── hooks/
│   └── hooks.json          # Event automation
└── rules/                  # Custom guidelines
```

### 2. Create Your First Command
```yaml
---
description: What this command does
---

# Command Name

Instructions for Claude when running this command...
```

### 3. Create Your First Agent
```markdown
---
name: agent-name
description: Expert in [domain]
tools: Read, Grep, Glob, Bash
model: opus
---

You are an expert in [domain].

Your responsibilities:
- Task 1
- Task 2
```

### 4. Create Your First Skill
```
skills/my-skill/
├── SKILL.md
└── config.json (optional)
```

### 5. Add a Hook
```json
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"npm install\"",
  "hooks": [{
    "type": "command",
    "command": "node -e \"console.error('[Hook] Installing dependencies')\""
  }],
  "description": "Notify when installing dependencies"
}
```

## Table of Contents

| Document | Purpose | Audience |
|----------|---------|----------|
| **01-COMMANDS-SKILLS.md** | Create slash commands and reusable workflows | Developers building user-facing features |
| **02-AGENTS.md** | Design specialized subagents with different models | Developers delegating complex tasks |
| **03-HOOKS.md** | Automate workflows with event triggers | Developers adding automation |
| **04-PLUGIN-STRUCTURE.md** | Understand plugin architecture and layout | All plugin developers |
| **05-BEST-PRACTICES.md** | Follow proven patterns and security rules | All plugin developers |
| **06-EXAMPLES.md** | See real-world examples from this repo | Learning and reference |

## Key Concepts

### Commands (Slash Commands)
User-triggered actions that run when user types `/command-name`. Can be markdown files with frontmatter or Node.js scripts.

```
/setup-pm          # Configure package manager
/code-review       # Quality and security review
/tdd               # Test-driven development
/plan              # Implementation planning
```

### Agents (Subagents)
Specialized AI assistants with specific models, tools, and instructions. Can be invoked directly or delegated to.

```
planner (opus)           → Feature planning
code-reviewer (opus)     → Code quality
tdd-guide (sonnet)       → Test-driven development
refactor-cleaner (haiku) → Dead code removal
```

### Skills
Reusable domain knowledge and workflows that provide detailed guidance. Activated by users or other components.

```
tdd-workflow/            → TDD methodology
security-review/         → Security checklist
coding-standards/        → Language best practices
backend-patterns/        → API design patterns
```

### Hooks
Automated actions triggered on tool events (Pre/Post, Session Start/End, etc.). Execute Node.js for side effects without blocking.

```
PreToolUse    → Before tool execution (can block)
PostToolUse   → After tool execution (side effects)
SessionStart  → New session begins
SessionEnd    → Session ending
PreCompact    → Before context compaction
Stop          → Before response sent
```

### Rules
Custom guidelines and conventions for the project. Stored in `rules/` directory as markdown files.

## Model Selection Guide

| Model | Use Case | Speed | Cost | Reasoning |
|-------|----------|-------|------|-----------|
| **Opus** | Complex planning, architecture, security | Slowest | Highest | Max reasoning for difficult decisions |
| **Sonnet** | Feature implementation, code review | Medium | Medium | Best balance of speed and capability |
| **Haiku** | Simple tasks, quick fixes, worker agents | Fastest | Lowest | 90% of Sonnet capability |

**Strategy:** Use Haiku for frequent operations, Sonnet for main work, Opus for complex decisions.

## Plugin Metadata (plugin.json)

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": { "name": "Your Name" },
  "commands": "./commands",
  "skills": "./skills"
}
```

## Installation and Usage

### Install as Plugin
```bash
/plugin install /path/to/my-plugin
```

### Use Commands
```
/command-name --option value
```

### Invoke Agents
Directly mention agent name or use in delegated tasks.

### Activate Skills
Reference skill name in skill documentation or tool descriptions.

## Common Patterns

### Pattern 1: Command → Agent → Code Implementation
```
User types /plan
↓
planner agent creates implementation plan
↓
User confirms plan
↓
Developer implements with /tdd
```

### Pattern 2: Hook → Side Effect
```
Tool execution happens
↓
Hook matcher evaluates
↓
Node.js script runs (non-blocking)
↓
Side effect completes
```

### Pattern 3: Skill-Guided Workflow
```
User activates /tdd skill
↓
Skill provides detailed TDD methodology
↓
Developer follows steps
↓
Test-driven development enforced
```

## File Naming Conventions

| Type | Convention | Examples |
|------|-----------|----------|
| Commands | lowercase-with-hyphens.md | `setup-pm.md`, `code-review.md` |
| Agents | lowercase-with-hyphens.md | `tdd-guide.md`, `security-reviewer.md` |
| Skills | kebab-case-folder/SKILL.md | `tdd-workflow/SKILL.md` |
| Hooks | hooks.json | Single file for all hooks |
| Rules | lowercase-with-hyphens.md | `coding-style.md`, `git-workflow.md` |

## Cross-Platform Considerations

- Use Node.js for scripts (not bash)
- All file paths must be absolute or relative to `${CLAUDE_PLUGIN_ROOT}`
- Test on Windows, macOS, and Linux
- Use `child_process` for shell commands

## Context and Performance

**Best Practices:**
- Use specific, focused tools
- Avoid loading all MCPs at once
- Keep hook execution fast (< 1 second)
- Use `disabledMcpServers` to manage context

**Rule of Thumb:**
- 20-30 MCPs configured
- < 10 enabled per project
- < 80 total tools active

## Next Steps

1. **Start simple:** Create a basic command
2. **Add an agent:** Build a specialized assistant
3. **Test thoroughly:** Verify on all platforms
4. **Add hooks:** Automate common workflows
5. **Document well:** Write clear descriptions
6. **Share:** Contribute to the community

## Resources

- [Commands & Skills](./01-COMMANDS-SKILLS.md) - Detailed reference
- [Agents](./02-AGENTS.md) - Agent configuration guide
- [Hooks](./03-HOOKS.md) - Hook system reference
- [Plugin Structure](./04-PLUGIN-STRUCTURE.md) - Architecture details
- [Best Practices](./05-BEST-PRACTICES.md) - Proven patterns
- [Examples](./06-EXAMPLES.md) - Real-world implementations

## Support

For questions or issues:
1. Check the relevant documentation file
2. Review examples in this repository
3. Search the codebase for similar patterns
4. Refer to Claude Code official documentation

---

**Last Updated:** 2025-01-27
**Version:** 2.0.0
**License:** MIT
