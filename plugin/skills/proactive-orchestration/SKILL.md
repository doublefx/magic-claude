---
name: proactive-orchestration
description: >
  Invoke for any substantial "build it" request — when a user wants a new feature implemented end-to-end, not just explained or reviewed. Trigger on: adding authentication, building dashboards, implementing background jobs, setting up search, adding real-time features, creating APIs or endpoints, integrating new services, or any multi-component feature that requires planning before coding. This skill runs the full implementation pipeline from architecture through TDD to delivery. NEVER use EnterPlanMode for feature implementation — invoke this skill instead.

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

## Orchestration State Persistence

The pipeline is designed to **survive context compaction, session crashes, and `/clear`** by persisting state to disk.

### State File

Active state lives at `.claude/orchestration-state.md` during the pipeline. Update this file after every phase transition.

> State file template: see [references/orchestration-state.md](references/orchestration-state.md).

### Lifecycle

1. **Created** — At pipeline start (before Phase 0), write initial state
2. **Updated — AFTER EVERY PHASE AND SUB-PHASE** — Update the Phase field and phase summary line immediately when a phase completes, BEFORE starting the next phase. This is NOT optional — skipping a state update means compaction kills the pipeline.
3. **Survives compaction** — After compaction, read `.claude/orchestration-state.md` to restore phase context. The plan is at the path in the state file.
4. **Archived on completion** — In Phase 5 (REPORT), move to `.claude/plans/<date>-<feature>.state.md` alongside the plan
5. **Overwritten on next pipeline** — A new orchestration overwrites the active state file

**CRITICAL RULE:** Every phase section below includes an explicit `**Update state →**` step. If you skip it, the next compaction destroys the pipeline. Treat state updates like saving a game — do it before every boss fight.

### Crash Recovery

**At pipeline start or after context recovery, check for an orphaned state file:**

1. If `.claude/orchestration-state.md` exists:
   - Read the state file and the plan from the recorded path
   - **After compaction (compressed context references this feature):** Auto-resume from the recorded phase. Do NOT ask the user — they were just working on this and expect you to continue.
   - **New session or /clear (no context about this feature):** Present to user: "Found incomplete orchestration for **<feature>** (Phase <N>, task <X/Y>). Resume or start fresh?"
     - If resume: restore phase context, continue from the recorded phase
     - If start fresh: delete the state file, proceed normally
2. If no state file exists: proceed normally

### Context Recovery After Compaction

Claude cannot programmatically invoke `/compact` or `/clear` — these are user-invoked CLI commands. Instead, the pipeline relies on **automatic recovery**:

1. **Auto-compaction** occurs naturally at ~95% context capacity. The `using-magic-claude` meta-skill (re-injected by SessionStart hook) detects the orphaned state file and triggers re-invocation of this skill.
2. **User-initiated `/compact`**: After plan approval, suggest to the user: *"The planning phase consumed significant context. You can run `/compact` now to free up space for implementation, or continue — the state file will ensure recovery if auto-compaction occurs."* Do NOT claim to run `/compact` yourself.
3. **PreCompact hook**: Detects active orchestration and logs reminders about the state file, ensuring post-compaction recovery guidance is visible.

In all cases, the plan and state file on disk ensure the pipeline can resume from the correct phase.

## Orchestration Phases

> See [references/pipeline-diagram.md](references/pipeline-diagram.md) for the full phase flow diagram.

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
3. **Update state →** Set `Phase: ARCHITECT completed`, update ARCHITECT summary line
4. Pass the architect's output as context to Phase 0.5

### Phase 0.5: DISCOVER (always runs)

Grounds the planning phase in verified codebase facts. Prevents hallucinated file paths, non-existent APIs, and missed existing patterns.

1. Invoke the **magic-claude:discoverer** agent (opus) via Task tool
   - If Phase 0 ran: include the architect's output so the discoverer knows what areas to focus on
   - The discoverer searches claude-mem for prior decisions about this feature area
   - Uses Serena to explore affected symbols, find similar implementations, map dependencies
2. The discoverer produces a **Discovery Brief** with verified facts:
   - Prior context (past decisions, bug patterns from claude-mem)
   - Affected files and symbols (verified via Serena)
   - Existing patterns and reusable code
   - Dependencies and integration points
   - Risks and constraints (with confidence levels)
3. **Update state →** Set `Phase: DISCOVER completed`, update DISCOVER summary line with file/pattern/risk counts
4. Pass the Discovery Brief as input context to Phase 1 (PLAN)

**Lightweight by default:** For simple features, discovery takes ~30s (quick claude-mem search + targeted Serena lookup). For complex features touching many files, discovery scales up naturally as more symbols need exploration.

