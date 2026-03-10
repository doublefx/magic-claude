---
name: craft
description: >
  The default pipeline for ALL code changes — features, bug fixes, TDD, and any implementation work. Invoke whenever code will be written or modified, regardless of perceived complexity. Even "simple" fixes cause regressions, type errors, lint issues, and missed code reuse without the full quality tail. Starts with Quick Discover (Phase 1.1) — a lightweight impact scan that determines LITE vs FULL mode based on actual fan-out analysis, not guesswork. LITE (isolated, ≤2 files — TDD → VERIFY → REVIEW) or FULL (wider impact — DEEP DISCOVER → PLAN → PLAN CRITIC → TDD → VERIFY → REVIEW+HARDEN → SIMPLIFY → DELIVER). NEVER use EnterPlanMode for code work — invoke this skill instead. Also triggers for: adding authentication, integrating services, building APIs, dashboards, background jobs, or any "add/build/create/implement/fix" request.

---

# Craft

## CRITICAL: The Default Pipeline for All Code

This skill is the **single entry point** for all code changes. Even small fixes need verification, type checking, and review — experience shows that skipping these causes regressions.

- **WRONG**: Writing code without invoking this skill
- **WRONG**: Using EnterPlanMode when code will be written
- **WRONG**: Using `/tdd` alone without verification and review
- **WRONG**: Assuming a "simple" fix doesn't need the quality tail

- **CORRECT**: Invoke this skill for ANY code change
- **CORRECT**: Only use EnterPlanMode for pure research/exploration (no code)
- **CORRECT**: Use `/code-review` standalone only for reviewing code you didn't write

## Mode Selection (Impact-Informed Gate)

Mode selection happens **AFTER** the Quick Discover phase (Phase 1.1), not before. You cannot assess scope without first understanding impact.

```
┌──────────────────────────────────────────────────────┐
│  Phase 1.1: QUICK DISCOVER (always runs)              │
│    Impact scan → fan-out analysis → pattern check    │
│                                                      │
│  Gate decision (based on Quick Discover results):    │
│                                                      │
│  LITE — ALL of these must be true:                   │
│    • Impact fan-out ≤3 call sites, all tested        │
│    • No similar patterns elsewhere that need fixing  │
│    • Change is isolated (no cross-module deps)       │
│    • ≤2 files modified, ≤20 lines changed            │
│                                                      │
│  FULL — ANY of these triggers full pipeline:         │
│    • Impact fan-out >3 call sites                    │
│    • Untested callers found                          │
│    • Similar patterns exist elsewhere                │
│    • Cross-module dependencies detected              │
│    • >2 files or >20 lines                           │
│                                                      │
│  USER OVERRIDE:                                      │
│    /craft --full → force full pipeline               │
│    /craft --lite → force lite (skip Quick Discover)  │
│    /tdd → LITE mode (skip Quick Discover)            │
│    /eval → LITE mode + eval define/check             │
└──────────────────────────────────────────────────────┘
```

**LITE mode phases:** TDD (Phase 6) → VERIFY (Phase 7) → REVIEW single pass (Phase 8.1, no harden loop) → done. No plan, no full discovery, no simplify. But verification and review are **never skipped**.

**FULL mode phases:** All phases below apply (Phase 3 DEEP DISCOVER expands on Quick Discover findings).

**When in doubt, use FULL.** The cost of over-processing is low; the cost of a missed regression is high.

**Auto-upgrade:** If LITE mode was selected but VERIFY (Phase 7) reveals failures in files NOT touched by TDD, this confirms a missed impact. STOP and restart from FULL mode Phase 3 (DEEP DISCOVER).

## TDD Discipline

> See [references/tdd-discipline.md](references/tdd-discipline.md) for the Iron Law, Anti-Rationalization table, and proactive triggers.

## Planning Process

> See [references/planning-process.md](references/planning-process.md) for requirements refinement, approach exploration, risk assessment, and the plan template.

## MUST NOT trigger on

- Documentation-only tasks ("update the README", "add JSDoc")
- Configuration changes ("update tsconfig", "add dependency")
- Pure research or exploration (use EnterPlanMode or Explore agent)

