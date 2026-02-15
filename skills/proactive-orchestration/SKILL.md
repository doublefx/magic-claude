---
name: proactive-orchestration
description: "MANDATORY for complex features: You MUST invoke this skill INSTEAD OF EnterPlanMode when detecting complex feature requests, multi-file implementations, or architectural changes. NEVER use EnterPlanMode for feature implementation - use this orchestrator which coordinates PLAN -> TDD -> VERIFY -> REVIEW in sequence. Only use EnterPlanMode for pure research/exploration tasks or when user explicitly types /plan. Does NOT fire for simple bug fixes, single-file edits, documentation, or refactoring."
user-invocable: false
---

# Proactive Orchestration

## CRITICAL: Overrides EnterPlanMode for Feature Work

This skill **REPLACES** EnterPlanMode for all feature implementation tasks.

- **WRONG**: Using EnterPlanMode when user asks to implement a feature
- **WRONG**: Using EnterPlanMode when user asks to add new functionality
- **WRONG**: Planning without follow-through to TDD, verification, and review

- **CORRECT**: Invoke this skill for any non-trivial feature implementation
- **CORRECT**: Only use EnterPlanMode for pure research/exploration or explicit `/plan`

## When Claude MUST Invoke This Skill

**MUST trigger when detecting:**
- Complex feature requests involving multiple components or files
- Architectural changes (new endpoints, new services, new modules)
- "Add", "implement", "build", "create" combined with non-trivial scope indicators
- Multi-step feature descriptions requiring planning before coding
- Any request where you would normally use EnterPlanMode AND the task involves writing code

**MUST NOT trigger on:**
- Simple bug fixes ("fix this null pointer", "handle the null case")
- Single-file edits ("update this function", "rename this variable")
- Documentation tasks ("update the README", "add JSDoc")
- Configuration changes ("update tsconfig", "add dependency")
- Refactoring (has its own workflow via `/refactor-clean`)
- Explicit single-command requests ("run /tdd", "run /code-review")
- Pure research or exploration (use EnterPlanMode or Explore agent)
- When user explicitly types `/plan` (respect the explicit command)

## Why No Context Fork

This skill runs in the **main context** (no `context: fork`) because it needs multi-turn user interaction:
- User must confirm the plan before TDD begins
- User may provide feedback between phases
- Task lifecycle (TaskCreate/TaskUpdate) must be visible in main context

## Orchestration Phases

### Phase 1: PLAN

1. Invoke the **planner** agent (opus) via Task tool to analyze the request
2. Present the implementation plan to the user
3. **WAIT for user confirmation** before proceeding
   - If user confirms: proceed to Phase 2
   - If user says "just do it" or similar: skip plan review, proceed to Phase 2
   - If user modifies the plan: incorporate feedback, re-present if needed

### Phase 1.5: EVAL DEFINE (opt-in)

When the user includes `--with-evals <name>` or explicitly requests eval-driven development:

1. Run `/eval define <name>` to create capability and regression eval criteria based on the approved plan
2. Present eval definitions to user for confirmation
3. Store in `.claude/evals/<name>.md`

**Skip this phase** unless the user explicitly requests evals.

### Phase 2: TDD

1. Detect ecosystem from project markers:
   - `package.json` / `tsconfig.json` -> TypeScript/JavaScript -> **ts-tdd-guide**
   - `pom.xml` / `build.gradle*` -> JVM -> **jvm-tdd-guide**
   - `pyproject.toml` / `setup.py` -> Python -> **python-tdd-guide**
2. Create a task via TaskCreate to track progress
3. Invoke the appropriate TDD agent via Task tool
4. The agent follows RED-GREEN-REFACTOR cycle per the `/tdd` command workflow
5. Verify 80%+ coverage before proceeding

### Phase 3: VERIFY

1. Run verification following the `/verify full` workflow:
   - Build check (STOP if fails)
   - Type check
   - Lint check
   - Test suite with coverage
   - Debug statement audit
2. If build or type check fails:
   - Auto-invoke the appropriate build-resolver agent (**ts-build-resolver**, **jvm-build-resolver**, or **python-build-resolver**)
   - Re-run verification after fixes
3. If tests fail: report failures and suggest fixes before proceeding

### Phase 4: REVIEW

1. Invoke **code-reviewer** agent (opus) via Task tool for comprehensive review
2. For security-sensitive changes, also invoke the ecosystem-specific security reviewer:
   - **ts-security-reviewer** for TypeScript/JavaScript
   - **jvm-security-reviewer** for JVM
   - **python-security-reviewer** for Python
3. For language-specific idiomatic review, invoke:
   - **java-reviewer** for `.java` files
   - **kotlin-reviewer** for `.kt` files
   - **python-reviewer** for `.py` files
4. Mark task as completed via TaskUpdate

### Phase 4.5: EVAL CHECK (opt-in)

When evals were defined in Phase 1.5:

1. Run `/eval check <name>` to verify implementation meets criteria
2. Record pass@3 (capability) and pass^3 (regression) metrics
3. Include results in Phase 5 report

**Skip this phase** unless Phase 1.5 was executed.

### Phase 5: REPORT

Produce a final orchestration report:

```
ORCHESTRATION REPORT
====================

Pipeline: PLAN -> [EVAL DEFINE] -> TDD -> VERIFY -> REVIEW -> [EVAL CHECK]
Ecosystem: [TypeScript/JVM/Python]

PLAN:     [APPROVED by user]
TDD:      [X tests written, Y% coverage]
VERIFY:   [Build OK, Types OK, Lint OK, Tests X/Y passed]
REVIEW:   [APPROVE/WARN/BLOCK]
EVALS:    [X/Y capability, X/Y regression] (if --with-evals)

Verdict:  SHIP / NEEDS WORK / BLOCKED

Next Steps:
- [If SHIP]: Ready to commit. Run `git add` and `git commit`.
- [If NEEDS WORK]: List specific remediation with commands.
- [If BLOCKED]: List critical blockers that must be resolved.
```

**Verdict criteria:**
- **SHIP** - All phases green, review approved
- **NEEDS WORK** - Minor issues found, list specific `/command` remediation
- **BLOCKED** - Critical issues (security vulnerabilities, build failures after remediation, review BLOCK)

## Relationship to Other Proactive Skills

This skill is the **top-level orchestrator** for complex feature work. The individual proactive skills handle focused single-phase work:

| Skill | When it fires independently |
|-------|---------------------------|
| `proactive-planning` | Architectural discussions, requirement analysis (no TDD/review needed) |
| `proactive-tdd` | Adding tests to existing code, bug fix with reproduction test |
| `proactive-review` | Pre-commit review, reviewing someone else's code |

When `proactive-orchestration` fires, it subsumes all three phases -- the individual skills should not also fire.

## Related

- `/orchestrate` command - Explicit user-invoked orchestration with workflow type variants
- `/tdd` command - Standalone TDD workflow
- `/code-review` command - Standalone code review
- `/verify` command - Standalone verification
- `/build-fix` command - Build error resolution
- `planner` agent - Implementation planning
- `code-reviewer` agent - Quality and security review
- `*-tdd-guide` agents - Ecosystem-specific TDD specialists
- `*-build-resolver` agents - Ecosystem-specific build error resolution
- `*-security-reviewer` agents - Ecosystem-specific security analysis
- `/eval` command - Eval-driven development (opt-in via `--with-evals`)
