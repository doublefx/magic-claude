---
description: Sequential multi-agent workflow for complex tasks with handoffs
argument-hint: "[workflow-type] [task description]"
---

# Orchestrate Command

Sequential agent workflow for complex tasks. This command provides explicit control over the orchestration pipeline that `magic-claude:proactive-orchestration` handles automatically.

## Usage

`/orchestrate [workflow-type] [task-description]`

## Workflow Types

### feature
Full feature implementation pipeline (same phases as `magic-claude:proactive-orchestration`):
```
[architect] -> discoverer -> planner <-> plan-critic (auto-loop) -> [ui-design] -> tdd (per-task + spec review) -> verify -> review+harden -> simplify -> [deliver] -> report
```

### bugfix
Bug investigation and fix workflow:
```
discoverer (codebase investigation) -> [ts|jvm|python]-tdd-guide -> code-reviewer
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

The `feature` workflow follows the same phases as `magic-claude:proactive-orchestration`:

### Phase 0: ARCHITECT (conditional)
- Only for system design decisions (new services, data models, API contracts, technology selection)
- Invoke **magic-claude:architect** agent (opus) via Task tool
- Skip when the feature is within an existing, well-understood architecture

### Phase 0.5: DISCOVER (always runs)
- Invoke **magic-claude:discoverer** agent (opus) via Task tool
- Searches claude-mem for prior decisions, uses Serena for symbol exploration
- Produces a Discovery Brief with verified facts (affected files, existing patterns, risks)

### Phase 1: PLAN
- Invoke **magic-claude:planner** agent (opus) via Task tool
- Include architect output and Discovery Brief as input context
- Present plan and WAIT for user confirmation

### Phase 1.1: PLAN CRITIC (auto-loop, max 3 cycles)
- Adversarial stress-testing of the draft plan
- Auto-loops between critic and planner to resolve CRITICAL/HIGH issues
- Exits when no CRITICAL/HIGH issues remain or after 3 cycles
- Remaining MEDIUM/LOW findings presented as advisory to user

### Phase 1.5: EVAL DEFINE (opt-in, `--with-evals <name>`)
- Run `magic-claude:eval define <name>` to create capability and regression eval criteria
- Prompt user to review and confirm eval definitions before implementation
- Eval definitions stored in `.claude/evals/<name>.md`

### Phase 1.75: UI DESIGN (conditional)
- Only when plan tasks touch UI files (`.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, `.css`)
- Invoke **magic-claude:ui-design** skill for design context gathering
- Produces a UI Design Spec that feeds into TDD phase

### Phase 2: TDD (per-task loop)
- **Baseline verification** — run test suite first to establish clean baseline
- Detect ecosystem and dispatch to **magic-claude:ts-tdd-guide**, **magic-claude:jvm-tdd-guide**, or **magic-claude:python-tdd-guide**
- For each plan task: TDD agent (RED-GREEN-REFACTOR) -> spec review -> resolve
- Per-task spec review catches drift early (max 2 fix cycles per task)
- Mid-point code review checkpoint if plan has 5+ tasks
- Coverage gate: 80%+ before proceeding

### Phase 3: VERIFY
- Run `magic-claude:verify full` workflow (build, types, lint, tests, debug audit)
- If build fails, auto-invoke appropriate **magic-claude:*-build-resolver** agent
- Re-verify after fixes

### Phase 4: REVIEW + HARDEN (iterative loop, max 3 cycles)
- Invoke **magic-claude:code-reviewer** agent + ecosystem-specific security reviewer
- For language-specific review: **magic-claude:java-reviewer**, **magic-claude:kotlin-reviewer**, **magic-claude:python-reviewer**
- Fix CRITICAL + HIGH issues (mandatory), then MEDIUM issues
- Re-verify and re-review until no MEDIUM+ issues remain
- After 3 cycles: checkpoint with user for decision
- LOW issues: fix if low-risk, skip if not

### Phase 4.5: SIMPLIFY
- Run code simplification on changed files for clarity and maintainability
- Verify simplification doesn't break anything; revert if it does

### Phase 4.6: EVAL CHECK (opt-in, `--with-evals <name>`)
- Run `magic-claude:eval check <name>` to verify implementation meets defined criteria
- Record capability pass@3 and regression pass^3 metrics
- Include eval results in the final report

### Phase 4.7: DELIVER (conditional)
- Execute the delivery strategy from the approved plan:
  - **current-branch** — no action needed
  - **feature-branch-merge** — merge locally, verify tests
  - **feature-branch-pr** — push with `-u`, create PR via `gh pr create`
  - **user-managed** — skip

### Phase 5: REPORT
Produce orchestration report with verdict: **SHIP** / **NEEDS WORK** / **BLOCKED**

If NEEDS WORK, include remediation:

| Issue | Suggested Action |
|-------|-----------------|
| Build errors | "Run `magic-claude:build-fix`" |
| Test failures | "Run `magic-claude:tdd` to fix" |
| Coverage gaps | "Run `magic-claude:test-coverage`" |
| Security issues | "Fix and re-run `magic-claude:code-review`" |
| Eval failures | "Review failing criteria, fix, re-run `magic-claude:eval check <name>`" |

When `--with-evals` is used, include eval metrics in the report:
```
EVALS:    [X/Y capability passing, pass@3: Z%] [X/Y regression passing, pass^3: Z%]
```

Archive orchestration state alongside the plan for audit trail.

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

1. **Start with magic-claude:planner** for complex features
2. **Always include magic-claude:code-reviewer** before merge
3. **Use ecosystem-specific security reviewers** for auth/payment/PII
4. **Keep handoffs concise** - focus on what next agent needs
5. **Run verification** between agents if needed
6. For most feature work, you don't need `magic-claude:orchestrate` -- `magic-claude:proactive-orchestration` fires automatically