### Phase 1: PLAN

1. Invoke the **magic-claude:planner** agent (opus) via Task tool to analyze the request
   - If Phase 0 ran: include the architect's output as input context for the planner
   - If Phase 0.5 ran: include the Discovery Brief as input context — the planner uses verified facts to ground file paths, symbol references, and pattern decisions
   - The planner translates architecture decisions into actionable implementation steps
   - **If requirements are vague:** the planner will refine them through one-question-at-a-time dialogue before planning
   - **If multiple approaches exist:** the planner will propose 2-3 options with trade-offs and a recommendation
2. **Update state →** Set `Phase: PLAN — draft produced, entering critic auto-loop`, update PLAN summary line
3. Pass the draft plan to Phase 1.1 (PLAN CRITIC auto-loop) for iterative refinement
4. After the auto-loop converges (or exhausts 3 cycles), present the **refined plan** AND final critic findings to the user
5. **WAIT for user confirmation** before proceeding
   - If user confirms: proceed to Phase 1.5/2
   - If user says "just do it" or similar: skip plan review, proceed to Phase 1.5/2
   - If user requests further changes: loop back to step 1 with user feedback, then re-enter the critic auto-loop
   - If user modifies the plan: incorporate feedback, re-present if needed
6. **Persist the approved plan** to `.claude/plans/YYYY-MM-DD-<feature-name>.md`
   - This ensures the plan survives session loss, compaction, or exit
   - Record the git SHA at plan approval time for later review context
7. **Update state →** Set `Phase: PLAN APPROVED`, write plan path, base SHA, critic summary, and user decisions to `.claude/orchestration-state.md`
8. **Suggest compact** — Inform the user: *"Planning phase complete. You can run `/compact` to free context for implementation, or continue as-is — the state file ensures recovery if auto-compaction occurs."* Do NOT attempt to run `/compact` programmatically.

### Phase 1.1: PLAN CRITIC (auto-loop, max 3 cycles)

Iteratively stress-tests and refines the draft plan before user approval. Uses BMAD's adversarial mandate: "Must find issues. Zero findings triggers re-analysis."

The planner and critic iterate automatically to produce a refined plan. The user sees the final result, not the intermediate back-and-forth.

```
┌──────────────────────────────────────────────────────┐
│  PLAN ↔ CRITIC AUTO-LOOP (max 3 cycles)              │
│                                                      │
│  1. CRITIC reviews the draft plan (adversarial)      │
│       ↓                                              │
│  2. Check findings:                                  │
│     - No CRITICAL/HIGH issues → EXIT (present to     │
│       user with remaining MEDIUM/LOW findings)       │
│     - CRITICAL/HIGH issues found → continue to 3     │
│       ↓                                              │
│  3. REVISE plan — planner incorporates critic        │
│     feedback, fixes CRITICAL/HIGH issues             │
│       ↓                                              │
│  4. Cycle check:                                     │
│     - ≤ 3 cycles → loop back to step 1              │
│     - > 3 cycles → EXIT (present to user with        │
│       remaining unresolved findings highlighted)     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Each cycle:**

1. Invoke a `general-purpose` agent via Task tool using the **plan-critic-prompt.md** template
2. Pass: the current draft plan, the Discovery Brief (if available), and prior cycle feedback (if any)
3. **Update state →** Set `Phase: CRITIC — cycle N/3, evaluating`, update CRITIC summary line with cycle count and findings
4. The critic reviews for:
   - **Feasibility** — Do referenced files/APIs/dependencies actually exist? (Cross-reference against Discovery Brief)
   - **Completeness** — Missing edge cases, error paths, integration points?
   - **Risk** — What assumptions could be wrong? What are the backward compatibility implications?
   - **Ordering** — Hidden dependencies between steps? Incorrect sequencing?
   - **Negative constraints** — Does the plan say what NOT to do?
5. The critic produces severity-classified findings (CRITICAL/HIGH/MEDIUM/LOW) with confidence levels

**Exit conditions (checked after each cycle):**
- **Early exit — no CRITICAL/HIGH issues:** If the critic finds only MEDIUM/LOW issues, exit the loop immediately. Present the plan to the user with remaining MEDIUM/LOW findings as advisory notes.
- **Issues resolved — converged:** If the revised plan addresses all CRITICAL/HIGH issues from the previous cycle, exit and present to the user.
- **Max cycles reached (3):** Exit the loop regardless. Present the plan to the user with any unresolved CRITICAL/HIGH findings **prominently highlighted** so the user can decide whether to proceed or request further revision.

**Revision step (between cycles):**
- Invoke the **magic-claude:planner** agent again with the critic's findings as additional input
- The planner revises the plan to address CRITICAL and HIGH issues specifically
- The planner does NOT need to address MEDIUM/LOW findings during auto-loop — those are advisory for the user
- Each revision focuses narrowly on the critic's feedback; it does not restart planning from scratch

**Presentation to user (after loop exits):**
- Present the refined plan with a summary of the auto-loop process (e.g., "Plan refined through 2 critic cycles")
- CRITICAL findings still unresolved (if any): highlight prominently — may require user intervention
- HIGH findings still unresolved (if any): present for user judgment
- MEDIUM/LOW findings: present as advisory notes
- The user can still request manual revision, which loops back to Phase 1 with user feedback

**Human filtering required:** The critic is instructed to find problems, so it will find problems — including false positives. The auto-loop handles clear-cut CRITICAL/HIGH issues automatically; ambiguous findings and MEDIUM/LOW items are left for the user.

### Phase 1.5: EVAL DEFINE (opt-in)

When the user includes `--with-evals <name>` or explicitly requests eval-driven development:

1. **Update state →** Set `Phase: EVAL DEFINE`
2. Run `magic-claude:eval define <name>` to create capability and regression eval criteria based on the approved plan
3. Present eval definitions to user for confirmation
4. Store in `.claude/evals/<name>.md`

**Skip this phase** unless the user explicitly requests evals.

### Phase 1.75: UI DESIGN (conditional)

**Gate:** Advisory with user opt-out. Claude evaluates:
- Plan tasks touch `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, or `.css` files
- Plan mentions UI components, screens, layouts, or visual elements
- Feature description includes "design", "mockup", "wireframe", "UI", "layout"