## Anti-Rationalization

If you catch yourself thinking any of these, STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is too simple for the pipeline" | Simple code causes regressions too. At minimum, use LITE mode. |
| "I'll just write the code and add tests after" | That's not TDD. Write the test first. |
| "Let me explore the codebase first" | Quick Discover handles impact scanning. Invoke the skill first. |
| "This is clearly FULL, no need for the scan" | The scan produces DATA for DISCOVER/PLAN, not just a mode decision. Run it. |
| "I already know how to implement this" | In FULL mode, the plan still needs user approval. |
| "This doesn't need review" | Every code change needs at minimum VERIFY + REVIEW. No exceptions. |
| "I'll use EnterPlanMode instead" | EnterPlanMode is for research ONLY. This skill replaces it for code. |
| "I'll skip verification, the code looks right" | "Looks right" is not evidence. Run the checks. |

**Violating the letter of the rules is violating the spirit of the rules.**

<HARD-GATE>
FULL mode: Do NOT write any implementation code until a plan has been
presented to the user AND the user has approved it.
LITE mode: Do NOT skip VERIFY or REVIEW after TDD. The quality tail is mandatory.
</HARD-GATE>

## Why No Context Fork

This skill runs in the **main context** (no `context: fork`) because it needs multi-turn user interaction:
- User must confirm the plan before TDD begins
- User may provide feedback between phases
- Task lifecycle (TaskCreate/TaskUpdate) must be visible in main context

## Craft State Persistence

The pipeline is designed to **survive context compaction, session crashes, and `/clear`** by persisting state to disk.

### State File

Active state lives at `.claude/craft/craft-state.md` during the pipeline. Update this file after every phase transition.

> State file template: see [references/craft-state.md](references/craft-state.md).

### Lifecycle

1. **Created** — At pipeline start (Phase 1.1 Quick Discover), write initial state with impact brief and gate decision
2. **Updated — AFTER EVERY PHASE AND SUB-PHASE** — Update the Phase field and phase summary line immediately when a phase completes, BEFORE starting the next phase. This is NOT optional — skipping a state update means compaction kills the pipeline.
3. **Survives compaction** — After compaction, read `.claude/craft/craft-state.md` to restore phase context. The plan is at the path in the state file.
4. **Archived on completion** — In Phase 9.3 (REPORT), move to `.claude/plans/<date>-<feature>.state.md` alongside the plan
5. **Overwritten on next pipeline** — A new orchestration overwrites the active state file

**CRITICAL RULE:** Every phase section below includes an explicit `**Update state →**` step. If you skip it, the next compaction destroys the pipeline. Treat state updates like saving a game — do it before every boss fight.

**Every `**Update state →**` MUST also update these sections in the state file:**
- **Resume Directive:** Set `NEXT ACTION` (the single next step), `REMAINING` (phases left), `INVOKE: magic-claude:craft to continue the pipeline`
- **Pipeline Position:** Update the `^ HERE` marker to the current phase
- These fields are what the PreCompact and SessionStart hooks use to recover the pipeline after compaction

### Crash Recovery

**At pipeline start or after context recovery, check for an orphaned state file:**

1. If `.claude/craft/craft-state.md` exists:
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

## Process IS the Product

Following this pipeline exactly — including steps that feel unnecessary — is what separates consistent success from coin-flip results. Every "shortcut" you take is a gamble you didn't need to make.

**Observed failure modes from production runs:**

| What was skipped | What happened |
|------------------|---------------|
| TASK LIST not created | Lost track after compaction, restarted from scratch, wasted 50k+ tokens |
| "It's simple, I'll skip planning" | Missed 3 untested callers, broke production code |
| State file not updated between phases | Compaction killed the pipeline, no recovery possible |
| Review skipped ("the code is fine") | Shipped a regression the tests didn't cover |
| Quick Discover skipped ("obviously LITE") | Fan-out was 12, not 2 — needed FULL mode |
| Decided to "just write the code" | Forgot TDD, wrote tests after, tests tested implementation not behavior |

**The inverse is also true:** When the pipeline is followed exactly, the success rate is dramatically higher. The process isn't overhead — it's the mechanism that catches the things you can't see.

