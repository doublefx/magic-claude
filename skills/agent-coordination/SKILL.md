---
name: agent-coordination
description: Guide for traditional (single-orchestrator) agent delegation. Covers agent catalog, model tier cost awareness, delegation decision framework, parallel vs sequential patterns, and output composition. Use when deciding which agent to invoke or how to structure multi-agent work.
user-invocable: false
---

# Agent Coordination Guide

This skill covers **traditional agent delegation** where a single orchestrator (you) invokes agents via the Task tool. For experimental multi-instance parallel work, see `magic-claude:agent-teams`.

## Delegation Decision Framework

**Do it yourself when:**
- The task takes fewer than ~3 tool calls to complete
- You already have the relevant context loaded (file contents, error messages)
- The task is a simple edit, rename, or one-liner fix
- Agent round-trip overhead would exceed the work itself

**Delegate to an agent when:**
- The task requires deep focused work (TDD cycle, full code review, security audit)
- You need to protect your context window from large outputs (test results, build logs)
- Multiple independent tasks can run in parallel
- The task matches a specialized agent's expertise (build resolution, E2E testing)
- You want an independent perspective (review your own code, verify your assumptions)

**Rule of thumb:** If you're about to read 3+ files and run 5+ commands for a subtask, delegate it.

## Model Tiers and Cost Awareness

Agents are assigned to model tiers based on the depth of reasoning required. Respect these assignments — don't use opus for tasks that sonnet handles well.

### Opus (deepest reasoning, highest cost)

Use for tasks requiring nuanced judgement, architectural thinking, or adversarial analysis.

| Agent | Purpose |
|-------|---------|
| planner | Implementation planning with trade-off analysis |
| architect | System design decisions and ADRs |
| code-reviewer | Ecosystem-aware quality and security review |
| ts/jvm/python-security-reviewer | Vulnerability analysis requiring deep security knowledge |
| java/kotlin/groovy/python-reviewer | Language-idiomatic review with nuanced style judgement |
| ci-cd-architect | CI/CD pipeline design |

### Sonnet (best coding model, balanced cost)

Use for tasks involving code generation, test writing, build fixing, and focused implementation.

| Agent | Purpose |
|-------|---------|
| ts/jvm/python-tdd-guide | TDD cycle: RED -> GREEN -> REFACTOR |
| ts/jvm/python-build-resolver | Fix build, type, and lint errors |
| ts/jvm/python-e2e-runner | E2E test generation and execution |
| gradle-expert | Gradle build optimization |
| maven-expert | Maven dependency management |
| setup-agent | Project setup and configuration |

### Haiku (lightweight, lowest cost)

Use for mechanical tasks with clear inputs and outputs — no deep reasoning needed.

| Agent | Purpose |
|-------|---------|
| ts/jvm/python-refactor-cleaner | Dead code detection and removal |
| doc-updater | Documentation sync from source-of-truth |
| git-sync | Git change analysis (runs in background) |

## Proactive Agent Usage

No user prompt needed for these situations:

1. **Code just written/modified** -> invoke **code-reviewer**
2. **Bug fix or new feature** -> invoke appropriate **tdd-guide** (ts/jvm/python)
3. **Architectural decision** -> invoke **architect**
4. **After git pull/merge/rebase** -> invoke **git-sync** in background
5. **Build fails** -> invoke appropriate **build-resolver** (ts/jvm/python)
6. **Pre-commit on security-sensitive code** -> invoke appropriate **security-reviewer**

## Parallel vs Sequential

### Parallel (independent tasks)

Launch multiple agents in a **single message** when their work doesn't depend on each other:

```
# GOOD: 3 agents in one message
Task 1: security review of auth module
Task 2: language review of new .kt files
Task 3: build-resolver for failing type check
```

Common parallel patterns:
- Security reviewer + language reviewer (different concerns, same code)
- Multiple build-resolvers for different subprojects in a monorepo
- Code review + E2E test generation (review doesn't block test writing)

### Sequential (dependent tasks)

Wait for one agent before launching the next when outputs feed forward:

```
# Step 1: planner produces implementation plan
# Step 2: tdd-guide implements each plan task (needs the plan)
# Step 3: code-reviewer reviews the implementation (needs the code)
```

The orchestration pipeline (proactive-orchestration) handles this automatically for feature work.

### Mixed

Many real workflows combine both:

```
# Sequential: plan first
Step 1: planner -> approved plan

# Parallel: implement independent tasks
Step 2a: tdd-guide for task 1
Step 2b: tdd-guide for task 2

# Sequential: review after implementation
Step 3: code-reviewer on all changes
```

## Output Composition

When one agent's output feeds another:

1. **Summarize, don't forward verbatim** — extract the relevant parts (file list, issue list, key decisions) rather than passing the full agent output
2. **Include context the next agent needs** — plan tasks for tdd-guide, git range for code-reviewer, error messages for build-resolver
3. **Don't trust agent reports blindly** — verify claims independently (the spec-reviewer pattern in orchestration exists for this reason)

## Agent Selection by Task Type

| Task | Agent | Model |
|------|-------|-------|
| "Plan how to implement X" | planner | opus |
| "Design the architecture for X" | architect | opus |
| "Add feature X with tests" | ts/jvm/python-tdd-guide | sonnet |
| "Review this code" | code-reviewer | opus |
| "Fix this build error" | ts/jvm/python-build-resolver | sonnet |
| "Check for security issues" | ts/jvm/python-security-reviewer | opus |
| "Review Java style" | java-reviewer | opus |
| "Review Kotlin idioms" | kotlin-reviewer | opus |
| "Review Python quality" | python-reviewer | opus |
| "Review Groovy/Spock" | groovy-reviewer | opus |
| "Run E2E tests" | ts/jvm/python-e2e-runner | sonnet |
| "Remove dead code" | ts/jvm/python-refactor-cleaner | haiku |
| "Update docs" | doc-updater | haiku |
| "Analyze git changes" | git-sync | haiku |
| "Set up CI/CD pipeline" | ci-cd-architect | opus |
| "Optimize Gradle build" | gradle-expert | sonnet |
| "Fix Maven dependencies" | maven-expert | sonnet |
| "Set up project" | setup-agent | sonnet |
