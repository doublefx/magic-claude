# Release Notes v2.1.0

**Release Date**: 2026-02-13
**Type**: Feature Release - Unified Proactive Orchestration
**Status**: Production Ready

---

## Overview

Magic Claude v2.1.0 introduces **unified proactive orchestration** -- the plugin now automatically coordinates the full development pipeline (planning, TDD, verification, review) for complex feature work. Users describe what they want; the system handles the rest.

### Proactive Orchestration

**New skill: `proactive-orchestration`** -- top-level pipeline orchestrator that fires automatically on complex feature requests.

| Phase | What Happens |
|-------|-------------|
| PLAN | Planner agent designs approach, waits for user confirmation |
| TDD | Ecosystem TDD agent implements with RED-GREEN-REFACTOR |
| VERIFY | Build, types, lint, tests, debug audit (auto-remediation on build failure) |
| REVIEW | Code reviewer + security reviewers check quality |
| REPORT | SHIP / NEEDS WORK / BLOCKED verdict with remediation suggestions |

Individual proactive skills (`proactive-planning`, `proactive-tdd`, `proactive-review`) remain for standalone single-phase work.

### Unified Implementations

Duplicate logic between commands and proactive skills has been consolidated:

| Pair | Resolution |
|------|-----------|
| `/tdd` + `proactive-tdd` | `proactive-tdd` delegates to `/tdd` workflow |
| `/code-review` + `proactive-review` | `proactive-review` delegates to `/code-review` workflow |
| `/verify` + `verification-loop` | `verification-loop` delegates to `/verify full` process |

### Remediation Suggestions

Both `/verify` and `/code-review` now suggest specific commands based on failure type:
- Build FAIL -> `/build-fix`
- Tests FAIL -> `/tdd`
- Coverage LOW -> `/test-coverage`
- Security issues -> specific fixes + `/code-review`

### Backend Patterns in Agent Context

TDD agents and build-resolvers now include ecosystem-specific backend patterns:
- `ts-tdd-guide`: `tdd-workflow, backend-patterns, claude-mem-context`
- `jvm-tdd-guide`: `jvm-tdd-workflow, jvm-backend-patterns, claude-mem-context`
- `python-tdd-guide`: `python-tdd-workflow, python-backend-patterns, claude-mem-context`
- Build-resolvers similarly enriched with backend patterns

### TypeScript/JavaScript Security Hook

New `typescript-security.js` PostToolUse hook mirrors existing Java and Python security hooks:
- Semgrep SAST scan
- npm audit for vulnerable dependencies
- Pattern-based detection: eval(), innerHTML, SQL injection, hardcoded credentials, command injection, open redirects
- Graceful degradation if tools not installed

### Bug Fixes

- Fixed phantom `explorer` agent reference in `/orchestrate` bugfix workflow (replaced with `Explore` subagent)
- Added missing `context: fork` to `proactive-tdd` skill
- Upgraded `/code-review` to dispatch to `code-reviewer` agent and ecosystem security reviewers

---

# Release Notes v2.0.0

**Release Date**: 2026-02-09
**Type**: Major Release - Full Polyglot Conversion
**Status**: Production Ready

---

## Overview

Magic Claude v2.0.0 completes the **full polyglot conversion** -- every TypeScript-only agent, skill, command, rule, and hook now supports three ecosystems: TypeScript/JavaScript, JVM (Java/Kotlin/Groovy), and Python.

**What Changed**: 17 new files created, 26 files modified, 43 files touched total.

### New Polyglot Agent Trios

Each domain now has three ecosystem-specific agents dispatched by a single router command:

| Domain | TS/JS Agent | JVM Agent | Python Agent | Router |
|--------|-------------|-----------|--------------|--------|
| TDD | ts-tdd-guide | jvm-tdd-guide | python-tdd-guide | `/tdd` |
| Security | ts-security-reviewer | jvm-security-reviewer | python-security-reviewer | `/code-review` |
| Build Fix | ts-build-resolver | jvm-build-resolver | python-build-resolver | `/build-fix` |
| E2E | ts-e2e-runner | jvm-e2e-runner | python-e2e-runner | `/e2e` |
| Refactor | ts-refactor-cleaner | jvm-refactor-cleaner | python-refactor-cleaner | `/refactor-clean` |

