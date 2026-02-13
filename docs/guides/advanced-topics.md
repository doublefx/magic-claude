# Advanced Topics Guide

Token optimization, memory persistence, continuous learning, verification loops, parallelization, and subagent orchestration.

**Prerequisite:** Read the [Foundations Guide](foundations.md) first.

---

## Token Optimization

Context is your most constrained resource. Everything — system prompts, MCP schemas, tool results, conversation history — competes for the same 200k window. Optimizing token usage directly impacts what Claude can do.

### Model Selection

Not every task needs Opus. The plugin assigns models strategically:

| Model | Used For | Why |
|-------|----------|-----|
| **opus** | Architecture, code review, security review, planning | Needs deep reasoning |
| **sonnet** | TDD, build fixing, E2E tests, setup | Good balance of speed and quality |
| **haiku** | Dead code cleanup, doc updates, refactoring | Speed matters, task is bounded |

Agents declare their model in frontmatter. The Task tool can override with the `model` parameter.

### System Prompt Slimming

Every rule, every MCP schema, every hook description consumes context before your conversation even starts.

**Techniques:**
- Disable unused MCP servers per-project via `disabledMcpServers`
- Use `context: fork` on skills to run them in isolated subagent context
- Skills with `user-invocable: false` only load when Claude decides they're relevant
- Keep rules minimal — they load into every conversation

### Background Processes

The Task tool supports `run_in_background: true`. Use this for:
- Long test suite runs
- Build processes
- Parallel research tasks

Background agents don't consume your main conversation context while running.

---

## Memory Persistence

Sessions are ephemeral by default. The plugin adds persistence through hooks.

### How It Works

1. **SessionStart hook** — Loads previous session context, detects project state, injects helpful context
2. **SessionEnd hook** — Persists current session state
3. **PreCompact hook** — Saves state before context compaction (when approaching window limits)

### claude-mem Integration

If the `claude-mem` MCP is installed, agents with the `claude-mem-context` skill can query cross-session historical context:

- Past decisions and their rationale
- Bug patterns and how they were resolved
- Architecture evolution over time
- What was tried and didn't work

This creates genuine learning across sessions — Claude doesn't just start fresh each time.

### Session Context Flow

```
Session N ends
  → SessionEnd hook extracts key decisions, patterns, state
  → State persisted to memory

Session N+1 starts
  → SessionStart hook loads relevant context
  → Claude has awareness of past work
  → Avoids re-investigating solved problems
```

---

## Continuous Learning

The plugin can auto-extract reusable patterns from your sessions and save them as skills.

### The Learning Loop

1. **During work** — Claude identifies patterns (repeated approaches, common fixes, project-specific conventions)
2. **At session end** — The `continuous-learning` skill extracts these into reusable form
3. **In future sessions** — Extracted patterns are available as skills

### Manual Learning

```bash
/learn    # Extract patterns from current session
```

This triggers the `continuous-learning` skill to analyze the current conversation and save useful patterns.

### What Gets Learned

- Project-specific build commands and their quirks
- Common error patterns and their fixes
- Code review patterns specific to the codebase
- Testing strategies that work for the project
- Architectural decisions and their context

---

## Verification Loops

Verification ensures your changes actually work — not just that Claude thinks they work.

### The Verification Flow

```bash
/verify   # Run full verification
```

This runs:
1. **Build** — Does it compile?
2. **Types** — Do types check? (TypeScript/Pyright)
3. **Lint** — Does it pass linting? (ESLint/Ruff/Checkstyle)
4. **Tests** — Do tests pass?
5. **Security** — Any security issues? (Semgrep/SpotBugs)

### Checkpoints

```bash
/checkpoint   # Save current state as verification baseline
```

Checkpoints let you track progress and compare state changes over time. Useful for complex refactors where you want to verify at each step.

### Eval-Driven Development

```bash
/eval   # Define capability/regression evals before coding
```

The eval harness implements a formal evaluation framework:
1. Define what "working" means (capability evals)
2. Define what "not broken" means (regression evals)
3. Implement the feature
4. Run evals to verify

This is particularly powerful for:
- Features with clear acceptance criteria
- Refactors that must preserve behavior
- Bug fixes that need regression prevention

---

## Parallelization

Claude Code can run multiple instances. The key is avoiding conflicts.

### Git Worktrees

The recommended approach for parallel Claude instances:

```bash
# Create worktrees for parallel work
git worktree add ../feature-auth feature/auth
git worktree add ../feature-api feature/api

# Run separate Claude instances in each
cd ../feature-auth && claude
cd ../feature-api && claude
```

Each worktree has its own working directory, so Claude instances don't conflict on file writes.

### The Cascade Method

For tasks that build on each other:

1. Instance A works on the foundation (data model, types)
2. When A commits, Instance B starts on the API layer
3. When B commits, Instance C starts on the UI layer

Each instance has clear boundaries and a committed starting point.

### When to Parallelize

**Good candidates:**
- Independent features on separate branches
- Tests for different modules
- Documentation updates alongside code changes
- Code review while another instance implements fixes

**Bad candidates:**
- Changes to the same files
- Tightly coupled features
- Anything requiring shared state

### Background Agents

Within a single Claude session, use background agents for parallel work:

