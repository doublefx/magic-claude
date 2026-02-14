---
description: Sequential agent workflow for complex tasks - orchestrates multiple specialized agents with structured handoffs
argument-hint: "[workflow-type] [task description]"
---

# Orchestrate Command

Sequential agent workflow for complex tasks. This command provides explicit control over the orchestration pipeline that `proactive-orchestration` handles automatically.

## Usage

`/orchestrate [workflow-type] [task-description]`

## Workflow Types

### feature
Full feature implementation pipeline (same phases as `proactive-orchestration`):
```
planner -> [ts|jvm|python]-tdd-guide -> verify -> code-reviewer -> [ts|jvm|python]-security-reviewer
```

### bugfix
Bug investigation and fix workflow:
```
Explore (codebase investigation) -> [ts|jvm|python]-tdd-guide -> code-reviewer
```

### refactor
Safe refactoring workflow:
```
architect -> code-reviewer -> [ts|jvm|python]-tdd-guide
```

### security
Security-focused review:
```
[ts|jvm|python]-security-reviewer -> code-reviewer -> architect
```

## Execution Pattern

For each agent in the workflow:

1. **Invoke agent** with context from previous agent
2. **Collect output** as structured handoff document
3. **Pass to next agent** in chain
4. **Aggregate results** into final report

## Handoff Document Format

Between agents, create handoff document:

```markdown
## HANDOFF: [previous-agent] -> [next-agent]

### Context
[Summary of what was done]

### Findings
[Key discoveries or decisions]

### Files Modified
[List of files touched]

### Open Questions
[Unresolved items for next agent]

### Recommendations
[Suggested next steps]
```

## Feature Workflow Detail

The `feature` workflow follows the same phases as `proactive-orchestration`:

### Phase 1: PLAN
- Invoke **planner** agent (opus) to analyze requirements
- Present plan and WAIT for user confirmation

### Phase 1.5: EVAL DEFINE (opt-in, `--with-evals <name>`)
- Run `/eval define <name>` to create capability and regression eval criteria
- Prompt user to review and confirm eval definitions before implementation
- Eval definitions stored in `.claude/evals/<name>.md`

### Phase 2: TDD
- Detect ecosystem and dispatch to **ts-tdd-guide**, **jvm-tdd-guide**, or **python-tdd-guide**
- Create task via TaskCreate to track progress
- Execute RED-GREEN-REFACTOR cycle
- Verify 80%+ coverage

### Phase 3: VERIFY
- Run `/verify full` workflow (build, types, lint, tests, debug audit)
- If build fails, auto-invoke appropriate **build-resolver** agent
- Re-verify after fixes

### Phase 4: REVIEW
- Invoke **code-reviewer** agent + ecosystem-specific security reviewer
- For language-specific review: **java-reviewer**, **kotlin-reviewer**, **python-reviewer**
- Mark task completed via TaskUpdate

### Phase 4.5: EVAL CHECK (opt-in, `--with-evals <name>`)
- Run `/eval check <name>` to verify implementation meets defined criteria
- Record capability pass@3 and regression pass^3 metrics
- Include eval results in the final report

### Phase 5: REPORT
Produce orchestration report with verdict: **SHIP** / **NEEDS WORK** / **BLOCKED**

If NEEDS WORK, include remediation:

| Issue | Suggested Action |
|-------|-----------------|
| Build errors | "Run `/build-fix`" |
| Test failures | "Run `/tdd` to fix" |
| Coverage gaps | "Run `/test-coverage`" |
| Security issues | "Fix and re-run `/code-review`" |
| Eval failures | "Review failing criteria, fix, re-run `/eval check <name>`" |

When `--with-evals` is used, include eval metrics in the report:
```
EVALS:    [X/Y capability passing, pass@3: Z%] [X/Y regression passing, pass^3: Z%]
```

## Parallel Execution

For independent checks, run agents in parallel:

```markdown
### Parallel Phase
Run simultaneously:
- code-reviewer (quality)
- security-reviewer (security)
- architect (design)

### Merge Results
Combine outputs into single report
```

## Arguments

$ARGUMENTS:
- `feature <description>` - Full feature workflow (recommended for most tasks)
- `feature --with-evals <name> <description>` - Full feature workflow with eval-driven verification
- `bugfix <description>` - Bug fix workflow
- `refactor <description>` - Refactoring workflow
- `security <description>` - Security review workflow
- `custom <agents> <description>` - Custom agent sequence

## Custom Workflow Example

```
/orchestrate custom "architect,tdd-guide,code-reviewer" "Redesign caching layer"
```

## Tips

1. **Start with planner** for complex features
2. **Always include code-reviewer** before merge
3. **Use security-reviewer** for auth/payment/PII
4. **Keep handoffs concise** - focus on what next agent needs
5. **Run verification** between agents if needed
6. For most feature work, you don't need `/orchestrate` -- `proactive-orchestration` fires automatically
