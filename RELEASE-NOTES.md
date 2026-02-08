# Release Notes v1.0.0

**Release Date**: 2026-02-08
**Type**: Initial Release
**Status**: Production Ready

---

## Overview

Magic Claude is an **enterprise polyglot Claude Code plugin** providing specialized agents, skills, hooks, commands, and rules for multi-language development workflows.

**Key Capabilities**:
- 17 specialized agents for code review, planning, TDD, security, and CI/CD
- 24 skills covering domain knowledge, proactive workflows, and Serena MCP integration
- 18 slash commands for setup, development, documentation, and verification
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

## Agents (17)

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
| setup-agent | sonnet | Project setup and configuration |
| gradle-expert | sonnet | Gradle build optimization |
| maven-expert | sonnet | Maven dependency management |
| ci-cd-architect | opus | CI/CD pipeline design |
| python-reviewer | opus | Python code quality and security |
| java-reviewer | opus | Java code quality and security |
| groovy-reviewer | opus | Groovy/Spock/Gradle scripts |
| kotlin-reviewer | opus | Kotlin idioms and null safety |

## Skills (24)

**Proactive (3)**: proactive-planning, proactive-review, proactive-tdd

**Domain Knowledge (10)**: backend-patterns, frontend-patterns, coding-standards, security-review, tdd-workflow, python-patterns, maven-patterns, gradle-patterns, kotlin-patterns, ci-cd-patterns

**Workflow (6)**: continuous-learning, eval-harness, strategic-compact, verification-loop, clickhouse-io, project-guidelines-example

**Serena Integration (5)**: serena-setup, serena-status, serena-cleanup, git-sync, memory-lifecycle

## Commands (18)

**Setup**: `/setup`, `/setup-pm`, `/setup-ecosystem`
**Development**: `/tdd`, `/plan`, `/code-review`, `/build-fix`, `/e2e`, `/refactor-clean`, `/orchestrate`, `/test-coverage`, `/ci-cd`, `/eval`
**Documentation**: `/update-codemaps`, `/update-docs`
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
