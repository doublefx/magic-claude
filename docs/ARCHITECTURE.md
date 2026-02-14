# Architecture

Internal structure, ecosystem registry, cross-platform support, and workspace infrastructure.

---

## Directory Structure

```
magic-claude/
|-- .claude-plugin/   # Plugin and marketplace manifests
|   |-- plugin.json         # Plugin metadata and component paths
|   |-- marketplace.json    # Marketplace catalog for /plugin marketplace add
|
|-- agents/           # Specialized subagents for delegation (27 agents)
|   |-- planner.md              # Feature implementation planning
|   |-- architect.md            # System design decisions
|   |-- ts-tdd-guide.md         # TypeScript/JavaScript TDD
|   |-- jvm-tdd-guide.md        # JVM (Java/Kotlin/Groovy) TDD
|   |-- python-tdd-guide.md     # Python TDD
|   |-- code-reviewer.md        # Ecosystem-aware quality review
|   |-- ts-security-reviewer.md # TypeScript/JS vulnerability analysis
|   |-- jvm-security-reviewer.md  # JVM security (SpotBugs, OWASP)
|   |-- python-security-reviewer.md # Python security (bandit, semgrep)
|   |-- ts-build-resolver.md    # TypeScript/JS build errors
|   |-- jvm-build-resolver.md   # Java/Kotlin/Groovy build errors
|   |-- python-build-resolver.md # Python build/type/lint errors
|   |-- ts-e2e-runner.md        # TypeScript/JS Playwright E2E testing
|   |-- jvm-e2e-runner.md       # JVM Selenium/REST Assured E2E testing
|   |-- python-e2e-runner.md    # Python pytest-playwright E2E testing
|   |-- ts-refactor-cleaner.md  # TypeScript/JS dead code cleanup
|   |-- jvm-refactor-cleaner.md # JVM dead code cleanup
|   |-- python-refactor-cleaner.md # Python dead code cleanup
|   |-- doc-updater.md          # Documentation sync
|   |-- python-reviewer.md      # Python code review
|   |-- java-reviewer.md        # Java code review
|   |-- kotlin-reviewer.md      # Kotlin code review
|   |-- groovy-reviewer.md      # Groovy code review
|   |-- maven-expert.md         # Maven build optimization
|   |-- gradle-expert.md        # Gradle build optimization
|   |-- ci-cd-architect.md      # CI/CD pipeline generation
|
|-- skills/           # Workflow definitions and domain knowledge (36 total)
|   |-- coding-standards/           # TypeScript/JS best practices
|   |-- jvm-coding-standards/       # Java/Kotlin best practices
|   |-- python-coding-standards/    # Python best practices
|   |-- backend-patterns/           # TypeScript/Node.js API patterns
|   |-- jvm-backend-patterns/       # Spring Boot/JPA patterns
|   |-- python-backend-patterns/    # FastAPI/Django/SQLAlchemy patterns
|   |-- frontend-patterns/          # React, Next.js patterns
|   |-- tdd-workflow/               # TypeScript/JS TDD methodology
|   |-- jvm-tdd-workflow/           # JVM TDD methodology
|   |-- python-tdd-workflow/        # Python TDD methodology
|   |-- security-review/            # TypeScript/JS security checklist
|   |-- jvm-security-review/        # JVM security checklist
|   |-- python-security-review/     # Python security checklist
|   |-- proactive-orchestration/    # Full pipeline orchestrator (PLAN->TDD->VERIFY->REVIEW)
|   |-- proactive-planning/         # Standalone planning for complex tasks
|   |-- proactive-tdd/              # Standalone TDD enforcement
|   |-- proactive-review/           # Standalone code quality review
|   |-- continuous-learning/        # Auto-extract patterns from sessions
|   |-- strategic-compact/          # Manual compaction suggestions
|   |-- eval-harness/               # Verification loop evaluation
|   |-- verification-loop/          # Continuous verification
|   |-- python-patterns/            # Python best practices and idioms
|   |-- kotlin-patterns/            # Kotlin modern patterns
|   |-- maven-patterns/             # Maven project management
|   |-- gradle-patterns/            # Gradle build optimization
|   |-- ci-cd-patterns/             # CI/CD and deployment patterns
|   |-- clickhouse-io/              # ClickHouse database patterns
|   |-- claude-mem-context/         # Cross-session historical context
|   |-- extend/                     # Generate new plugin components
|   |-- project-guidelines-example/ # Template for project-specific guidelines
|   |-- agent-teams/                # Agent Teams coordination guide (experimental)
|   |-- serena-setup/               # Serena MCP setup workflow
|   |-- serena-status/              # Serena configuration diagnostics
|   |-- serena-cleanup/             # Safe Serena cleanup and removal
|   |-- serena-code-navigation/     # Serena code navigation tool mapping
|   |-- git-sync/                   # Git changes impact analysis
|
|-- commands/         # Slash commands for quick execution (15 total)
|   |-- tdd.md              # /tdd - Test-driven development
|   |-- plan.md             # /plan - Implementation planning
|   |-- e2e.md              # /e2e - E2E test generation
|   |-- code-review.md      # /code-review - Quality review
|   |-- build-fix.md        # /build-fix - Fix build errors
|   |-- refactor-clean.md   # /refactor-clean - Dead code removal
|   |-- learn.md            # /learn - Extract patterns mid-session
|   |-- checkpoint.md       # /checkpoint - Save verification state
|   |-- verify.md           # /verify - Run verification loop
|   |-- setup-pm.md         # /setup-pm - Configure package manager
|   |-- setup-rules.md      # /setup-rules - Install plugin rules
|   |-- eval.md             # /eval - Run evaluation harness
|   |-- orchestrate.md      # /orchestrate - Multi-agent orchestration
|   |-- test-coverage.md    # /test-coverage - Coverage reporting
|   |-- update-docs.md      # /update-docs - Sync documentation
|
|-- rules/            # Always-follow guidelines (13 total, copy to ~/.claude/rules/)
|   |-- security.md         # Mandatory security checks
|   |-- coding-style.md     # Immutability, file organization
|   |-- testing.md          # TDD, 80% coverage requirement
|   |-- git-workflow.md     # Commit format, PR process
|   |-- agents.md           # When to delegate to subagents
|   |-- performance.md      # Model selection, context management
|   |-- java-style.md       # Java/Kotlin coding conventions
|   |-- python-style.md     # Python coding conventions (PEP 8, type hints)
|   |-- patterns.md         # Design patterns and anti-patterns
|   |-- hooks.md            # Hook development guidelines
|   |-- continuous-learning.md  # Auto-extract patterns from sessions
|   |-- claude-mem-tools.md # claude-mem MCP tool usage rules
|   |-- serena-tools.md     # Serena MCP tool usage rules
|
|-- hooks/            # Trigger-based automations
|   |-- hooks.json                # All hooks config (14 event types supported)
|
|-- scripts/          # Cross-platform Node.js scripts
|   |-- lib/                     # Shared utilities
|   |   |-- utils.cjs            # Cross-platform file/path/system utilities
|   |   |-- package-manager.cjs  # Package manager detection and selection
|   |   |-- ecosystems/          # Auto-discoverable ecosystem modules
|   |-- hooks/                   # Hook implementations (21 total)
|   |   |-- session-start.cjs    # Load context on session start
|   |   |-- session-end.cjs      # Save state on session end
|   |   |-- pre-compact.cjs      # Pre-compaction state saving
|   |   |-- suggest-compact.cjs  # Strategic compaction suggestions
|   |   |-- evaluate-session.cjs # Extract patterns from sessions
|   |   |-- smart-formatter.js   # Universal auto-formatter
|   |   |-- python-security.js   # Python security scanning
|   |   |-- java-security.js     # Java security scanning
|   |   |-- typescript-security.js # TypeScript/JS security scanning
|   |   |-- maven-advisor.js     # Maven/Gradle best practices
|   |   |-- inject-prompt-context.cjs  # Dynamic context injection
|   |   |-- permission-filter.cjs      # Auto-approve safe commands
|   |   |-- pre-commit-review.cjs      # Code review before git commit
|   |   |-- post-task-update.cjs       # Review suggestion on task completion
|   |   |-- pr-url-logger.cjs          # Log PR URLs after creation
|   |   |-- stop-validation.cjs        # Debug statement check on stop
|   |   |-- console-log-detector.cjs   # Debug statement detection
|   |   |-- typescript-checker.cjs     # TypeScript type checking
|   |   |-- pyright-checker.cjs        # Python type checking
|   |   |-- task-completed.cjs         # TaskCompleted quality gate
|   |   |-- notify.cjs                 # Desktop notifications
|   |-- setup-package-manager.cjs # Interactive PM setup
|   |-- setup-rules.cjs          # Plugin rules installation
|
|-- templates/        # CI/CD and deployment templates
|   |-- github-actions/          # GitHub Actions workflows
|   |-- gitlab-ci/               # GitLab CI pipelines
|   |-- bitbucket-pipelines/     # Bitbucket Pipelines
|   |-- docker/                  # Docker multi-stage builds
|   |-- kubernetes/              # Kubernetes manifests
|   |-- helm/                    # Helm charts
|   |-- security/                # Security scanning configs
|
|-- tests/            # Test suite (247 tests)
|   |-- unit/                    # Unit tests
|   |-- integration/             # Integration tests
|   |-- e2e/                     # End-to-end tests
|   |-- harnesses/               # Test harnesses
|   |-- fixtures/                # Test fixtures (sample projects)
|   |-- run-all.cjs              # Run all tests
|
|-- contexts/         # Dynamic system prompt injection contexts
|   |-- dev.md              # Development mode context
|   |-- review.md           # Code review mode context
|   |-- research.md         # Research/exploration mode context
|
|-- examples/         # Example configurations and sessions
|   |-- CLAUDE.md           # Example project-level config
|   |-- user-CLAUDE.md      # Example user-level config
|
|-- mcp-configs/      # MCP server configurations
|   |-- mcp-servers.json    # GitHub, Supabase, Vercel, Railway, etc.
|
|-- marketplace.json  # Self-hosted marketplace config (for /plugin marketplace add)
```