## Orchestration Phases

> See [references/pipeline-diagram.md](references/pipeline-diagram.md) for the full phase flow diagram.

### Phase 1.1: QUICK DISCOVER (always runs first)

A lightweight impact scan that **produces structured data** before mode selection. The Impact Brief is NOT optional — it is the foundation that every subsequent phase builds on.

**Duration:** ~30 seconds, ~5-10k tokens. This is NOT the full DISCOVER phase — it's a fast triage.

<HARD-GATE>
You MUST execute ALL 6 steps below and write the Impact Brief to the state file
BEFORE proceeding to any subsequent phase. Declaring the mode without running the
scan is a pipeline violation — even when the answer "seems obvious."

The brief is not just a gate — it is DATA that seeds DISCOVER and PLAN.
Without it, those phases start blind.
</HARD-GATE>

**Steps (ALL mandatory — no shortcuts):**

1. **Identify targets** — From the user's request, identify the symbol(s), function(s), or file(s) that will change
2. **Fan-out analysis** — Use Serena `find_referencing_symbols` (or `Grep` as fallback) on each target to count callers/consumers. You MUST report an actual number, not "many" or "significant."
3. **Test coverage check** — For each caller found, check if it has test coverage (search for test files importing/referencing it). List untested callers by name.
4. **Pattern scan** — Use Serena `search_for_pattern` (or `Grep`) to find similar code patterns elsewhere that might need the same fix
5. **Cross-module check** — Are callers in different modules/packages than the target? If yes, flag cross-module dependency
6. **claude-mem search** (if available) — One targeted search for prior context about the affected area

**Output: Impact Brief → State File**

Write the Impact Brief section in `.claude/craft/craft-state.md` using the template from [references/craft-state.md](references/craft-state.md). Every field must be filled with data from the steps above — no placeholders, no "N/A", no skipping.

**Validation — the state file MUST contain before proceeding:**
- A real number for fan-out (from step 2)
- A real number for tested vs untested callers (from step 3)
- Specific file/symbol names for untested callers (not "some callers")
- A gate decision with a reason that references the data

**Gate logic** (applies the criteria from Mode Selection above):
- **LITE** if ALL: fan-out ≤3 and all tested, no similar patterns, no cross-module deps, ≤2 files and ≤20 lines
- **FULL** if ANY condition is violated
- Log the gate decision and reasoning — this is auditable

**After gate decision:**
- **LITE →** Skip to Phase 6 (TDD). The Impact Brief serves as sufficient context.
- **FULL →** Continue to Phase 2 (ARCHITECT, if needed) or Phase 3 (DEEP DISCOVER). Pass the Impact Brief as seed context — the full discoverer expands on it rather than starting from scratch.

### Phase 1.2: TASK LIST (mandatory, immediately after Quick Discover)

After the Quick Discover gate decision, **before any work begins**, create the full pipeline task list using TaskCreate. This is the visible enforcement contract — every phase is pre-declared with its exact agent assignment.

<HARD-GATE>
You MUST create ALL tasks below (FULL or LITE set) BEFORE proceeding to any
subsequent phase. NO EXCEPTIONS. Not "I'll create them as I go." Not "the task
is simple enough to track mentally." Not "I already know the phases."

The task list is NOT bureaucracy — it is your MEMORY. When compaction occurs,
the task list is the ONLY thing that tells you where you are. Without it, you
restart from scratch and waste the user's entire context investment.

FAILURE TO CREATE THE TASK LIST = PIPELINE FAILURE.
A pipeline without a task list has a ~50% chance of derailing on compaction.
A pipeline WITH a task list survives every time.
</HARD-GATE>

**FULL mode — create these tasks in order:**

