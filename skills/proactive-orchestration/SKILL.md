---
name: proactive-orchestration
description: "MANDATORY: You MUST invoke this skill INSTEAD OF EnterPlanMode when detecting complex feature requests, multi-file implementations, or architectural changes. NEVER use EnterPlanMode for feature implementation. Only use EnterPlanMode for pure research/exploration or when user explicitly types /plan. Does NOT fire for simple bug fixes, single-file edits, documentation, or refactoring."
user-invocable: false
---

# Proactive Orchestration

## CRITICAL: Overrides EnterPlanMode for Feature Work

This skill **REPLACES** EnterPlanMode for all feature implementation tasks.

- **WRONG**: Using EnterPlanMode when user asks to implement a feature
- **WRONG**: Using EnterPlanMode when user asks to add new functionality
- **WRONG**: Planning without follow-through to TDD, verification, and review

- **CORRECT**: Invoke this skill for any non-trivial feature implementation
- **CORRECT**: Only use EnterPlanMode for pure research/exploration or explicit `magic-claude:plan`

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
- Refactoring (has its own workflow via `magic-claude:refactor-clean`)
- Explicit single-command requests ("run `magic-claude:tdd`", "run `magic-claude:code-review`")
- Pure research or exploration (use EnterPlanMode or Explore agent)
- When user explicitly types `magic-claude:plan` (respect the explicit command)

## Anti-Rationalization

If you catch yourself thinking any of these, STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is a simple feature, no pipeline needed" | If it touches multiple files, it needs the pipeline. |
| "I'll just write the code and add tests after" | That's not TDD. Use the pipeline. |
| "Let me explore the codebase first" | Phase 0/1 handles exploration. Invoke the skill first. |
| "I already know how to implement this" | The plan still needs user approval. Follow the phases. |
| "This doesn't need architecture review" | Phase 0 is conditional — it self-gates. Let it decide. |
| "I'll use EnterPlanMode instead" | EnterPlanMode is for research ONLY. This skill replaces it for code. |

**Violating the letter of the rules is violating the spirit of the rules.**

<HARD-GATE>
Do NOT write any implementation code, scaffold any files, or invoke any TDD
agent until a plan has been presented to the user AND the user has approved it.
This applies to EVERY feature regardless of perceived simplicity.
</HARD-GATE>

## Why No Context Fork

This skill runs in the **main context** (no `context: fork`) because it needs multi-turn user interaction:
- User must confirm the plan before TDD begins
- User may provide feedback between phases
- Task lifecycle (TaskCreate/TaskUpdate) must be visible in main context

## Orchestration Phases

### Phase 0: ARCHITECT (conditional)

**Gate:** Only invoke when the request involves **system design decisions**:
- New services, modules, or major components
- New data models or database schema changes
- API contract design (new endpoints, new protocols)
- Technology or pattern selection (e.g., "should we use WebSockets or SSE?")
- Cross-cutting concerns (authentication, caching, event-driven architecture)
- Scalability or deployment architecture changes

**Skip when:** The request is feature work within an existing, well-understood architecture (e.g., "add a delete button", "add form validation", "implement search filtering").

1. Invoke the **magic-claude:architect** agent (opus) via Task tool
2. The architect produces: architecture proposal, trade-off analysis, and ADRs for key decisions
3. Pass the architect's output as context to Phase 1

### Phase 1: PLAN

1. Invoke the **magic-claude:planner** agent (opus) via Task tool to analyze the request
   - If Phase 0 ran: include the architect's output as input context for the planner
   - The planner translates architecture decisions into actionable implementation steps
   - **If requirements are vague:** the planner will refine them through one-question-at-a-time dialogue before planning
   - **If multiple approaches exist:** the planner will propose 2-3 options with trade-offs and a recommendation
2. Present the implementation plan to the user
3. **WAIT for user confirmation** before proceeding
   - If user confirms: proceed to Phase 2
   - If user says "just do it" or similar: skip plan review, proceed to Phase 2
   - If user modifies the plan: incorporate feedback, re-present if needed
