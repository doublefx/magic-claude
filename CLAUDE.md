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
# Run all tests (development)
node tests/run-all.cjs

# Run individual test suites (development)
node tests/lib/utils.test.cjs
node tests/lib/package-manager.test.cjs
node tests/hooks/hooks.test.cjs

# Direct script execution (development/testing)
node scripts/setup-package-manager.cjs --detect
node scripts/setup-package-manager.cjs --global pnpm
node scripts/setup-package-manager.cjs --project bun
```

## Plugin Commands (Slash Commands)

When installed as a plugin, use these slash commands:

```bash
/setup-pm          # Configure package manager
/setup-ecosystem   # Check development tools
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

## Workspace & Monorepo Support

### Workspace Infrastructure

The plugin has comprehensive monorepo/workspace support with **100% backward compatibility**.

**Workspace Detection** (`scripts/lib/workspace/detection.cjs`):
- Auto-detects: pnpm workspaces, Nx, Lerna, Yarn workspaces, Turborepo
- Discovers all packages in workspace
- Caches detection results for performance

**Multi-Ecosystem Support** (`scripts/lib/workspace/ecosystems.cjs`):
- Detects project types: nodejs, jvm, python, rust
- Per-package ecosystem identification
- Mixed-language monorepo support

**Configuration Hierarchy** (`scripts/lib/workspace/config.cjs`):
```
~/.claude/settings.json              # Global (lowest priority)
  ↓
workspace-root/.claude/settings.json # Workspace
  ↓
package-dir/.claude/settings.json    # Package (highest priority)
```

**WorkspaceContext API** (`scripts/lib/workspace-context.cjs`):
```javascript
const { getWorkspaceContext } = require('./scripts/lib/workspace-context.cjs');

const workspace = getWorkspaceContext();

// Check if in workspace
if (workspace.isWorkspace()) {
  const type = workspace.getType();    // 'pnpm-workspace', 'nx', 'lerna', etc.
  const root = workspace.getRoot();     // Workspace root directory

  // Get all packages
  const packages = workspace.getAllPackages();
  // [{ name, path, packageJson, ecosystem }, ...]

  // Find package for a file
  const pkg = workspace.findPackageForFile('/path/to/file.ts');

  // Get merged configuration (global + workspace + package)
  const config = workspace.getConfig();

  // Get package manager info
  const pm = workspace.getPackageManager();
  const pmForFile = workspace.getPackageManagerForFile('/path/to/file.ts');
}
```

**Command Generation** (`scripts/lib/workspace/commands.cjs`):
```javascript
const { CommandGenerator } = require('./scripts/lib/workspace/commands.cjs');

// Generate commands for any ecosystem
const gen = new CommandGenerator('nodejs', { packageManager: 'pnpm' });
gen.install();  // pnpm install
gen.test();     // pnpm test
gen.build();    // pnpm build

// JVM with Gradle wrapper on Windows
const jvmGen = new CommandGenerator('jvm', {
  buildTool: 'gradle',
  useWrapper: true,
  platform: 'win32'
});
jvmGen.build();  // gradlew.bat build
```

**Tool Detection** (`scripts/lib/workspace/tool-detection.cjs`):
```javascript
const { ToolDetector, checkEcosystemTools } = require('./scripts/lib/workspace/tool-detection.cjs');

const detector = new ToolDetector();
detector.isAvailable('node');        // true/false
detector.getVersion('node');         // 'v20.11.0' or null

// Check all tools for an ecosystem
const tools = checkEcosystemTools('nodejs');
// { node: true, npm: true, pnpm: true, yarn: false, bun: false }
```

**Package Manager Functions** (`scripts/lib/package-manager.cjs`):
```javascript
const {
  getPackageManager,
  isInWorkspace,
  getPackageManagerForFile,
  getAllWorkspacePackageManagers
} = require('./scripts/lib/package-manager.cjs');

// Workspace-aware functions (v2.0)
if (isInWorkspace()) {
  const allPMs = getAllWorkspacePackageManagers();
  // [{ packageName, packagePath, ecosystem, name, config, source }, ...]

  const pm = getPackageManagerForFile('/path/to/file.ts');
  // { name, config, source, package, packagePath }
}

// Original functions (v1.0) - still work unchanged
const pm = getPackageManager();
// { name, config, source }
```

### When to Use Workspace Features

**Use WorkspaceContext when**:
- Operating in monorepo/workspace
- Need package-level configuration
- Finding which package owns a file
- Working with multiple ecosystems

**Use existing functions for**:
- Single-project workflows
- Backward compatibility
- Simple package manager detection

See `docs/MIGRATION-v2.md` for complete migration guide.

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
    "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/some-hook.cjs\""
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