| # | Task | Agent | BG | Gate |
|---|------|-------|----|------|
| 1 | Phase 2: ARCHITECT (if needed) | `magic-claude:architect` (opus) | ✓ | Architecture proposal produced |
| 2 | Phase 3: DEEP DISCOVER | `magic-claude:discoverer` (opus) | ✓ | Discovery Brief written |
| 3 | Phase 4.1: PLAN | `magic-claude:planner` (opus) | ✓ | Plan file persisted |
| 4 | Phase 4.2: PLAN CRITIC (max 3 cycles) | `general-purpose` via plan-critic-prompt.md | ✓ | ≤ MEDIUM findings |
| 5 | Phase 4.3: PLAN APPROVAL | — (human gate) | | User confirms plan |
| 6 | Phase 5.1: EVAL DEFINE (if --with-evals) | `magic-claude:eval` | ✓ | Eval criteria stored |
| 7 | Phase 5.2: UI DESIGN (if UI work) | `magic-claude:ui-design` | ✓ | Design spec produced |
| 8 | Phase 6.1: TDD BASELINE | — (inline) | | Baseline test counts recorded |
| 9 | Phase 6.2: TDD IMPLEMENTATION | `magic-claude:*-tdd-guide` (sonnet) | ✓ | All plan tasks implemented + tests pass |
| 10 | Phase 6.3: COVERAGE GATE | — (inline) | | ≥ 80% coverage |
| 11 | Phase 7: VERIFY | — (inline, build-resolver if needed) | | Build + types + lint + tests pass |
| 12 | Phase 8.1: REVIEW + HARDEN | `magic-claude:code-reviewer` (opus) + security/language reviewers | ✓ | APPROVE verdict, no MEDIUM+ issues |
| 13 | Phase 8.2: SIMPLIFY | `/simplify` (3 parallel agents) | ✓ | Verified clean |
| 14 | Phase 9.1: EVAL CHECK (if evals defined) | `magic-claude:eval` | ✓ | Metrics recorded |
| 15 | Phase 9.2: DELIVER | — (inline) | | Committed/pushed/PR created |
| 16 | Phase 9.3: REPORT | — (inline) | | Orchestration summary produced |

**LITE mode — create these tasks in order:**

| # | Task | Agent | BG | Gate |
|---|------|-------|----|------|
| 1 | Phase 6.1: TDD BASELINE | — (inline) | | Baseline test counts recorded |
| 2 | Phase 6.2: TDD IMPLEMENTATION | `magic-claude:*-tdd-guide` (sonnet) | ✓ | Tests pass |
| 3 | Phase 7: VERIFY | — (inline, build-resolver if needed) | | Build + types + lint + tests pass |
| 4 | Phase 8.1: REVIEW (single pass) | `magic-claude:code-reviewer` (opus) | ✓ | Review complete |
| 5 | Phase 9.3: REPORT | — (inline) | | Summary produced |

**Conditional tasks:** Mark tasks as `blocked` (not `in_progress`) if their gate condition isn't yet met (e.g., ARCHITECT is `blocked` until the gate check determines it's needed; set to `skipped` if not needed). Skip EVAL and UI DESIGN tasks (set to `skipped`) if their opt-in conditions aren't met.

**Lifecycle:**
- Create all tasks at once with status `pending`
- Set each task to `in_progress` when starting the phase
- Set to `completed` when the gate condition is objectively met
- Set to `skipped` when the conditional gate determines the phase doesn't apply
- **NEVER set a task to `completed` without meeting its gate condition**

**Background (BG column):** Tasks marked ✓ should use `run_in_background: true` when dispatching their agent. This frees the user to interact with Claude while agents work. Foreground tasks (no ✓) are either inline operations, human gates, or require immediate result inspection before proceeding.

**Update state →** Set `Phase: TASK LIST — N tasks created`, record task count in state file.

### Phase 2: ARCHITECT (conditional)

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
4. Pass the architect's output as context to Phase 3

### Phase 3: DEEP DISCOVER (always runs in FULL)

Grounds the planning phase in verified codebase facts. Prevents hallucinated file paths, non-existent APIs, and missed existing patterns.

1. Invoke the **magic-claude:discoverer** agent (opus) via Task tool
   - If Phase 2 ran: include the architect's output so the discoverer knows what areas to focus on
   - The discoverer searches claude-mem for prior decisions about this feature area
   - Uses Serena to explore affected symbols, find similar implementations, map dependencies
2. The discoverer produces a **Discovery Brief** with verified facts:
   - Prior context (past decisions, bug patterns from claude-mem)
   - Affected files and symbols (verified via Serena)
   - Existing patterns and reusable code
   - Dependencies and integration points
   - Risks and constraints (with confidence levels)