4. **Persist the approved plan** to `.claude/plans/YYYY-MM-DD-<feature-name>.md`
   - This ensures the plan survives session loss, compaction, or exit
   - Record the git SHA at plan approval time for later review context

### Phase 1.5: EVAL DEFINE (opt-in)

When the user includes `--with-evals <name>` or explicitly requests eval-driven development:

1. Run `magic-claude:eval define <name>` to create capability and regression eval criteria based on the approved plan
2. Present eval definitions to user for confirmation
3. Store in `.claude/evals/<name>.md`

**Skip this phase** unless the user explicitly requests evals.

### Phase 2: TDD (Per-Task Loop)

#### 2.0 Baseline Verification

Before starting any implementation:
1. Run the project's test suite to establish a clean baseline
2. Record passing/failing counts
3. If pre-existing failures exist: report to user and ask whether to proceed or fix first

This prevents confusion between pre-existing and newly introduced failures.

#### 2.1 Ecosystem Detection

Detect ecosystem from project markers:
- `package.json` / `tsconfig.json` -> TypeScript/JavaScript -> **magic-claude:ts-tdd-guide**
- `pom.xml` / `build.gradle*` -> JVM -> **magic-claude:jvm-tdd-guide**
- `pyproject.toml` / `setup.py` -> Python -> **magic-claude:python-tdd-guide**

#### 2.2 Per-Task Implementation Loop

For **each task** in the approved plan, execute this cycle:

```
┌─────────────────────────────────────────────────────┐
│  For each plan task:                                │
│                                                     │
│  1. IMPLEMENT — TDD agent (RED → GREEN → REFACTOR)  │
│       ↓                                             │
│  2. SPEC REVIEW — Adversarial verification          │
│       ↓                                             │
│  3a. PASS → commit task, move to next task          │
│  3b. ISSUES → send back to TDD agent → re-review   │
│       (max 2 fix cycles, then escalate to user)     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Step 1: Implement**
1. Create a TaskCreate entry for this specific plan task
2. Invoke the appropriate TDD agent via Task tool
3. The agent follows RED-GREEN-REFACTOR cycle per the `magic-claude:tdd` workflow
4. Agent reports: files modified, tests written, coverage

**Step 2: Spec Review (fail fast)**
1. Invoke a `general-purpose` agent via Task tool using the **spec-reviewer-prompt.md** template
2. Pass: the plan task specification AND the TDD agent's report
3. The spec reviewer reads the actual code independently — does NOT trust the report

**Step 3: Resolve**
- **PASS** — Commit the task's changes, mark TaskUpdate as completed, proceed to next task
- **ISSUES FOUND** — Send the issues list back to the TDD agent for remediation. Re-run spec review after fixes. Max 2 fix cycles per task; if still failing, escalate to user with the specific issues.

**Mid-point review checkpoint**: If the plan has more than 5 tasks, invoke a lightweight **magic-claude:code-reviewer** check after task ~3 to catch cross-task drift early. Fix issues before continuing.

#### 2.3 Coverage Gate

After all tasks complete, verify 80%+ overall coverage before proceeding to Phase 3.

### Phase 3: VERIFY

1. Run verification following the `magic-claude:verify full` workflow:
   - Build check (STOP if fails)
   - Type check
   - Lint check
   - Test suite with coverage
   - Debug statement audit
2. If build or type check fails:
   - Auto-invoke the appropriate build-resolver agent (**magic-claude:ts-build-resolver**, **magic-claude:jvm-build-resolver**, or **magic-claude:python-build-resolver**)
   - Re-run verification after fixes
3. If tests fail: report failures and suggest fixes before proceeding

### Phase 4: REVIEW + HARDEN (iterative)

This phase runs an iterative loop until no MEDIUM+ issues remain.

```
┌──────────────────────────────────────────────────────┐
│  REVIEW + HARDEN LOOP                                │
│                                                      │
│  1. Code review (code-reviewer agent)                │
│       ↓                                              │
│  2. Fix CRITICAL + HIGH issues                       │
│       ↓                                              │
│  3. Fix MEDIUM issues                                │
│       ↓                                              │
│  4. Re-verify (types → lint → tests)                 │
│       ↓                                              │
│  5. Re-review                                        │
│       ↓                                              │
│  6a. MEDIUM+ remain → loop to step 2 (max 3 cycles) │
│  6b. Clean → exit loop                               │
│       ↓                                              │
│  7. LOW issues — fix if low-risk, skip if not        │
└──────────────────────────────────────────────────────┘
```

#### 4.1 Initial Review

1. Invoke **magic-claude:code-reviewer** agent (opus) via Task tool for comprehensive review
   - **Pass plan context**: Include the approved plan from Phase 1 (or read from `.claude/plans/` file) so the reviewer can check plan alignment
   - **Pass git range**: Provide `BASE_SHA..HEAD_SHA` for the changes being reviewed (BASE_SHA recorded at Phase 1 approval)
2. For security-sensitive changes, also invoke the ecosystem-specific security reviewer:
   - **magic-claude:ts-security-reviewer** for TypeScript/JavaScript
   - **magic-claude:jvm-security-reviewer** for JVM
   - **magic-claude:python-security-reviewer** for Python
3. For language-specific idiomatic review, invoke:
   - **magic-claude:java-reviewer** for `.java` files
   - **magic-claude:kotlin-reviewer** for `.kt` files
   - **magic-claude:python-reviewer** for `.py` files

#### 4.2 Harden Loop

Process review feedback using the **`magic-claude:receiving-code-review`** skill — verify before implementing, push back when wrong, YAGNI check suggestions.

**For each cycle (max 3):**

1. **Fix CRITICAL and HIGH issues** — These are mandatory. No exceptions.
2. **Fix MEDIUM issues** — Fix all that are genuine improvements. Push back on false positives.
3. **Re-verify** — Run types → lint → tests. All must pass before continuing.
4. **Re-review** — Invoke code-reviewer again on the changes made during fixes.
5. **Convergence check:**
   - No MEDIUM+ issues remain → **exit loop**
   - MEDIUM+ issues still present → **loop back to step 1**
   - After 3 cycles with remaining issues → **checkpoint with user**:
     - Present the specific unresolved MEDIUM+ issues with context
     - Ask: "Another review+harden round (up to 3 more cycles)?" or "Accept remaining issues and proceed?"
     - If user approves another round → reset cycle counter, loop back to step 1
     - If user accepts remaining issues → exit loop and proceed

**After loop exits:**

6. **LOW issues** — Review remaining LOW severity findings. Fix those that are low-risk and clearly beneficial (naming, minor style). Skip those that would require significant refactoring or are subjective.
7. **Final re-verify** — Run types → lint → tests one last time to confirm the hardened codebase is clean.

### Phase 4.5: SIMPLIFY

After hardening, run code simplification on the changed files to improve clarity and maintainability.

1. **Identify changed files** — Use `git diff --name-only BASE_SHA..HEAD` to get the list of files modified during this orchestration
2. **Invoke code-simplifier** — Run `code-simplifier:code-simplifier` agent via Task tool, passing the list of changed files and instructing it to simplify for clarity, consistency, and maintainability while preserving all functionality
3. **Verify simplification** — Run types → lint → tests. Simplification **must not** break anything.
   - If verification passes → proceed to next phase
   - If verification fails → revert the simplification changes (`git checkout -- <files>`) and report what broke. Do NOT attempt to fix the simplifier's output — the pre-simplification code was already hardened and clean.

### Phase 4.6: EVAL CHECK (opt-in)

When evals were defined in Phase 1.5:

1. Run `magic-claude:eval check <name>` to verify implementation meets criteria
2. Record pass@3 (capability) and pass^3 (regression) metrics
3. Include results in Phase 5 report

**Skip this phase** unless Phase 1.5 was executed.

### Phase 4.7: DELIVER (conditional)

If the approved plan includes a **Delivery Strategy** (from the planner's step 3):

- **current-branch** — No action needed (work is already on the branch)
- **feature-branch-merge** — Merge the feature branch into the base branch locally, verify tests pass on merged result
- **feature-branch-pr** — Push the feature branch with `-u`, create a PR via `gh pr create` with the orchestration report as the PR body
- **user-managed** — Skip; user handles branching

**Skip this phase** if no delivery strategy was recorded or the user said they'd handle it.

### Phase 5: REPORT

Produce a final orchestration report:

```
ORCHESTRATION REPORT
====================