If triggered, present a one-line advisory: "This feature involves UI work. Running UI Design phase. Say 'skip' to skip."
Default action = proceed. User says "skip" → go directly to Phase 2.

**Skip when:** The feature is purely backend, CLI, infrastructure, or DevOps.

1. **Update state →** Set `Phase: UI DESIGN`
2. Invoke the **magic-claude:ui-design** skill to orchestrate design context gathering
3. The skill runs `detect-tools.cjs` to discover available design MCP tools and presents them
4. If no design tools are installed, present installation options (user decides whether to install or proceed without)
5. Gather design context through layered fallback (MCP errors treated as "unavailable", fall to next layer):
   - Design MCP → Component Library MCP → Screenshot analysis → `frontend-design:frontend-design` plugin skill (if installed) → Claude built-in design knowledge (final fallback)
6. Respect architectural decisions from Phase 0/1. Do not override component library choices, framework, or design system selections already in the plan
7. Produce a **UI Design Spec** with confidence indicator `[MCP/screenshot/inference-only]`
8. **Persist spec** to `.claude/design-specs/YYYY-MM-DD-<feature-name>.md`
9. Pass the spec as context to Phase 2 (TDD). No separate user approval for the spec — it flows directly into TDD

### Phase 2: TDD (Per-Task Loop)

#### 2.0 Baseline Verification

Before starting any implementation:
1. **Update state →** Set `Phase: TDD — baseline verification`
2. Run the project's test suite to establish a clean baseline
3. Record passing/failing counts
4. If pre-existing failures exist: report to user and ask whether to proceed or fix first

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
- **PASS** — Commit the task's changes, mark TaskUpdate as completed, **update state →** set `Current Task` to next task and update TDD summary line (N/M tasks, X tests, Y% coverage). Proceed to next task.
- **ISSUES FOUND** — Send the issues list back to the TDD agent for remediation. Re-run spec review after fixes. Max 2 fix cycles per task; if still failing, escalate to user with the specific issues.

**Mid-point review checkpoint**: If the plan has more than 5 tasks, invoke a lightweight **magic-claude:code-reviewer** check after task ~3 to catch cross-task drift early. Fix issues before continuing.

#### 2.3 Coverage Gate

After all tasks complete, verify 80%+ overall coverage before proceeding to Phase 3.

### Phase 3: VERIFY

1. **Update state →** Set `Phase: VERIFY`
2. Run verification following the `magic-claude:verify full` workflow:
   - Build check (STOP if fails)
   - Type check
   - Lint check
   - Test suite with coverage
   - Debug statement audit
3. If build or type check fails:
   - Auto-invoke the appropriate build-resolver agent (**magic-claude:ts-build-resolver**, **magic-claude:jvm-build-resolver**, or **magic-claude:python-build-resolver**)
   - Re-run verification after fixes
4. If tests fail: report failures and suggest fixes before proceeding

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