3. **Update state →** Set `Phase: DISCOVER completed`, update DISCOVER summary line with file/pattern/risk counts
4. Pass the Discovery Brief as input context to Phase 4.1 (PLAN)

**Lightweight by default:** For simple features, discovery takes ~30s (quick claude-mem search + targeted Serena lookup). For complex features touching many files, discovery scales up naturally as more symbols need exploration.

### Phase 4.1: PLAN

1. Invoke the **magic-claude:planner** agent (opus) via Task tool to analyze the request
   - If Phase 2 ran: include the architect's output as input context for the planner
   - If Phase 3 ran: include the Discovery Brief as input context — the planner uses verified facts to ground file paths, symbol references, and pattern decisions
   - The planner translates architecture decisions into actionable implementation steps
   - **If requirements are vague:** the planner will refine them through one-question-at-a-time dialogue before planning
   - **If multiple approaches exist:** the planner will propose 2-3 options with trade-offs and a recommendation
2. **Update state →** Set `Phase: PLAN — draft produced, entering critic auto-loop`, update PLAN summary line
3. Pass the draft plan to Phase 4.2 (PLAN CRITIC auto-loop) for iterative refinement
4. After the auto-loop converges (or exhausts 3 cycles), present the **refined plan** AND final critic findings to the user
5. **WAIT for user confirmation** before proceeding
   - If user confirms: proceed to Phase 5/6
   - If user says "just do it" or similar: skip plan review, proceed to Phase 5/6
   - If user requests further changes: loop back to step 1 with user feedback, then re-enter the critic auto-loop
   - If user modifies the plan: incorporate feedback, re-present if needed
6. **Persist the approved plan** to `.claude/plans/YYYY-MM-DD-<feature-name>.md`
   - This ensures the plan survives session loss, compaction, or exit
   - Record the git SHA at plan approval time for later review context
7. **Update state →** Set `Phase: PLAN APPROVED`, write plan path, base SHA, critic summary, and user decisions to `.claude/craft/craft-state.md`
8. **Suggest compact** — Inform the user: *"Planning phase complete. You can run `/compact` to free context for implementation, or continue as-is — the state file ensures recovery if auto-compaction occurs."* Do NOT attempt to run `/compact` programmatically.

### Phase 4.2: PLAN CRITIC (auto-loop, max 3 cycles)

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
- The user can still request manual revision, which loops back to Phase 4.1 with user feedback

**Human filtering required:** The critic is instructed to find problems, so it will find problems — including false positives. The auto-loop handles clear-cut CRITICAL/HIGH issues automatically; ambiguous findings and MEDIUM/LOW items are left for the user.

### Phase 5.1: EVAL DEFINE (opt-in)

When the user includes `--with-evals <name>` or explicitly requests eval-driven development:

1. **Update state →** Set `Phase: EVAL DEFINE`
2. Run `magic-claude:eval define <name>` to create capability and regression eval criteria based on the approved plan
3. Present eval definitions to user for confirmation
4. Store in `.claude/evals/<name>.md`

**Skip this phase** unless the user explicitly requests evals.

### Phase 5.2: UI DESIGN (conditional)

