# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**magic-claude** is a Claude Code plugin repository containing battle-tested agents, skills, hooks, commands, and rules. The plugin provides specialized subagents for delegation, workflow definitions, automation hooks, and always-follow guidelines evolved over 10+ months of production use.

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
# Setup & Configuration
/setup             # Complete automated setup (RECOMMENDED for first-time)
/setup-pm          # Package manager only (when switching npm→pnpm, etc.)
/setup-ecosystem   # Workspace & tools only (for monorepo initialization)
/setup-rules       # Install plugin rules to ~/.claude/rules/

# Development Workflow
/tdd               # Test-driven development workflow
/plan              # Implementation planning
/code-review       # Quality and security review
/build-fix         # Fix build errors
/e2e               # E2E test generation
/refactor-clean    # Dead code removal
/orchestrate       # Sequential multi-agent workflow
/test-coverage     # Analyze and fill test coverage gaps
/ci-cd             # CI/CD pipeline generation

# Documentation
/update-docs       # Sync docs from source-of-truth

# Learning & Verification
/learn             # Extract patterns mid-session
/checkpoint        # Save verification state
/verify            # Run verification loop
/eval              # Eval-driven development workflow

# Plugin Extension
/extend            # Generate new plugin components (agents, skills, hooks, commands, rules)