---

## Ecosystem Registry

Ecosystem modules are the single source of truth for all language/platform metadata. The registry auto-discovers modules by scanning directories at three levels:

| Priority | Level | Path |
|----------|-------|------|
| 1 (base) | Plugin | `scripts/lib/ecosystems/` |
| 2 | User | `~/.claude/ecosystems/` |
| 3 (wins) | Project | `./.claude/ecosystems/` |

Later levels override earlier ones. Adding a new ecosystem (e.g., Go) requires only dropping a single `.cjs` file into any `ecosystems/` directory. The file must export a class extending `Ecosystem` from `types.cjs`.

Each ecosystem module is self-describing -- it declares tools, version commands, installation help, setup categories, debug patterns, project sub-types, and config-aware command generation. All consumers (tool-detection, commands, setup scripts, hook scripts) aggregate metadata from the registry.

**Key exports from `scripts/lib/ecosystems/index.cjs`:**
- `getEcosystem(type, config)` -- Get an instance by type
- `detectEcosystem(dir)` -- Detect ecosystem from directory indicators
- `getRegistry()` -- Full registry map
- `getEcosystemDirs()` -- Discovery directories
- `getAllDebugPatterns()`, `getAllProjectSubTypes()`, `getAllEcosystemTools()`, etc.

---

