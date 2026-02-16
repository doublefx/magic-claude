<!-- managed by magic-claude plugin -->
# Agent Orchestration

## Available Agents

Located in `~/.claude/agents/`:

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Implementation planning | Via orchestration Phase 1 or `magic-claude:plan` |
| architect | System design & ADRs | Via orchestration Phase 0 (auto for system design) or standalone |
| ts-tdd-guide | TypeScript/JS TDD | New TS/JS features, bug fixes |
| jvm-tdd-guide | JVM TDD | New Java/Kotlin features, bug fixes |
| python-tdd-guide | Python TDD | New Python features, bug fixes |
| code-reviewer | Ecosystem-aware review | After writing code |
| ts-security-reviewer | TS/JS security | Before commits (TS/JS projects) |
| jvm-security-reviewer | JVM security | Before commits (JVM projects) |
| python-security-reviewer | Python security | Before commits (Python projects) |
| ts-build-resolver | Fix TS/JS build errors | When npm/tsc build fails |
| jvm-build-resolver | Fix JVM build errors | When Maven/Gradle build fails |
| python-build-resolver | Fix Python errors | When pyright/ruff/pytest fails |
| ts-e2e-runner | TS/JS E2E testing | Critical user flows (Playwright) |
| jvm-e2e-runner | JVM E2E testing | Critical user flows (Selenium) |
| python-e2e-runner | Python E2E testing | Critical user flows (pytest-playwright) |
| ts-refactor-cleaner | TS/JS dead code | Code maintenance |
| jvm-refactor-cleaner | JVM dead code | Code maintenance |
| python-refactor-cleaner | Python dead code | Code maintenance |
| doc-updater | Documentation | Updating docs |
| git-sync | Git change analysis | After git pull/merge/rebase (background) |

## Immediate Agent Usage

No user prompt needed:
1. Code just written/modified - Use **magic-claude:code-reviewer** agent
2. Bug fix or new feature - Use appropriate **magic-claude:tdd-guide** agent (ts/jvm/python)
3. Architectural decision - Use **magic-claude:architect** agent
4. After git pull/merge/rebase - Use **magic-claude:git-sync** agent in background

## Parallel Task Execution

ALWAYS use parallel Task execution for independent operations:

```markdown
# GOOD: Parallel execution
Launch 3 agents in parallel:
1. Agent 1: Security analysis of auth.ts
2. Agent 2: Performance review of cache system
3. Agent 3: Type checking of utils.ts

# BAD: Sequential when unnecessary
First agent 1, then agent 2, then agent 3
```

## Multi-Perspective Analysis

For complex problems, use split role sub-agents:
- Factual reviewer
- Senior engineer
- Security expert
- Consistency reviewer
- Redundancy checker