Pipeline: [ARCHITECT] -> PLAN -> [EVAL DEFINE] -> TDD (per-task) -> VERIFY -> REVIEW+HARDEN -> SIMPLIFY -> [EVAL CHECK] -> [DELIVER]
Ecosystem: [TypeScript/JVM/Python]

ARCHITECT:[SKIPPED / architecture proposal + ADRs produced]
PLAN:     [APPROVED by user]
BASELINE: [X tests passing, Y failing / clean]
TDD:      [N tasks completed, X tests written, Y% coverage]
SPEC:     [N/N tasks passed spec review (Z fix cycles)]
VERIFY:   [Build OK, Types OK, Lint OK, Tests X/Y passed]
HARDEN:   [N cycles, X issues fixed (C critical, H high, M medium, L low)]
SIMPLIFY: [Applied / Reverted / N files simplified]
REVIEW:   [APPROVE/WARN/BLOCK — no MEDIUM+ issues remaining]
EVALS:    [X/Y capability, X/Y regression] (if --with-evals)
DELIVER:  [current-branch / merged / PR #N / user-managed / SKIPPED]

Verdict:  SHIP / NEEDS WORK / BLOCKED

Next Steps:
- [If SHIP]: Ready to commit. Run `git add` and `git commit`.
- [If NEEDS WORK]: List specific remediation with commands.
- [If BLOCKED]: List critical blockers that must be resolved.
```

**Verdict criteria:**
- **SHIP** - All phases green, review approved
- **NEEDS WORK** - Minor issues found, list specific `magic-claude:<command>` remediation
- **BLOCKED** - Critical issues (security vulnerabilities, build failures after remediation, review BLOCK)

## Relationship to Other Proactive Skills

This skill is the **top-level orchestrator** for complex feature work. The individual proactive skills handle focused single-phase work:

| Skill | When it fires independently |
|-------|---------------------------|
| `magic-claude:proactive-planning` | Architectural discussions, requirement analysis (no TDD/review needed) |
| `magic-claude:proactive-tdd` | Adding tests to existing code, bug fix with reproduction test |
| `magic-claude:proactive-review` | Pre-commit review, reviewing someone else's code |

When `magic-claude:proactive-orchestration` fires, it subsumes all three phases -- the individual skills should not also fire.

## Related

- `magic-claude:orchestrate` command - Explicit user-invoked orchestration with workflow type variants
- `magic-claude:tdd` command - Standalone TDD workflow
- `magic-claude:code-review` command - Standalone code review
- `magic-claude:verify` command - Standalone verification
- `magic-claude:build-fix` command - Build error resolution
- `magic-claude:architect` agent - System design decisions (Phase 0, conditional)
- `magic-claude:planner` agent - Implementation planning (Phase 1)
- `magic-claude:code-reviewer` agent - Quality and security review
- `magic-claude:*-tdd-guide` agents - Ecosystem-specific TDD specialists
- `magic-claude:*-build-resolver` agents - Ecosystem-specific build error resolution
- `magic-claude:*-security-reviewer` agents - Ecosystem-specific security analysis
- `magic-claude:eval` command - Eval-driven development (opt-in via `--with-evals`)
- `code-simplifier:code-simplifier` agent - Code clarity and maintainability simplification (Phase 4.5)
- `spec-reviewer-prompt.md` - Adversarial spec compliance review template (Phase 2, per-task)