# Serena Integration (if Serena MCP installed)
/serena-setup      # Complete Serena configuration
/serena-status     # Configuration diagnostics
/serena-cleanup    # Safe cleanup and removal
/git-sync          # Analyze git changes and report impact
```

### Setup Command Decision Guide

**First-time setup?** → Use `/setup` or ask "setup everything for this project"

**Specific needs?** → Use granular commands:
- Switching package managers (npm → pnpm) → `/setup-pm --global pnpm`
- Checking package manager detection → `/setup-pm --detect`
- Initialize monorepo workspace → `/setup-ecosystem --detect`
- Check installed dev tools → `/setup-ecosystem --check nodejs`

**Think:** `/setup` = convenience (does everything), others = granular control (specific tasks)

## Architecture Overview

### Plugin Structure

The repository is structured as a Claude Code plugin with components loaded via `plugin.json`:

```
.claude-plugin/plugin.json  # Plugin metadata, points to commands/ and skills/
hooks/hooks.json            # All hook definitions (PreToolUse, PostToolUse, SessionStart, etc.)
```

All components are auto-loaded when installed via `/plugin install`.

### Ecosystem Registry (Auto-Discovery)

Ecosystem modules are the **single source of truth** for all language/platform metadata. The registry auto-discovers modules by scanning directories at three levels:

| Priority | Level | Path |
|----------|-------|------|
| 1 (base) | Plugin | `scripts/lib/ecosystems/` |
| 2 | User | `~/.claude/ecosystems/` |
| 3 (wins) | Project | `./.claude/ecosystems/` |

Later levels override earlier ones. Adding a new ecosystem (e.g., Go) requires only dropping a single `.cjs` file into any `ecosystems/` directory. The file must export a class extending `Ecosystem` from `types.cjs`.

Each ecosystem module is self-describing — it declares tools, version commands, installation help, setup categories, debug patterns, project sub-types, and config-aware command generation. All consumers (tool-detection, commands, setup scripts, hook scripts) aggregate metadata from the registry instead of maintaining hardcoded maps.

Key exports from `scripts/lib/ecosystems/index.cjs`:
- `getEcosystem(type, config)` — Get an instance by type
- `detectEcosystem(dir)` — Detect ecosystem from directory indicators
- `getRegistry()` — Full registry map
- `getEcosystemDirs()` — Discovery directories
- `getAllDebugPatterns()`, `getAllProjectSubTypes()`, `getAllEcosystemTools()`, etc.

### Cross-Platform Script System

All automation is Node.js-based (no shell scripts) for Windows/macOS/Linux compatibility:

- **scripts/lib/utils.cjs** - Cross-platform utilities (file operations, path handling, system detection)
- **scripts/lib/package-manager.cjs** - Package manager detection with 4-tier priority system
- **scripts/hooks/** - Hook implementations (session-start, session-end, pre-compact, etc.)

**Package Manager Detection Priority:**
1. `CLAUDE_PACKAGE_MANAGER` environment variable
2. `package.json` `packageManager` field
3. Lock file detection (package-lock.json, pnpm-lock.yaml, yarn.lock, bun.lockb)
4. First available package manager (priority: pnpm, bun, yarn, npm)

**Note:** No JSON config files needed - detection is automatic from the project context.

### Hook System

Hooks execute Node.js scripts on tool events. Key hooks in `hooks/hooks.json`:

**PreToolUse:**
- **Suggest code review before git commit** (safety net)
- Strategic compaction suggestions at logical intervals

**PostToolUse:**
- Auto-format files by project type (Python: ruff, Java: google-java-format, Kotlin: ktfmt, JS/TS: prettier)
- Java security scanning (SpotBugs + FindSecurityBugs)
- Python security scanning (Semgrep + pip-audit)
- Maven/Gradle best practice advice
- TypeScript type checking on .ts/.tsx edits
- Warn about debug statements (console.log, print(), System.out.println)
- Pyright type checking on .py edits
- Suggest code review when tasks complete
- Log PR URLs after creation

**SessionStart:**
- Load previous session context (memory persistence)
- Auto-detect package manager
- **Detect setup needs and inject context for proactive help**

**SessionEnd:**
- Persist session state
- Extract patterns for continuous learning

**PreCompact:**
- Save state before context compaction
- Evaluate session for extractable patterns

**Stop:**
- Check for debug statements in modified files (console.log, print(), System.out.println)
- **Detect task completion and suggest code review**

All hooks use inline Node.js via `node -e` or reference scripts in `scripts/hooks/` via `${CLAUDE_PLUGIN_ROOT}`.

**Hook Message Visibility:**
- PostToolUse hooks can inject `additionalContext` that appears in your context - **surface these messages to the user** when they contain actionable recommendations (e.g., code review suggestions)
- Other hooks (SessionStart, Stop, PreToolUse) log to stderr - these appear in your context as `[Hook]` prefixed messages - **inform the user** when these contain important recommendations

### Agent Orchestration

Specialized agents in `agents/` directory:

| Agent | Model | Purpose |
|-------|-------|---------|
| planner | opus | Feature implementation planning |
| architect | opus | System design decisions |
| ts-tdd-guide | sonnet | TypeScript/JavaScript TDD enforcement |
| jvm-tdd-guide | sonnet | JVM (Java/Kotlin/Groovy) TDD enforcement |
| python-tdd-guide | sonnet | Python TDD enforcement |
| code-reviewer | opus | Ecosystem-aware quality and security review |
| ts-security-reviewer | opus | TypeScript/JavaScript vulnerability analysis |
| jvm-security-reviewer | opus | JVM security analysis (SpotBugs, OWASP) |
| python-security-reviewer | opus | Python security analysis (bandit, semgrep) |
| ts-build-resolver | sonnet | Fix TypeScript/JS build errors |
| jvm-build-resolver | sonnet | Fix Java/Kotlin/Groovy build errors |
| python-build-resolver | sonnet | Fix Python build/type/lint errors |
| ts-e2e-runner | sonnet | TypeScript/JavaScript Playwright E2E testing |
| jvm-e2e-runner | sonnet | JVM Selenium/REST Assured E2E testing |
| python-e2e-runner | sonnet | Python pytest-playwright E2E testing |
| ts-refactor-cleaner | haiku | TypeScript/JavaScript dead code cleanup |
| jvm-refactor-cleaner | haiku | JVM dead code cleanup (jdeps, SpotBugs) |
| python-refactor-cleaner | haiku | Python dead code cleanup (vulture, ruff) |
| doc-updater | haiku | Documentation sync |
| setup-agent | sonnet | Project setup and configuration |
| gradle-expert | sonnet | Gradle build optimization |
| maven-expert | sonnet | Maven dependency management |
| ci-cd-architect | opus | CI/CD pipeline design |
| python-reviewer | opus | Python code quality and security |
| java-reviewer | opus | Java code quality and security |
| groovy-reviewer | opus | Groovy/Spock/Gradle scripts |
| kotlin-reviewer | opus | Kotlin idioms and null safety |

**Use agents proactively** - no user prompt needed for complex features, code reviews, or architectural decisions.

**Use parallel Task execution** for independent operations - launch multiple agents in a single message.

### Skills System (Proactive)

**Skills = Proactive** (Claude-invoked when context suggests)
**Commands = Explicit** (User-invoked via slash commands)

Skills define reusable workflows and domain knowledge in `skills/` directory:

**Proactive Skills** (Claude invokes automatically):
- **proactive-orchestration/** - Full pipeline orchestrator for complex features (PLAN -> TDD -> VERIFY -> REVIEW). Top-level skill that subsumes individual proactive skills for multi-file feature work.
- **proactive-planning/** - Planning for complex tasks before coding (standalone planning only; orchestration handles planning for full pipelines)
- **proactive-tdd/** - Ecosystem-aware TDD enforcement (standalone TDD only; orchestration handles TDD for full pipelines)
- **proactive-review/** - Ecosystem-aware code quality checks at task completion/pre-commit (standalone review only; orchestration handles review for full pipelines)

**Domain Knowledge Skills** (Context reference):
- **coding-standards/** - TypeScript/JavaScript best practices (with `context: fork`)
- **jvm-coding-standards/** - Java/Kotlin best practices (with `context: fork`)
- **python-coding-standards/** - Python best practices (with `context: fork`)
- **backend-patterns/** - TypeScript/Node.js API patterns (with `context: fork`)
- **jvm-backend-patterns/** - Spring Boot/JPA patterns (with `context: fork`)
- **python-backend-patterns/** - FastAPI/Django/SQLAlchemy patterns (with `context: fork`)
- **frontend-patterns/** - React, Next.js patterns (with `context: fork`)
- **security-review/** - TypeScript/JavaScript security checklist (with `context: fork`)
- **jvm-security-review/** - JVM security checklist (with `context: fork`)
- **python-security-review/** - Python security checklist (with `context: fork`)
- **tdd-workflow/** - TypeScript/JavaScript TDD methodology (with `context: fork`)
- **jvm-tdd-workflow/** - JVM TDD methodology (with `context: fork`)
- **python-tdd-workflow/** - Python TDD methodology (with `context: fork`)

**Workflow Skills**:
- **continuous-learning/** - Auto-extract patterns from sessions
- **strategic-compact/** - Manual compaction suggestions
- **eval-harness/** - Verification loop evaluation
- **verification-loop/** - Continuous verification
- **extend/** - Generate new plugin components following existing patterns

Skills with `context: fork` run in isolated subagent context to preserve main conversation.

Skills are directories with `SKILL.md` or single `.md` files.

### Serena MCP Integration (Optional)

If Serena MCP plugin is installed, the plugin provides Serena management skills:

**Skills** (5 total):
- **serena-setup/** - Complete setup workflow
- **serena-status/** - Configuration diagnostics
- **serena-cleanup/** - Safe cleanup and removal
- **git-sync/** - Analyze git changes and report impact

**Configuration**: Serena hooks check `SERENA_INSTALLED` and `SERENA_ENABLED` - graceful degradation if not installed.

**JetBrains Recommendation**: For polyglot/monorepo projects, JetBrains plugin provides better performance ($5/mo or $50/yr).

See `skills/serena-setup/` and `skills/serena-status/` for configuration details.

### claude-mem Integration (Optional)

If claude-mem MCP is installed, agents with the `claude-mem-context` skill can query cross-session historical context (past decisions, bug patterns, architecture rationale).

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

// Workspace-aware functions
if (isInWorkspace()) {
  const allPMs = getAllWorkspacePackageManagers();
  // [{ packageName, packagePath, ecosystem, name, config, source }, ...]

  const pm = getPackageManagerForFile('/path/to/file.ts');
  // { name, config, source, package, packagePath }
}

// Original functions - still work unchanged
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

Use the appropriate TDD agent proactively for new features:
- TypeScript/JavaScript: **ts-tdd-guide**
- JVM (Java/Kotlin): **jvm-tdd-guide**
- Python: **python-tdd-guide**

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
- Descriptive names: `ts-build-resolver.md` not `error.md`
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