### New Ecosystem Skills

| Skill | Purpose |
|-------|---------|
| jvm-tdd-workflow | JUnit 5, Mockito, MockK, JaCoCo |
| python-tdd-workflow | pytest, hypothesis, pytest-cov |
| jvm-security-review | SpotBugs, OWASP, Spring Security checklist |
| python-security-review | bandit, pip-audit, semgrep checklist |
| jvm-coding-standards | Google Java Style, Kotlin idioms |
| python-coding-standards | PEP 8, type hints, Pydantic v2 |
| jvm-backend-patterns | Spring Boot, JPA, DTO records |
| python-backend-patterns | FastAPI, Django, SQLAlchemy 2.0 |

### Polyglot Hooks

- **console-log-detector.cjs**: Now detects `console.log` (JS/TS), `print()` (Python), `System.out.println` (Java/Kotlin)
- **stop-validation.cjs**: Now checks all three ecosystems for debug statements
- **pyright-checker.cjs**: NEW - Pyright type checking after `.py` edits (mirrors typescript-checker.cjs)

### Polyglot Rules, Commands, Skills

- Rules (`patterns.md`, `coding-style.md`, `security.md`): JVM and Python sections added
- Commands (`update-docs.md`, `test-coverage.md`, `verify.md`): Ecosystem detection and ecosystem-specific tooling
- `verification-loop/SKILL.md`: JVM and Python build/test/lint commands

---

# Release Notes v1.0.0

**Release Date**: 2026-02-08
**Type**: Initial Release
**Status**: Production Ready

---

## Overview

Magic Claude is an **enterprise polyglot Claude Code plugin** providing specialized agents, skills, hooks, commands, and rules for multi-language development workflows.

**Key Capabilities**:
- 19 specialized agents for code review, planning, TDD, security, build fixing, and CI/CD
- 25 skills covering domain knowledge, proactive workflows, plugin extension, and Serena MCP integration
- 17 slash commands for setup, development, documentation, and verification
- 16 hooks for auto-formatting, security scanning, context injection, and session persistence
- 49 production-ready templates for CI/CD, Docker, Kubernetes, Helm, and security
- Workspace and monorepo support (pnpm, Nx, Lerna, Yarn, Turborepo)
- Multi-ecosystem detection (Node.js, JVM, Python, Rust)
- Cross-platform compatibility (Windows, macOS, Linux)

---

## Installation

```bash
/plugin install magic-claude
```

Or clone directly:

```bash
git clone https://github.com/doublefx/magic-claude.git
```

---

## Language Support

**JavaScript / TypeScript**: Prettier, ESLint, TypeScript type checking

**Python**: Ruff (100x faster formatting), uv (30x faster packages), Pyright, Semgrep security scanning

**Java**: google-java-format, SpotBugs security scanning, Maven and Gradle integration

**Kotlin**: ktfmt, Detekt static analysis, Gradle Kotlin DSL

**Groovy**: CodeNarc linting, Gradle build script support

---

## Agents (19)

| Agent | Model | Purpose |
|-------|-------|---------|
| planner | opus | Feature implementation planning |
| architect | opus | System design decisions |
| tdd-guide | sonnet | Test-driven development enforcement |
| code-reviewer | opus | Quality and security review |
| security-reviewer | opus | Vulnerability analysis |
| ts-build-resolver | sonnet | Fix TypeScript/JS build errors |
| jvm-build-resolver | sonnet | Fix Java/Kotlin/Groovy build errors |
| python-build-resolver | sonnet | Fix Python build/type/lint errors |
| e2e-runner | sonnet | Playwright E2E testing |
| refactor-cleaner | haiku | Dead code cleanup |
| doc-updater | haiku | Documentation sync |
| setup-agent | sonnet | Project setup and configuration |
| gradle-expert | sonnet | Gradle build optimization |
| maven-expert | sonnet | Maven dependency management |
| ci-cd-architect | opus | CI/CD pipeline design |
| python-reviewer | opus | Python code quality and security |
| java-reviewer | opus | Java code quality and security |
| groovy-reviewer | opus | Groovy/Spock/Gradle scripts |
| kotlin-reviewer | opus | Kotlin idioms and null safety |

