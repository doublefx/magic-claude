---
name: proactive-orchestration
description: Automatically orchestrates the full development pipeline when Claude detects complex feature requests, multi-file implementations, or architectural changes. Coordinates planning, TDD, verification, and review in sequence. Fires for non-trivial feature work. Does NOT fire for simple bug fixes, single-file edits, documentation, or refactoring.
user-invocable: false
---

# Proactive Orchestration

Automatically orchestrates the full development pipeline for complex feature work. Coordinates planning, TDD, verification, and review in sequence with user confirmation gates between phases.

## When Claude Should Invoke This Skill

**MUST trigger when detecting:**
- Complex feature requests involving multiple components or files
- Architectural changes (new endpoints, new services, new modules)
- "Add", "implement", "build", "create" combined with non-trivial scope indicators
- Multi-step feature descriptions requiring planning before coding

**MUST NOT trigger on:**
- Simple bug fixes ("fix this null pointer", "handle the null case")
- Single-file edits ("update this function", "rename this variable")
- Documentation tasks ("update the README", "add JSDoc")
- Configuration changes ("update tsconfig", "add dependency")
- Refactoring (has its own workflow via `/refactor-clean`)
- Explicit single-command requests ("run /tdd", "run /code-review")

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

### Phase 5: REPORT

Produce a final orchestration report:

```
ORCHESTRATION REPORT
====================

Pipeline: PLAN -> TDD -> VERIFY -> REVIEW
Ecosystem: [TypeScript/JVM/Python]

PLAN:     [APPROVED by user]
TDD:      [X tests written, Y% coverage]
VERIFY:   [Build OK, Types OK, Lint OK, Tests X/Y passed]
REVIEW:   [APPROVE/WARN/BLOCK]

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
