---
name: agent-teams
description: Guide for Agent Teams coordination when CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS is enabled. Provides pre-configured team scenarios, token cost guard rails, and best practices for parallel multi-agent work. Only activates when the experimental flag is set.
user-invocable: false
---

# Agent Teams - Coordination Guide

Agent Teams coordinate multiple Claude Code instances working together with a shared task list and inter-agent messaging. This skill provides pre-configured scenarios and guard rails for token-efficient team usage.

**Prerequisite:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` must be set in environment or settings.json. This skill should NOT activate if the flag is not set.

## When to Activate

- User explicitly asks for parallel work, team coordination, or multi-agent collaboration
- Claude detects a task that genuinely benefits from parallel exploration (see scenarios below)
- User asks about Agent Teams setup or configuration
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is confirmed active

**DO NOT activate when:**
- The experimental flag is not set
- Tasks are sequential or have many dependencies
- A single session or subagent can handle the work efficiently
- The task involves editing the same files from multiple agents
- Token budget is a concern and the task doesn't justify parallel work

## Decision: Agent Teams vs Subagents vs Orchestrate

| Scenario | Use | Why |
|----------|-----|-----|
| Focused task, result only matters | **Subagent** (Task tool) | Lower tokens, no coordination overhead |
| Sequential pipeline (plan -> code -> test -> review) | **`/orchestrate`** | Structured handoffs, proven workflow |
| Parallel exploration, agents need to talk | **Agent Teams** | Inter-agent messaging, shared task list |
| Quick delegation (research, format, lint) | **Subagent** (Task tool) | Fast, disposable, minimal context |

**Default to subagents.** Only use Agent Teams when parallel exploration with inter-agent communication genuinely adds value.

## Token Cost Guard Rails

Agent Teams consume significantly more tokens than a single session:

- Each teammate maintains its own full context window
- All teammates load CLAUDE.md, MCP configs, and skills at spawn (~7x in plan mode)
- Broadcasts multiply costs by team size

**Mandatory guard rails:**
1. **Max 3 teammates** unless the user explicitly requests more
2. **Focused spawn prompts** - include only task-specific context, not the full project brief
3. **Minimize broadcasts** - use targeted messages to specific teammates instead
4. **Delegate verbose I/O** (tests, logs, large file reads) to subagents within teammates
5. **Set clear completion criteria** so teammates don't churn
6. **Use plan approval** for risky tasks - teammates plan first, lead approves before implementation

## Pre-Configured Team Scenarios

### Scenario 1: Parallel Code Review

3 reviewers examine the same PR/changes from different angles simultaneously.

```
Create an agent team to review the uncommitted changes. Spawn three reviewers:
- "security-reviewer": Focus on security vulnerabilities, injection risks, secrets exposure, and OWASP Top 10
- "quality-reviewer": Focus on code quality, error handling, edge cases, and test coverage
- "perf-reviewer": Focus on performance implications, N+1 queries, memory leaks, and scalability
Have each reviewer report findings with severity ratings. Synthesize into a single review.
```

**Why this works:** Each reviewer applies a different lens independently. No file conflicts. Findings are synthesized by the lead.

**Expected tokens:** ~3-4x a single review session

### Scenario 2: Competing Hypothesis Debugging

Multiple investigators test different theories about a bug in parallel.

```
Users report [describe the bug]. Create an agent team to investigate:
- "hypothesis-1": Investigate whether the issue is in [area A] - check [specific files/logs]
- "hypothesis-2": Investigate whether the issue is in [area B] - check [specific files/logs]
- "hypothesis-3": Investigate whether it's an environment/configuration issue
Have them share findings and challenge each other's theories. Converge on the root cause.
```

**Why this works:** Sequential investigation suffers from anchoring bias. Parallel investigators with adversarial debate find the actual root cause faster.

**Expected tokens:** ~3-5x a single debug session, but faster wall-clock time

### Scenario 3: Cross-Layer Feature Work

Teammates each own a different layer, working on different files simultaneously.

```
Implement [feature description]. Create an agent team:
- "backend": Own src/api/ and src/services/ - implement the API endpoints and business logic
- "frontend": Own src/components/ and src/pages/ - implement the UI components
- "tests": Own tests/ - write integration and E2E tests as the other teammates build
Require plan approval before implementation. No teammate should edit files owned by another.
```

**Why this works:** Clear file ownership prevents conflicts. The tests teammate can start writing test stubs immediately while implementation proceeds.

**Expected tokens:** ~3-4x a single session, but parallel wall-clock time

### Scenario 4: Research and Architecture Exploration

Multiple teammates research different approaches to a design problem.

```
We need to decide on [architectural decision]. Create an agent team:
- "approach-a": Research and prototype [approach A] - evaluate pros/cons/trade-offs
- "approach-b": Research and prototype [approach B] - evaluate pros/cons/trade-offs
- "devil-advocate": Challenge both approaches, find weaknesses, propose alternatives
Synthesize findings into a recommendation with clear trade-offs.
```

**Why this works:** Avoids sequential anchoring. Each approach gets genuine exploration instead of surface comparison.

**Expected tokens:** ~3-5x a single research session

## Quality Gates

Use `TeammateIdle` and `TaskCompleted` hooks to enforce standards:

```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npm test 2>&1 || (echo 'Tests must pass before completing task' >&2 && exit 2)",
            "statusMessage": "Running test gate..."
          }
        ]
      }
    ],
    "TeammateIdle": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint 2>&1 || (echo 'Fix lint errors before stopping' >&2 && exit 2)",
            "statusMessage": "Running lint gate..."
          }
        ]
      }
    ]
  }
}
```

Exit code 2 blocks the action and feeds stderr back as feedback. The teammate/task continues working.

## Display Mode Configuration

| Mode | Set via | Best for |
|------|---------|----------|
| `auto` (default) | `--teammate-mode auto` | Auto-detect: split if in tmux, else in-process |
| `in-process` | `--teammate-mode in-process` | Any terminal. Shift+Up/Down to navigate |
| `tmux` | `--teammate-mode tmux` | tmux/iTerm2. Each teammate in own pane |

Set permanently in settings.json:
```json
{ "teammateMode": "in-process" }
```

## Limitations

- No session resumption with in-process teammates
- One team per session, no nested teams
- Lead is fixed (cannot promote a teammate)
- All teammates start with lead's permission mode
- Split panes not supported in VS Code terminal, Windows Terminal, or Ghostty
- Task status can lag - teammates may not mark tasks as completed
- Shutdown can be slow (teammates finish current request first)

## Anti-Patterns to Avoid

1. **Using teams for sequential work** - Use `/orchestrate` instead
2. **>3 teammates without justification** - Token costs scale linearly
3. **Broadcasting frequently** - Costs multiply by team size
4. **Same-file editing** - Causes overwrites. Enforce file ownership
5. **Running unattended** - Check in on teammates, redirect as needed
6. **Skipping plan approval for risky work** - Require plans for implementation tasks