```
Task tool with run_in_background: true
```

Multiple agents can research, test, or build in parallel while you continue working.

---

## Subagent Orchestration

Subagents are the building block for complex workflows. Understanding how to orchestrate them is key to getting the most out of Claude Code.

### The Context Problem

Your main conversation has full context — it knows what you've discussed, what files you've read, what decisions you've made. A subagent starts fresh with only what you give it.

**The tension:** Give too little context, the agent makes wrong assumptions. Give too much, you waste tokens and the agent gets confused.

### The Iterative Retrieval Pattern

The best agents use iterative retrieval — start with a focused question, then drill deeper based on what they find:

1. Agent gets a focused task description
2. Uses Grep/Glob to find relevant code
3. Reads specific files/functions
4. Makes targeted changes
5. Reports back with what was done

This is why agents have specific tools listed in their frontmatter — `Read, Grep, Glob, Bash` for exploration, `Write, Edit` for changes.

### Orchestration Commands

```bash
/orchestrate   # Sequential multi-agent workflow with structured handoffs
```

The orchestration skill chains agents together:
1. Planner designs the approach
2. TDD agent writes tests
3. Implementation agent writes code
4. Build resolver fixes any errors
5. Code reviewer checks quality

Each handoff passes structured context to the next agent.

### Proactive Agent Selection

Claude automatically selects agents based on context:

- Editing Python? → `python-reviewer` for quality checks
- Build failing? → `python-build-resolver` or `jvm-build-resolver`
- New feature? → `proactive-planning` triggers, then `proactive-tdd`
- Before commit? → `proactive-review` runs quality checks

You don't have to explicitly invoke agents — the skills and hooks trigger them.

---

## Self-Extending Architecture

The plugin can extend itself. When you need support for a new language or ecosystem:

```bash
/extend go    # Generate complete Go ecosystem support
```

This generates:
- **Patterns skill** — Go project structure, tooling, idioms
- **Reviewer agent** — Go code review specialist
- **Build resolver agent** — Fix Go build errors
- **Formatter hook** — Auto-format .go files with gofmt
- **Review command** — `/go-review` slash command
- **Style rule** — Go coding guidelines
- **Ecosystem module** — Auto-discoverable setup/detection integration

All components are cross-linked and use real documentation (fetched via MCP) rather than hallucinated patterns.

### Ecosystem Registry

Ecosystem modules are auto-discovered from three levels:

| Priority | Level | Path |
|----------|-------|------|
| 1 (base) | Plugin | `${CLAUDE_PLUGIN_ROOT}/scripts/lib/ecosystems/` |
| 2 | User | `~/.claude/ecosystems/` |
| 3 (wins) | Project | `./.claude/ecosystems/` |

Drop a single `.cjs` file implementing the `Ecosystem` base class and it's integrated with all setup, detection, and command generation infrastructure. No other files need editing.

---

## Journey Examples

### Journey 1: New Python Project

```bash
# 1. Start Claude Code in your project
cd my-python-project && claude

# 2. Setup detects Python ecosystem
/setup
# → Detects pyproject.toml, checks python3/pip/poetry/ruff

# 3. Implement a feature with TDD
/tdd
# → Writes tests first, then implements, verifies coverage

# 4. Auto-formatting happens on every edit
# → Ruff formats .py files automatically via PostToolUse hook

# 5. Before committing, review quality
/code-review
# → python-reviewer agent checks style, security, patterns

# 6. Verify everything passes
/verify
# → Build, types (Pyright), lint (Ruff), tests (pytest), security (Semgrep)
```

### Journey 2: Java Monorepo with Multiple Modules

```bash
# 1. Setup detects JVM + workspace
/setup
# → Detects pom.xml, checks java/mvn/gradle, identifies workspace structure

# 2. Fix a build failure
/build-fix
# → jvm-build-resolver fixes compilation errors incrementally

# 3. Add E2E tests
/e2e
# → jvm-e2e-runner generates Selenium + REST Assured tests

# 4. Generate CI/CD pipeline
/ci-cd
# → ci-cd-architect creates GitHub Actions with matrix builds for all modules
```

### Journey 3: Adding Go Support

```bash
# 1. Generate Go ecosystem support
/extend go
# → Generates patterns skill, reviewer agent, formatter hook, ecosystem module

# 2. Start working on Go code
# → Hooks auto-format with gofmt, detect fmt.Println debug statements

# 3. Review Go code quality
/go-review
# → Delegates to go-reviewer agent with Go-specific checks
```

---

## Configuration Philosophy

The plugin follows a principle of **intelligent defaults with progressive disclosure**:

1. **Zero config start** — `/setup` detects everything automatically
2. **Proactive assistance** — Hooks and skills trigger without asking
3. **Explicit control when needed** — Granular commands for specific tasks
4. **Extensible** — Add new ecosystems, agents, skills without touching core code

The goal is that Claude works like a senior engineer who knows your stack — not a blank slate you have to configure from scratch every session.

---

*For a hands-on walkthrough of monorepos, hooks, and orchestration, see [Tutorial 05: Advanced Features](../tutorials/05-advanced-features.md). For complete feature documentation, see [FEATURES.md](../FEATURES.md).*
