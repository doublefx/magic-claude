# Foundations Guide

Setup, component model, and philosophy. **Read this first.**

Based on 10+ months of daily Claude Code use, building real products. This is the distilled setup -- what actually works.

---

## What Is Magic Claude?

A Claude Code plugin that packages agents, skills, hooks, commands, and rules into a single installable unit. Instead of manually configuring Claude for every project, you install the plugin and get production-ready tooling for Python, Java, Kotlin, TypeScript, and CI/CD out of the box.

```bash
# Install
/plugin install magic-claude

# First-time setup (does everything)
/setup
```

---

## The Component Model

Magic Claude has six component types. Understanding them is key.

### Skills vs Commands

**Skills** are workflow definitions that Claude invokes proactively or on demand. They live in `skills/` and can fork context to avoid polluting your main conversation.

**Commands** are slash-command shortcuts that users invoke explicitly. They live in `commands/`.

They overlap but serve different purposes:

| Aspect | Skills | Commands |
|--------|--------|----------|
| Invoked by | Claude (proactive) or user | User only (via `/command`) |
| Context | Can fork (isolated subagent) | Runs in main conversation |
| Examples | `proactive-orchestration`, `tdd-workflow` | `/code-review`, `/tdd`, `/build-fix` |

**Key skills to know:**
- `proactive-orchestration` — Claude automatically orchestrates the full pipeline (PLAN -> TDD -> VERIFY -> REVIEW) for complex feature requests
- `proactive-planning` — Claude plans before complex changes (standalone planning, outside full pipeline)
- `proactive-tdd` — Claude enforces test-driven development when implementing features (standalone TDD)
- `proactive-review` — Claude automatically reviews code at task completion (standalone review)

**Key commands:**
- `/setup` — Complete project setup (package manager, workspace, tools)
- `/tdd` — Test-driven development workflow
- `/code-review` — Quality and security review
- `/build-fix` — Fix build errors incrementally
- `/extend` — Generate new plugin components for a new ecosystem

### Agents (Subagents)

Subagents are processes your orchestrator (main Claude) delegates tasks to. They run with limited scope and specific tools.

**Why subagents matter:** Context is finite. A code reviewer doesn't need your entire conversation history. Agents get a focused context with just what they need.

**Agent categories:**
- **Review**: `code-reviewer`, `java-reviewer`, `python-reviewer`, `kotlin-reviewer`, `groovy-reviewer`
- **TDD**: `ts-tdd-guide`, `jvm-tdd-guide`, `python-tdd-guide`
- **Build**: `ts-build-resolver`, `jvm-build-resolver`, `python-build-resolver`
- **Security**: `ts-security-reviewer`, `jvm-security-reviewer`, `python-security-reviewer`
- **Architecture**: `planner`, `architect`, `ci-cd-architect`

Agents run via the Task tool. Claude picks the right one automatically based on context, or you trigger them via commands like `/code-review`.

### Hooks

Hooks are event-driven automations. They fire on tool use events and run Node.js scripts.

**Hook types:**
- **PreToolUse** — Before a tool runs (e.g., suggest code review before `git commit`)
- **PostToolUse** — After a tool runs (e.g., auto-format after Edit/Write)
- **SessionStart** — When a session begins (e.g., load context, detect setup needs)
- **SessionEnd** — When a session ends (e.g., persist state, extract patterns)
- **Stop** — When Claude finishes a response (e.g., check for debug statements)

**What hooks do for you automatically:**
- Format Python files with Ruff after every edit
- Format Java with google-java-format, Kotlin with ktfmt
- Format TypeScript/JavaScript with Prettier
- Warn about `console.log`, `print()`, `System.out.println` in modified files
- Suggest code review when tasks complete
- Detect project ecosystem and inject helpful context

### Rules

Rules are always-active guidelines. They load into every conversation without explicit invocation. Use sparingly — they consume context.

Included rules: `coding-style.md`, `patterns.md`, `security.md`, `python-style.md`, `java-style.md`

### Ecosystem Modules

Self-describing modules that tell the infrastructure how to detect, set up, and work with each language ecosystem. Drop a `.cjs` file into any `ecosystems/` directory and it's automatically discovered.

Built-in: Node.js, JVM (Java/Kotlin), Python, Rust. Add more with `/extend`.

---

## The Setup Flow

```bash
# 1. Install the plugin
/plugin install magic-claude

# 2. Run complete setup
/setup

# This detects your ecosystem, configures package manager,
# checks installed tools, and sets up workspace.
```

**Granular alternatives:**
- `/setup-pm` — Package manager only (switching npm to pnpm, etc.)
- `/setup-ecosystem --detect` — Workspace and tool checking only
- `/setup-ecosystem --check python` — Check specific ecosystem tools

---

## MCP Integration

MCPs (Model Context Protocol servers) extend Claude's capabilities. Magic Claude integrates with several:

- **Serena** — Semantic code navigation (symbol lookup, type hierarchy, references)
- **context7** — Latest library documentation injected into context
- **ddg-search** — Live web search for grounding
- **claude-mem** — Cross-session memory persistence

**The context window trap:** Your 200k context window might only be 70k with too many MCPs enabled. Each MCP's tool schemas consume tokens.

**Rule of thumb:**
- Have 20-30 MCPs configured
- Keep under 10 enabled per project
- Under 80 tools active

Use `disabledMcpServers` in project `.claude/project.json` to disable unused ones.

---

## What To Do Next

1. **Install and run `/setup`** — Let it detect your project
2. **Try `/code-review`** — See the review agent in action on your code
3. **Edit a file** — Watch auto-formatting and debug-statement detection trigger
4. **Read the [Advanced Topics Guide](advanced-topics.md)** — Token optimization, memory, parallelization
5. **Try `/extend`** — Add support for a new language ecosystem

---

## Quick Reference

| Want to... | Do this |
|-----------|---------|
| Set up everything | `/setup` |
| Review code quality | `/code-review` |
| Start with TDD | `/tdd` |
| Fix build errors | `/build-fix` |
| Generate E2E tests | `/e2e` |
| Clean dead code | `/refactor-clean` |
| Plan implementation | `/plan` |
| Generate CI/CD | `/ci-cd` |
| Add new ecosystem | `/extend go` |
| Check test coverage | `/test-coverage` |

---

*This guide covers the foundations. For advanced topics (token optimization, memory persistence, continuous learning, verification loops, parallelization), see the [Advanced Topics Guide](advanced-topics.md).*