## Skills (25)

**Proactive (3)**: proactive-planning, proactive-review, proactive-tdd

**Domain Knowledge (10)**: backend-patterns, frontend-patterns, coding-standards, security-review, tdd-workflow, python-patterns, maven-patterns, gradle-patterns, kotlin-patterns, ci-cd-patterns

**Workflow (7)**: continuous-learning, eval-harness, strategic-compact, verification-loop, clickhouse-io, extend, project-guidelines-example

**Serena Integration (4)**: serena-setup, serena-status, serena-cleanup, git-sync

**MCP Integration (1)**: claude-mem-context

## Commands (17)

**Setup**: `/setup`, `/setup-pm`, `/setup-ecosystem`
**Development**: `/tdd`, `/plan`, `/code-review`, `/build-fix`, `/e2e`, `/refactor-clean`, `/orchestrate`, `/test-coverage`, `/ci-cd`, `/eval`
**Documentation**: `/update-docs`
**Learning & Verification**: `/learn`, `/checkpoint`, `/verify`

## Hooks (16)

- **UserPromptSubmit**: Branch/time/task context injection
- **PermissionRequest**: Auto-approve safe bash commands
- **PreToolUse**: Code review suggestions before commit, strategic compaction
- **PreCompact**: State persistence, pattern evaluation
- **SessionStart**: Context loading, package manager detection
- **PostToolUse**: Auto-formatting, security scanning, type checking, console.log detection, PR logging
- **Stop**: Console.log validation in modified files
- **SessionEnd**: Session persistence, pattern extraction
- **Notification**: Desktop notifications

## Templates (49)

- **CI/CD Pipelines** (16): GitHub Actions, GitLab CI, Bitbucket Pipelines for Node.js, Python, Java (Maven/Gradle)
- **Docker** (5): Multi-stage Dockerfiles with security best practices
- **Kubernetes** (6): Deployment, service, ingress, configmap, HPA, secrets
- **Helm** (11): Complete application chart with all standard templates
- **Security** (6): Semgrep, Gitleaks, Trivy configurations
- **Serena** (5): Memory templates and git hooks

---

## Workspace & Monorepo Support

- Auto-detects workspace type: pnpm, Nx, Lerna, Yarn, Turborepo
- Per-package ecosystem identification (Node.js, JVM, Python, Rust)
- Configuration hierarchy: global < workspace < package
- Workspace-aware package manager resolution
- Cross-platform command generation with wrapper detection

---

## Test Suite

197 tests across 10 test suites, all passing.

| Test Suite | Tests |
|------------|-------|
| lib/utils | 22 |
| lib/package-manager | 27 |
| lib/workspace-context | 20 |
| lib/ecosystems | 26 |
| lib/workspace-detection | 22 |
| lib/workspace-ecosystems | 14 |
| lib/config-hierarchy | 15 |
| lib/tool-detection | 17 |
| lib/workspace-commands | 21 |
| lib/serena | 13 |
| **Total** | **197** |

---

## Known Issues

1. **3 orphaned hook scripts**: `maven-advisor.js`, `post-edit-lint.cjs`, `python-security.js` exist on disk but are not wired in `hooks.json`. Pending activation or removal.

2. **First-time cache miss**: Project type detection takes ~150ms on first run (then <50ms cached).

3. **Tool installation required**: Auto-formatting requires language tools installed (Ruff, google-java-format, etc.).

---

## Roadmap

- Monorepo-aware hook filtering (per-package tool selection)
- Go ecosystem support (gofmt, golangci-lint)
- Rust ecosystem support (rustfmt, clippy)
- C#/.NET support (dotnet format, Roslyn)
- CircleCI and Azure DevOps pipeline templates
- GitOps workflows (ArgoCD, Flux)

---

**Issues & Feedback**: [github.com/doublefx/magic-claude](https://github.com/doublefx/magic-claude/issues)

---

*v1.0.0 | 2026-02-08*
