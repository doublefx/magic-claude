# Magic Claude Documentation

Full documentation index. Pick a starting point based on what you need.

---

## Getting Started

| Doc | Description |
|-----|-------------|
| [Foundations Guide](guides/foundations.md) | Setup, component model, philosophy. **Read this first.** |
| [Tutorial 01: Getting Started](tutorials/01-getting-started.md) | 15-minute hands-on installation and first commands |

## Language Workflows

| Doc | Description |
|-----|-------------|
| [Tutorial 02: Python Development](tutorials/02-python-development.md) | Ruff, uv, Pyright, Semgrep workflow |
| [Tutorial 03: Java Development](tutorials/03-java-development.md) | Maven, Gradle, Spring Boot workflow |
| [Tutorial 04: CI/CD Generation](tutorials/04-cicd-generation.md) | Pipeline generation for GitHub/GitLab/Bitbucket |

## Advanced Topics

| Doc | Description |
|-----|-------------|
| [Advanced Topics Guide](guides/advanced-topics.md) | Token optimization, memory, parallelization, orchestration |
| [Tutorial 05: Advanced Features](tutorials/05-advanced-features.md) | Monorepos, hooks, multi-agent workflows |

## Reference

| Doc | Description |
|-----|-------------|
| [FEATURES.md](FEATURES.md) | Complete feature documentation with examples |
| [AGENT-CATALOG.md](AGENT-CATALOG.md) | All 30 agents and 42 skills with use cases and configuration |
| [PERFORMANCE.md](PERFORMANCE.md) | Benchmarks, token budgets, optimization tips |

## Architecture & Internals

| Doc | Description |
|-----|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Directory structure, ecosystem registry, workspace support |
| [WORKFLOW-ANALYSIS.md](WORKFLOW-ANALYSIS.md) | How skills, agents, hooks, and commands connect -- gap analysis |
| [hooks-protocol.md](hooks-protocol.md) | Hook system design and event lifecycle |
| [build-tools-guide.md](build-tools-guide.md) | Maven and Gradle expert integration |
| [ci-cd-guide.md](ci-cd-guide.md) | CI/CD pipeline patterns and templates |

## Plugin Development

Build your own components using the official Claude Code docs (via `magic-claude-docs:docs` skill):

| Topic | Skill Query |
|-------|-------------|
| Plugin architecture overview | `magic-claude-docs:docs plugins` |
| Plugin reference (fields, variables) | `magic-claude-docs:docs plugins-reference` |
| Writing commands and skills | `magic-claude-docs:docs skills` |
| Creating specialized agents | `magic-claude-docs:docs sub-agents` |
| Hook development guide | `magic-claude-docs:docs hooks-guide` |
| Hooks reference | `magic-claude-docs:docs hooks` |
| Best practices | `magic-claude-docs:docs best-practices` |

## Project

| Doc | Description |
|-----|-------------|
| [RELEASE-NOTES.md](../RELEASE-NOTES.md) | Version history and changelog |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | How to contribute agents, skills, hooks, and more |
