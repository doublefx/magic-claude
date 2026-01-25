# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**everything-claude-code** is a Claude Code plugin repository containing battle-tested agents, skills, hooks, commands, and rules. The plugin provides specialized subagents for delegation, workflow definitions, automation hooks, and always-follow guidelines evolved over 10+ months of production use.

**Tech Stack:**
- Node.js scripts (cross-platform compatibility)
- JSON configuration files for hooks and MCP servers
- Markdown files for agents, skills, commands, and rules
- No build process - direct execution

## Development Commands

```bash
# Run all tests
node tests/run-all.js

# Run individual test suites
node tests/lib/utils.test.js
node tests/lib/package-manager.test.js
node tests/hooks/hooks.test.js

# Package manager setup (interactive)
node scripts/setup-package-manager.js --detect
node scripts/setup-package-manager.js --global pnpm
node scripts/setup-package-manager.js --project bun

# Available via /commands when installed as plugin
/setup-pm          # Configure package manager
/tdd               # Test-driven development workflow
/plan              # Implementation planning
/code-review       # Quality and security review
/build-fix         # Fix build errors
/e2e               # E2E test generation
/refactor-clean    # Dead code removal
/learn             # Extract patterns mid-session
/checkpoint        # Save verification state
/verify            # Run verification loop
```

## Architecture Overview

### Plugin Structure

The repository is structured as a Claude Code plugin with components loaded via `plugin.json`:

```
.claude-plugin/plugin.json  # Plugin metadata, points to commands/ and skills/
hooks/hooks.json            # All hook definitions (PreToolUse, PostToolUse, SessionStart, etc.)
```

All components are auto-loaded when installed via `/plugin install`.

### Cross-Platform Script System

All automation is Node.js-based (no shell scripts) for Windows/macOS/Linux compatibility:

- **scripts/lib/utils.js** - Cross-platform utilities (file operations, path handling, system detection)
- **scripts/lib/package-manager.js** - Package manager detection with 6-tier priority system
- **scripts/hooks/** - Hook implementations (session-start, session-end, pre-compact, etc.)

**Package Manager Detection Priority:**
1. `CLAUDE_PACKAGE_MANAGER` environment variable
2. Project config (`.claude/package-manager.json`)
3. `package.json` `packageManager` field
4. Lock file detection (package-lock.json, pnpm-lock.yaml, yarn.lock, bun.lockb)
5. Global user preference (`~/.claude/package-manager.json`)
6. First available package manager (priority: pnpm, bun, yarn, npm)

### Hook System

Hooks execute Node.js scripts on tool events. Key hooks in `hooks/hooks.json`:

**PreToolUse:**
- Block dev servers outside tmux (ensures log access)
- Suggest tmux for long-running commands
- Block random .md file creation (keeps docs consolidated)
- Strategic compaction suggestions

**PostToolUse:**
- Auto-format JS/TS files with Prettier
- TypeScript type checking on .ts/.tsx edits
- Warn about console.log statements
- Log PR URLs after creation

**SessionStart:**
- Load previous session context (memory persistence)
- Auto-detect package manager

**SessionEnd:**
- Persist session state
- Extract patterns for continuous learning

**PreCompact:**
- Save state before context compaction

**Stop:**
- Check for console.log in modified files

All hooks use inline Node.js via `node -e` or reference scripts in `scripts/hooks/` via `${CLAUDE_PLUGIN_ROOT}`.

### Agent Orchestration

Specialized agents in `agents/` directory:

| Agent | Model | Purpose |
|-------|-------|---------|
| planner | opus | Feature implementation planning |
| architect | opus | System design decisions |
| tdd-guide | sonnet | Test-driven development enforcement |
| code-reviewer | opus | Quality and security review |
| security-reviewer | opus | Vulnerability analysis |
| build-error-resolver | sonnet | Fix build errors |
| e2e-runner | sonnet | Playwright E2E testing |
| refactor-cleaner | haiku | Dead code cleanup |
| doc-updater | haiku | Documentation sync |

**Use agents proactively** - no user prompt needed for complex features, code reviews, or architectural decisions.

**Use parallel Task execution** for independent operations - launch multiple agents in a single message.

### Skills System

Skills define reusable workflows and domain knowledge in `skills/` directory:

- **coding-standards/** - Language best practices (TypeScript, JavaScript patterns)
- **backend-patterns/** - API design, database, caching patterns
- **frontend-patterns/** - React, Next.js patterns
- **tdd-workflow/** - Test-driven development methodology
- **security-review/** - Security checklist
- **continuous-learning/** - Auto-extract patterns from sessions (Longform Guide)
- **strategic-compact/** - Manual compaction suggestions (Longform Guide)
- **eval-harness/** - Verification loop evaluation (Longform Guide)
- **verification-loop/** - Continuous verification (Longform Guide)

Skills are directories with `SKILL.md` or single `.md` files.

## Critical Coding Rules

### Immutability (MANDATORY)

ALWAYS create new objects, NEVER mutate:

```javascript
// WRONG: Mutation
function updateUser(user, name) {
  user.name = name
  return user
}

// CORRECT: Immutability
function updateUser(user, name) {
  return { ...user, name }
}
```

### File Organization

- Many small files over few large files
- High cohesion, low coupling
- 200-400 lines typical, 800 max per file
- Organize by feature/domain, not by type

### Test-Driven Development

MANDATORY workflow:
1. Write test first (RED)
2. Run test - must FAIL
3. Write minimal implementation (GREEN)
4. Run test - must PASS
5. Refactor (IMPROVE)
6. Verify 80%+ coverage

### Security

- No hardcoded secrets or API keys
- Environment variables for sensitive data
- Validate all user inputs with Zod or similar
- Parameterized queries only
- No console.log in production code

### Error Handling

```typescript
try {
  const result = await operation()
  return { success: true, data: result }
} catch (error) {
  console.error('Operation failed:', error)
  return { success: false, error: 'User-friendly message' }
}
```

## Testing Requirements

- **Minimum coverage:** 80%
- **Unit tests:** Individual functions, utilities
- **Integration tests:** API endpoints, database operations
- **E2E tests:** Critical user flows (Playwright)

Use **tdd-guide** agent proactively for new features to enforce write-tests-first workflow.

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- GPG-signed commits with co-authorship:
  ```
  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
  ```
- Never commit console.log statements (hooks will warn)
- Never commit hardcoded secrets

## Key Patterns

### Hook Implementation Pattern

Hooks are defined in `hooks/hooks.json` with:
- **matcher:** CEL expression to match tool/event
- **hooks:** Array of command objects with inline Node.js or script references
- **description:** Human-readable explanation

Example:
```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx)$\"",
  "hooks": [{
    "type": "command",
    "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/some-hook.js\""
  }],
  "description": "What this hook does"
}
```

### Agent Definition Pattern

Agents have YAML frontmatter:
```markdown
---
name: agent-name
description: What it does
tools: Read, Grep, Glob, Bash
model: opus
---

Instructions here...
```

### Skill Definition Pattern

Skills are directories with `SKILL.md` containing:
- When to use
- How it works
- Examples
- Step-by-step workflow

## File Conventions

- Lowercase with hyphens: `code-reviewer.md`, `tdd-workflow/`
- Descriptive names: `build-error-resolver.md` not `error.md`
- Match agent/skill name to filename

## Context Window Management

Don't enable all MCPs at once - context window shrinks dramatically.

**Rule of thumb:**
- Have 20-30 MCPs configured
- Keep under 10 enabled per project
- Under 80 tools active

Use `disabledMcpServers` in project `.claude/project.json` to disable unused ones.

## Important Notes

- This is a **plugin repository**, not an application - components are designed for installation into Claude Code
- All scripts are cross-platform (Windows, macOS, Linux)
- Hooks use `${CLAUDE_PLUGIN_ROOT}` environment variable to locate plugin scripts
- Tests are simple assertion-based (no external test framework)
- No build step required - all files run directly