**Gate:** Advisory with user opt-out. Claude evaluates:
- Plan tasks touch `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, or `.css` files
- Plan mentions UI components, screens, layouts, or visual elements
- Feature description includes "design", "mockup", "wireframe", "UI", "layout"

If triggered, present a one-line advisory: "This feature involves UI work. Running UI Design phase. Say 'skip' to skip."
Default action = proceed. User says "skip" → go directly to Phase 6.

**Skip when:** The feature is purely backend, CLI, infrastructure, or DevOps.

1. **Update state →** Set `Phase: UI DESIGN`
2. Invoke the **magic-claude:ui-design** skill to orchestrate design context gathering
3. The skill runs `detect-tools.cjs` to discover available design MCP tools and presents them
4. If no design tools are installed, present installation options (user decides whether to install or proceed without)
5. Gather design context through layered fallback (MCP errors treated as "unavailable", fall to next layer):
   - Design MCP → Component Library MCP → Screenshot analysis → `frontend-design:frontend-design` plugin skill (if installed) → Claude built-in design knowledge (final fallback)
6. Respect architectural decisions from Phase 2/4.1. Do not override component library choices, framework, or design system selections already in the plan
7. Produce a **UI Design Spec** with confidence indicator `[MCP/screenshot/inference-only]`
8. **Persist spec** to `.claude/craft/design-spec.md`
9. Pass the spec as context to Phase 6 (TDD). No separate user approval for the spec — it flows directly into TDD

### Phase 6: TDD (Per-Task Loop)

#### 6.1 Baseline Verification

Before starting any implementation:
1. **Update state →** Set `Phase: TDD — baseline verification`
2. Run the project's test suite to establish a clean baseline
3. Record passing/failing counts
4. If pre-existing failures exist: report to user and ask whether to proceed or fix first

This prevents confusion between pre-existing and newly introduced failures.

#### 6.1.1 Ecosystem Detection

Detect ecosystem from project markers:
- `package.json` / `tsconfig.json` -> TypeScript/JavaScript -> **magic-claude:ts-tdd-guide**
- `pom.xml` / `build.gradle*` -> JVM -> **magic-claude:jvm-tdd-guide**
- `pyproject.toml` / `setup.py` -> Python -> **magic-claude:python-tdd-guide**

#### 6.2 Per-Task Implementation Loop

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

#### 6.3 Coverage Gate

After all tasks complete, verify 80%+ overall coverage before proceeding to Phase 7.

### Phase 7: VERIFY

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

### Phase 8.1: REVIEW + HARDEN (iterative)

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

#### 8.1.1 Initial Review

1. **Update state →** Set `Phase: REVIEW+HARDEN`
2. Invoke **magic-claude:code-reviewer** agent (opus) via Task tool for comprehensive review
   - **Pass plan context**: Include the approved plan from Phase 4.1 (or read from `.claude/plans/` file) so the reviewer can check plan alignment
   - **Pass git range**: Provide `BASE_SHA..HEAD_SHA` for the changes being reviewed (BASE_SHA recorded at Phase 4.3 approval)
3. For security-sensitive changes, also invoke the ecosystem-specific security reviewer:
   - **magic-claude:ts-security-reviewer** for TypeScript/JavaScript
   - **magic-claude:jvm-security-reviewer** for JVM
   - **magic-claude:python-security-reviewer** for Python
4. For language-specific idiomatic review, invoke:
   - **magic-claude:java-reviewer** for `.java` files
   - **magic-claude:kotlin-reviewer** for `.kt` files
   - **magic-claude:python-reviewer** for `.py` files

#### 8.1.2 Harden Loop

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

### Phase 8.2: SIMPLIFY

After hardening, run a structured simplification audit on the changed files across 3 dimensions: reuse, quality, and efficiency.

1. **Update state →** Set `Phase: SIMPLIFY`
2. **Identify changed files** — Use `git diff --name-only BASE_SHA..HEAD` to get the list of files modified during this orchestration
3. **Invoke `/simplify`** — Run the built-in simplify skill, which launches 3 parallel agents on the diff:
   - **Reuse agent** — Detects code that duplicates existing utilities or helpers in the codebase
   - **Quality agent** — Finds redundant state, parameter sprawl, copy-paste variations, leaky abstractions, stringly-typed code
   - **Efficiency agent** — Identifies redundant computation, missing concurrency, hot-path bloat, TOCTOU anti-patterns, memory leaks
4. **Triage findings** — Review each finding and decide: fix (genuine improvement) or skip (acceptable tradeoff). Not every finding requires action.
5. **Verify simplification** — Run types → lint → tests. Simplification **must not** break anything.
   - If verification passes → proceed to next phase
   - If verification fails → **attempt to fix** the issues (invoke appropriate build-resolver agent or fix manually). Re-verify after fixes.
   - If fix succeeds → proceed to next phase
   - If fix fails → **revert** the simplification changes (`git checkout -- <files>`) and report what broke. The pre-simplification code was already hardened and clean — losing simplification is acceptable, losing correctness is not.

### Phase 9.1: EVAL CHECK (opt-in)

When evals were defined in Phase 5.1:

1. Run `magic-claude:eval check <name>` to verify implementation meets criteria
2. Record pass@3 (capability) and pass^3 (regression) metrics
3. Include results in Phase 9.3 report

**Skip this phase** unless Phase 5.1 was executed.

### Phase 9.2: DELIVER (conditional)

1. **Update state →** Set `Phase: DELIVER`

If the approved plan includes a **Delivery Strategy** (from the planner's step 3):

- **current-branch** — No action needed (work is already on the branch)
- **feature-branch-merge** — Merge the feature branch into the base branch locally, verify tests pass on merged result
- **feature-branch-pr** — Push the feature branch with `-u`, create a PR via `gh pr create` with the orchestration report as the PR body
- **user-managed** — Skip; user handles branching

**Documentation check (all strategies):** Before delivering, verify that any doc update tasks from the plan were completed. If the plan included documentation tasks that weren't executed, flag them as incomplete in the orchestration report. If the plan explicitly noted "No documentation changes required," skip this check.

**Skip this phase** if no delivery strategy was recorded or the user said they'd handle it.

### Phase 9.3: REPORT

Produce a final orchestration report:

> Report template: see [references/report-template.md](references/report-template.md).

**Verdict criteria:**
- **SHIP** - All phases green, review approved
- **NEEDS WORK** - Minor issues found, list specific `magic-claude:<command>` remediation
- **BLOCKED** - Critical issues (security vulnerabilities, build failures after remediation, review BLOCK)

**Archive craft state:**
After producing the report, archive the state file alongside the plan:
1. Move `.claude/craft/craft-state.md` to `.claude/plans/YYYY-MM-DD-<feature-name>.state.md`
2. This serves as an audit trail (critic cycles, harden rounds, coverage, timing)
3. If verdict is NEEDS WORK or BLOCKED, keep the active state file as-is (pipeline is not complete)

## Standalone Commands (Not Part of Craft)

These commands operate independently — they don't invoke the craft pipeline:

| Command | Use Case |
|---------|----------|
| `/code-review` | Review code you didn't write (PRs, external code) |
| `/verify` | Quick verification check without review loop |
| `/build-fix` | Fix a specific build error |
| `/refactor-clean` | Dead code removal |
| `/plan` | Pure architectural discussion (no code) |

## Related

- `magic-claude:craft` command - Explicit user-invoked pipeline with `--full`/`--lite` override
- `magic-claude:tdd` command - Entry point to craft LITE mode (skip planning)
- `magic-claude:eval` command - Entry point to craft with eval define/check
- `magic-claude:code-review` command - Standalone code review (not part of craft)
- `magic-claude:verify` command - Standalone verification
- `magic-claude:build-fix` command - Build error resolution
- `magic-claude:architect` agent - System design decisions (Phase 2, conditional)
- `magic-claude:discoverer` agent - Codebase discovery and research (Phase 3)
- `magic-claude:planner` agent - Implementation planning (Phase 4.1)
- `magic-claude:plan-critic` agent - Adversarial plan review (Phase 4.2, via plan-critic-prompt.md)
- `plan-critic-prompt.md` - Adversarial plan review template (Phase 4.2)
- `magic-claude:code-reviewer` agent - Quality and security review
- `magic-claude:*-tdd-guide` agents - Ecosystem-specific TDD specialists
- `magic-claude:*-build-resolver` agents - Ecosystem-specific build error resolution
- `magic-claude:*-security-reviewer` agents - Ecosystem-specific security analysis
- `/simplify` skill (built-in) - 3-agent parallel audit: reuse, quality, efficiency (Phase 8.2)
- `spec-reviewer-prompt.md` - Adversarial spec compliance review template (Phase 6.2, per-task)
- `magic-claude:ui-design` skill - UI design context gathering (Phase 5.2, conditional)
- `frontend-design:frontend-design` plugin skill - Design thinking framework (invoked by ui-design)
- [references/tdd-discipline.md](references/tdd-discipline.md) - TDD Iron Law and anti-rationalization
- [references/planning-process.md](references/planning-process.md) - Requirements refinement and plan template
