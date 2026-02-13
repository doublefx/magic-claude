# Magic Claude

[![Stars](https://img.shields.io/github/stars/doublefx/magic-claude?style=flat)](https://github.com/doublefx/magic-claude/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Shell](https://img.shields.io/badge/-Shell-4EAA25?logo=gnu-bash&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white)
![Java](https://img.shields.io/badge/-Java-007396?logo=openjdk&logoColor=white)
![Kotlin](https://img.shields.io/badge/-Kotlin-7F52FF?logo=kotlin&logoColor=white)

A Claude Code plugin that gives you **27 specialized agents**, **27 domain skills**, and **production-ready hooks** for Python, Java, Kotlin, TypeScript, and CI/CD -- installed in one command. Need Go, Rust, or C#? Run `/extend` to scaffold full ecosystem support.

```bash
/plugin marketplace add doublefx/magic-claude
/plugin install magic-claude@magic-claude
/setup
```

---

## See It In Action

A typical workflow after installing the plugin:

```bash
# 1. Setup detects your ecosystem automatically
/setup
# -> Detects pyproject.toml, checks python3/pip/ruff/pyright

# 2. Edit a Python file -- auto-formatting fires via PostToolUse hook
#    Ruff formats the file, hook warns about any print() statements

# 3. Implement a feature with test-driven development
/tdd

# 4. Review code quality and security before committing
/code-review
# -> python-reviewer agent checks style, security, patterns
```

| Capability | What happens |
|-----------|-------------|
| Auto-formatting | Ruff, google-java-format, ktfmt, Prettier -- fires on every edit |
| Security scanning | Semgrep, SpotBugs, pip-audit -- runs on file save |
| TDD enforcement | Tests written first, 80%+ coverage verified |
| Code review | Ecosystem-aware quality and security checks |
| CI/CD generation | GitHub Actions, GitLab CI, Bitbucket Pipelines from one command |
| Debug statement detection | Warns about `console.log`, `print()`, `System.out.println` |
| Self-extending | `/extend go` scaffolds complete Go ecosystem support |
| Monorepo support | pnpm workspaces, Nx, Lerna, Turborepo with mixed ecosystems |

---

## What You Get

| Feature | Description | Details |
|---------|-------------|---------|
| **Polyglot agents** | 27 agents: reviewers, TDD guides, build resolvers, security scanners, E2E runners for each ecosystem | [AGENT-CATALOG](docs/AGENT-CATALOG.md) |
| **Domain skills** | 27 skills: coding standards, backend patterns, TDD workflows, security checklists per ecosystem | [FEATURES](docs/FEATURES.md) |
| **Auto-formatting** | PostToolUse hooks run Ruff, google-java-format, ktfmt, or Prettier based on project type | [Foundations Guide](docs/guides/foundations.md) |
| **Security scanning** | Semgrep + pip-audit (Python), SpotBugs + FindSecurityBugs (Java), Gitleaks, Trivy | [FEATURES](docs/FEATURES.md) |
| **CI/CD templates** | 44 templates: GitHub Actions, GitLab CI, Bitbucket Pipelines, Docker, Kubernetes, Helm | [Tutorial 04](docs/tutorials/04-cicd-generation.md) |
| **Self-extending** | `/extend go` generates patterns skill, reviewer agent, build resolver, formatter hook, ecosystem module | [Advanced Topics](docs/guides/advanced-topics.md) |
| **Monorepo support** | Auto-detects workspace type, per-package config, multi-ecosystem in one repo | [ARCHITECTURE](docs/ARCHITECTURE.md) |
| **Memory persistence** | SessionStart/End hooks persist context across sessions; claude-mem integration for cross-session history | [Advanced Topics](docs/guides/advanced-topics.md) |

---

## Installation

### Plugin Install (Recommended)

```bash
# 1. Add the marketplace
/plugin marketplace add doublefx/magic-claude

# 2. Install the plugin
/plugin install magic-claude@magic-claude

# 3. Run first-time setup
/setup
```

The `/setup` command detects your workspace, configures the package manager, checks development tools, and installs dependencies.

For manual installation steps or adding the plugin via `settings.json`, see [Tutorial 01: Getting Started](docs/tutorials/01-getting-started.md).

### Setup Commands

| Command | When to use |
|---------|-------------|
| `/setup` | First-time setup (does everything) |
| `/setup-pm` | Switch package managers (npm to pnpm, etc.) |
| `/setup-ecosystem` | Workspace initialization and tool checking |

---

## Learning Path

### Start here

1. **[Foundations Guide](docs/guides/foundations.md)** -- Setup, component model, philosophy. Read this first.
2. **[Tutorial 01: Getting Started](docs/tutorials/01-getting-started.md)** -- 15-minute hands-on installation.

### Pick your ecosystem

3. **[Tutorial 02: Python Development](docs/tutorials/02-python-development.md)** -- Ruff, uv, Pyright, Semgrep workflow
4. **[Tutorial 03: Java Development](docs/tutorials/03-java-development.md)** -- Maven, Gradle, Spring Boot workflow
5. **[Tutorial 04: CI/CD Generation](docs/tutorials/04-cicd-generation.md)** -- Pipeline generation for GitHub/GitLab/Bitbucket

### Go deeper

6. **[Advanced Topics Guide](docs/guides/advanced-topics.md)** -- Token optimization, memory, parallelization, orchestration
7. **[Tutorial 05: Advanced Features](docs/tutorials/05-advanced-features.md)** -- Monorepos, hooks, multi-agent workflows

### Reference

- **[FEATURES.md](docs/FEATURES.md)** -- Complete feature documentation
- **[AGENT-CATALOG.md](docs/AGENT-CATALOG.md)** -- All 27 agents with use cases
- **[PERFORMANCE.md](docs/PERFORMANCE.md)** -- Benchmarks and optimization tips

### For developers

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** -- Directory structure, ecosystem registry, workspace support
- **[Plugin Development](docs/PLUGIN_DEVELOPMENT/00-OVERVIEW.md)** -- Build your own agents, skills, hooks, and commands

See [docs/README.md](docs/README.md) for the full documentation map.

---

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for format specs, testing instructions, and guidelines.

**Ideas to get started:**
- New language support via `/extend` (Go, Rust, C#, Ruby)
- Framework-specific skills (Django, Spring Cloud, Rails)
- DevOps patterns (Terraform, AWS CDK, Pulumi)
- Additional CI/CD platforms (CircleCI, Jenkins, Azure Pipelines)

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=doublefx/magic-claude&type=Date)](https://star-history.com/#doublefx/magic-claude&Date)

---

## Links

- **Foundations Guide:** [docs/guides/foundations.md](docs/guides/foundations.md)
- **Advanced Topics:** [docs/guides/advanced-topics.md](docs/guides/advanced-topics.md)
- **GitHub:** [doublefx/magic-claude](https://github.com/doublefx/magic-claude)

---

## License

MIT - Use freely, modify as needed, contribute back if you can.

---

**Star this repo if it helps. Read the [Foundations Guide](docs/guides/foundations.md). Build something great.**