## Cross-Platform Support

All hooks and scripts are Node.js-based for Windows, macOS, and Linux compatibility. No shell scripts.

### Package Manager Detection

The plugin automatically detects your preferred package manager with the following priority:

1. **Environment variable**: `CLAUDE_PACKAGE_MANAGER`
2. **Project config**: `.claude/magic-claude.package-manager.json`
3. **package.json**: `packageManager` field
4. **Lock file**: Detection from package-lock.json, yarn.lock, pnpm-lock.yaml, or bun.lockb
5. **Global config**: `~/.claude/magic-claude.package-manager.json`
6. **Fallback**: First available package manager

```bash
# Set via environment variable
export CLAUDE_PACKAGE_MANAGER=pnpm

# Set via slash command (when installed as plugin)
/setup-pm --global pnpm
/setup-pm --project bun
/setup-pm --detect
```

---

## Workspace & Monorepo Support

Automatic workspace detection with full support for mixed-language monorepos.

### Supported Workspace Types

pnpm workspaces, Nx, Lerna, Yarn workspaces, Turborepo

### Multi-Ecosystem

Node.js, Java/JVM, Python, and Rust in one workspace. Per-package ecosystem identification.

### Configuration Hierarchy

```
~/.claude/settings.json              # Global (lowest priority)
  |
workspace-root/.claude/settings.json # Workspace
  |
package-dir/.claude/settings.json    # Package (highest priority)
```

### WorkspaceContext API

```javascript
const { getWorkspaceContext } = require('./scripts/lib/workspace-context.cjs');

const workspace = getWorkspaceContext();

if (workspace.isWorkspace()) {
  const type = workspace.getType();       // 'pnpm-workspace', 'nx', 'lerna', etc.
  const packages = workspace.getAllPackages();  // [{ name, path, packageJson, ecosystem }]
  const pkg = workspace.findPackageForFile('/path/to/file.ts');
  const config = workspace.getConfig();   // Merged config (global + workspace + package)
}
```

### Tool Detection

```javascript
const { ToolDetector, checkEcosystemTools } = require('./scripts/lib/workspace/tool-detection.cjs');

const detector = new ToolDetector();
detector.isAvailable('node');   // true/false
detector.getVersion('node');    // 'v20.11.0' or null

const tools = checkEcosystemTools('nodejs');
// { node: true, npm: true, pnpm: true, yarn: false, bun: false }
```

100% backward compatible -- single-project workflows work unchanged.