1. **Update state →** Set `Phase: REVIEW+HARDEN`
2. Invoke **magic-claude:code-reviewer** agent (opus) via Task tool for comprehensive review
   - **Pass plan context**: Include the approved plan from Phase 1 (or read from `.claude/plans/` file) so the reviewer can check plan alignment
   - **Pass git range**: Provide `BASE_SHA..HEAD_SHA` for the changes being reviewed (BASE_SHA recorded at Phase 1 approval)
3. For security-sensitive changes, also invoke the ecosystem-specific security reviewer:
   - **magic-claude:ts-security-reviewer** for TypeScript/JavaScript
   - **magic-claude:jvm-security-reviewer** for JVM
   - **magic-claude:python-security-reviewer** for Python
4. For language-specific idiomatic review, invoke:
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

1. **Update state →** Set `Phase: SIMPLIFY`
2. **Identify changed files** — Use `git diff --name-only BASE_SHA..HEAD` to get the list of files modified during this orchestration
3. **Invoke code-simplifier** — Run `code-simplifier:code-simplifier` agent via Task tool, passing the list of changed files and instructing it to simplify for clarity, consistency, and maintainability while preserving all functionality
4. **Verify simplification** — Run types → lint → tests. Simplification **must not** break anything.
   - If verification passes → proceed to next phase
   - If verification fails → **attempt to fix** the issues (invoke appropriate build-resolver agent or fix manually). Re-verify after fixes.
   - If fix succeeds → proceed to next phase
   - If fix fails → **revert** the simplification changes (`git checkout -- <files>`) and report what broke. The pre-simplification code was already hardened and clean — losing simplification is acceptable, losing correctness is not.

### Phase 4.6: EVAL CHECK (opt-in)

When evals were defined in Phase 1.5:

1. Run `magic-claude:eval check <name>` to verify implementation meets criteria
2. Record pass@3 (capability) and pass^3 (regression) metrics
3. Include results in Phase 5 report

**Skip this phase** unless Phase 1.5 was executed.

### Phase 4.7: DELIVER (conditional)

1. **Update state →** Set `Phase: DELIVER`

If the approved plan includes a **Delivery Strategy** (from the planner's step 3):

- **current-branch** — No action needed (work is already on the branch)
- **feature-branch-merge** — Merge the feature branch into the base branch locally, verify tests pass on merged result
- **feature-branch-pr** — Push the feature branch with `-u`, create a PR via `gh pr create` with the orchestration report as the PR body
- **user-managed** — Skip; user handles branching

**Documentation check (all strategies):** Before delivering, verify that any doc update tasks from the plan were completed. If the plan included documentation tasks that weren't executed, flag them as incomplete in the orchestration report. If the plan explicitly noted "No documentation changes required," skip this check.

**Skip this phase** if no delivery strategy was recorded or the user said they'd handle it.

### Phase 5: REPORT

Produce a final orchestration report:

> Report template: see [references/report-template.md](references/report-template.md).

**Verdict criteria:**
- **SHIP** - All phases green, review approved
- **NEEDS WORK** - Minor issues found, list specific `magic-claude:<command>` remediation
- **BLOCKED** - Critical issues (security vulnerabilities, build failures after remediation, review BLOCK)

**Archive orchestration state:**
After producing the report, archive the state file alongside the plan:
1. Move `.claude/orchestration-state.md` to `.claude/plans/YYYY-MM-DD-<feature-name>.state.md`
2. This serves as an audit trail (critic cycles, harden rounds, coverage, timing)
3. If verdict is NEEDS WORK or BLOCKED, keep the active state file as-is (pipeline is not complete)

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
- `magic-claude:discoverer` agent - Codebase discovery and research (Phase 0.5)
- `magic-claude:planner` agent - Implementation planning (Phase 1)
- `magic-claude:plan-critic` agent - Adversarial plan review (Phase 1.1, via plan-critic-prompt.md)
- `plan-critic-prompt.md` - Adversarial plan review template (Phase 1.1)
- `magic-claude:code-reviewer` agent - Quality and security review
- `magic-claude:*-tdd-guide` agents - Ecosystem-specific TDD specialists
- `magic-claude:*-build-resolver` agents - Ecosystem-specific build error resolution
- `magic-claude:*-security-reviewer` agents - Ecosystem-specific security analysis
- `magic-claude:eval` command - Eval-driven development (opt-in via `--with-evals`)
- `code-simplifier:code-simplifier` agent - Code clarity and maintainability simplification (Phase 4.5)
- `spec-reviewer-prompt.md` - Adversarial spec compliance review template (Phase 2, per-task)
- `magic-claude:ui-design` skill - UI design context gathering (Phase 1.75, conditional)
- `frontend-design:frontend-design` plugin skill - Design thinking framework (invoked by ui-design)
