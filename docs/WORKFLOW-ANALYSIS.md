# Workflow Analysis

How skills, agents, hooks, and commands connect -- and where the gaps are.

---

## How It Should Work

The user says "I want this improvement" and the plugin orchestrates the entire chain: planning, TDD, implementation, verification, review. Proactive skills detect intent. Hooks fire at every step. The user never has to remember command names.

The reality is close but has connection gaps. This document maps every workflow end-to-end and identifies what's missing.

---

## Hook Infrastructure (Always Active)

Hooks fire automatically during every workflow. They are the connective tissue.

### PostToolUse (Every Edit/Write)

| Hook | What It Does | Files |
|------|-------------|-------|
| `smart-formatter.js` | Auto-format via ecosystem registry (Ruff, google-java-format, ktfmt, Prettier) | All source files |
| `typescript-checker.cjs` | `npx tsc --noEmit` | `.ts`, `.tsx` |
| `pyright-checker.cjs` | `pyright` type checking | `.py` |
| `console-log-detector.cjs` | Warns about debug statements | All source files |
| `java-security.js` | SpotBugs + FindSecurityBugs | `.java` |
| `python-security.js` | Semgrep + pip-audit | `.py` |
| `typescript-security.js` | Semgrep + npm audit + pattern checks | `.ts`, `.tsx`, `.js`, `.jsx` |

### PreToolUse

| Hook | What It Does | Trigger |
|------|-------------|---------|
| `pre-commit-review.cjs` | Suggests `code-reviewer` agent before git commit | `git commit` (not amend) |
| `suggest-compact.cjs` | Suggests `/compact` after 50 tool calls, then every 25 | Every Edit/Write |

### Lifecycle

| Hook | Event | What It Does |
|------|-------|-------------|
| `session-start.cjs` | SessionStart | Load previous context, detect ecosystem, detect package manager, check Serena |
| `session-end.cjs` | SessionEnd | Persist session log |
| `evaluate-session.cjs` | SessionEnd + PreCompact | Detect extractable patterns, suggest `/learn` |
| `stop-validation.cjs` | Stop | Check ALL modified files for debug statements (every Claude response) |
| `post-task-update.cjs` | PostToolUse (TaskUpdate) | Inject "Code Review Recommended" when task marked completed |
| `task-completed.cjs` | TaskCompleted | Advisory quality gate: verify tests and review code before task completion |
| `notify.cjs` | Notification | Cross-platform desktop notification when Claude needs input |
| `inject-prompt-context.cjs` | UserPromptSubmit | Inject dynamic context (branch, tasks, time) into prompts |
| `permission-filter.cjs` | PermissionRequest | Auto-approve safe bash commands (tests, linting, builds) |
| `pre-compact.cjs` | PreCompact | Save state before context compaction |

### Resolved: TypeScript/JavaScript Security Hook

`typescript-security.js` now provides security scanning for TS/JS files, mirroring the Java and Python security hooks. Checks include: Semgrep SAST scan, npm audit for vulnerable dependencies, and pattern-based detection of eval(), innerHTML, SQL injection, hardcoded credentials, command injection, and open redirects.

---

## Command Workflows

### `/plan` -- Implementation Planning

```
User: /plan [description]
  -> planner agent (opus)
     -> Analyze requirements, create phased plan, identify risks
     -> WAIT for user confirmation
  -> Docs say: "Use /tdd to implement, /build-fix if errors, /code-review to review"
```

**Agents:** `planner` (opus)
**Skills consumed:** `claude-mem-context`, `serena-code-navigation`
**Verification:** None. Plan presented for human approval.
**Gap:** After user confirms, nothing triggers `/tdd` or the next step automatically. The suggestion is only in documentation text.

---

### `/tdd` -- Test-Driven Development

```
User: /tdd
  -> Detect ecosystem
  -> Dispatch to specialist:
     TypeScript -> ts-tdd-guide (sonnet)
     JVM        -> jvm-tdd-guide (sonnet)
     Python     -> python-tdd-guide (sonnet)
  -> RED: Write failing test
  -> GREEN: Write minimal implementation
  -> REFACTOR: Clean up
  -> Agent Stop hook verifies RED-GREEN-REFACTOR was followed
```

**Agents:** `ts-tdd-guide` | `jvm-tdd-guide` | `python-tdd-guide` (sonnet)
**Skills consumed:** `tdd-workflow` + `backend-patterns` | `jvm-tdd-workflow` + `jvm-backend-patterns` | `python-tdd-workflow` + `python-backend-patterns`, `claude-mem-context`
**Hooks during:** auto-format, type check, debug detect, security scan (Java/Python/TypeScript)
**Verification:** Agent self-check only (was TDD cycle followed?). No build/lint/full-test verification.
**Note:** When invoked via `proactive-orchestration`, verification and review follow automatically as subsequent phases.

---

### `/code-review` -- Quality & Security Review

```
User: /code-review
  -> git diff --name-only HEAD
  -> Detect ecosystem from file extensions
  -> Dispatch to code-reviewer (opus)
     -> For .java: also java-reviewer (opus)
     -> For .kt:   also kotlin-reviewer (opus)
     -> For .py:   also python-reviewer (opus)
     -> For .groovy: also groovy-reviewer (opus)
  -> For security-sensitive changes:
     -> ts-security-reviewer / jvm-security-reviewer / python-security-reviewer
  -> Severity report (CRITICAL / HIGH / MEDIUM)
  -> Verdict: BLOCK / WARN / APPROVE
  -> Remediation suggestions (maps issues to specific commands)
```

**Agents:** `code-reviewer` (opus) + language-specific reviewers + security reviewers as needed
**Skills consumed:** `coding-standards`, `security-review`, `claude-mem-context`, `serena-code-navigation`
**Verification:** Agent Stop hook checks completeness (files read, security checked, verdict given).
**Remediation:** On BLOCK, suggests `/build-fix`, `/tdd`, `/test-coverage`, or specific security fixes.

---

### `/build-fix` -- Incremental Build Error Resolution

```
User: /build-fix
  -> Detect ecosystem
  -> Dispatch to specialist:
     TypeScript -> ts-build-resolver (sonnet)
     JVM        -> jvm-build-resolver (sonnet)
     Python     -> python-build-resolver (sonnet)
  -> Loop: run build -> parse errors -> fix one -> re-run -> verify
  -> Stop: fix introduces new errors, same error 3x, or user pauses
```

**Agents:** `ts-build-resolver` | `jvm-build-resolver` | `python-build-resolver` (sonnet)
**Verification:** Build must pass at end. Summary of errors fixed/remaining/introduced.
**Gap:** After build is green, no automatic trigger for `/code-review` or `/verify`.

---

### `/e2e` -- End-to-End Tests

```
User: /e2e [description]
  -> Detect ecosystem
  -> Dispatch to specialist:
     TypeScript -> ts-e2e-runner (sonnet, Playwright)
     JVM        -> jvm-e2e-runner (sonnet, Selenium/REST Assured)
     Python     -> python-e2e-runner (sonnet, pytest-playwright)
  -> Analyze flow, generate tests, run, capture artifacts
```

**Agents:** `ts-e2e-runner` | `jvm-e2e-runner` | `python-e2e-runner` (sonnet)
**Verification:** Test pass/fail report with artifacts.
**Gap:** Does not differentiate build failures from test logic failures. Does not suggest `/build-fix` when failures are build-related.

---

### `/refactor-clean` -- Dead Code Removal

```
User: /refactor-clean
  -> Detect ecosystem
  -> Dispatch to specialist:
     TypeScript -> ts-refactor-cleaner (haiku, knip/depcheck/ts-prune)
     JVM        -> jvm-refactor-cleaner (haiku, jdeps/SpotBugs)
     Python     -> python-refactor-cleaner (haiku, vulture/ruff)
  -> Categorize by risk: SAFE / CAUTION / DANGER
  -> Before each deletion: run tests -> verify pass -> apply -> re-run -> rollback if fail
```

**Agents:** `ts-refactor-cleaner` | `jvm-refactor-cleaner` | `python-refactor-cleaner` (haiku)
**Verification:** Full test suite before and after each deletion. Built-in rollback on failure.

---

### `/verify` -- Comprehensive Verification

```
User: /verify [quick|full|pre-commit|pre-pr]
  -> Detect ecosystem
  -> Build check
  -> Type check
  -> Lint check
  -> Test suite (with coverage)
  -> Debug statement audit
  -> Git status review
  -> VERIFICATION report: PASS/FAIL per category, "Ready for PR: YES/NO"
```

**Agents:** None -- runs in main context.
**Remediation:** Maps failure categories to specific commands: Build FAIL -> `/build-fix`, Types FAIL -> `/build-fix`, Tests FAIL -> `/tdd`, Coverage LOW -> `/test-coverage`, Debug FOUND -> remove before committing, Security FOUND -> `/code-review`.

---

### `/orchestrate` -- Multi-Agent Workflow

```
User: /orchestrate feature [description]
  -> planner (opus)                    # Plan the feature
  -> [ecosystem]-tdd-guide (sonnet)    # Implement with TDD
  -> code-reviewer (opus)              # Review quality
  -> [ecosystem]-security-reviewer (opus)  # Review security
  -> ORCHESTRATION REPORT: SHIP / NEEDS WORK / BLOCKED
```

**Variants:** `bugfix`, `refactor`, `security`, `custom`
**Agents:** Multiple in sequence with structured handoff documents.
**Feature workflow** now shares phases with `proactive-orchestration` (DISCOVER, PLAN, PLAN CRITIC, [UI DESIGN], TDD, VERIFY, REVIEW, REPORT).
**Bugfix workflow** uses `Explore` (built-in codebase investigation) instead of a custom explorer agent.
**Remediation:** Includes remediation suggestions in final report (maps issues to commands).

---

### `/test-coverage` -- Coverage Analysis

```
User: /test-coverage
  -> Detect ecosystem, run coverage tool
  -> Identify files below 80%
  -> Delegate to TDD agent for test generation (RED-GREEN-REFACTOR)
  -> Re-run coverage, show before/after metrics
```

**Agents:** `ts-tdd-guide` | `jvm-tdd-guide` | `python-tdd-guide` (sonnet) -- dispatched via Task tool for test generation.
**Verification:** Coverage re-run after test generation. Before/after comparison.

---

### Other Commands

| Command | Purpose | Agents | Gap |
|---------|---------|--------|-----|
| `/learn` | Extract patterns from session | None | `evaluate-session.cjs` emits `ACTION REQUIRED`; `continuous-learning` rule instructs Claude to run `/learn` proactively |
| `/checkpoint` | Save verification state | None | Uses `/verify quick` internally. Does not integrate with `/eval`. |
| `/eval` | Eval-driven development | None | Standalone. Not used by `/orchestrate` or `/checkpoint`. |
| `/update-docs` | Sync docs from source | `doc-updater` (haiku) | Minimal gaps. |
| `/setup` | Project setup | `setup-agent` (sonnet) | Orchestrates `/setup-pm` and `/setup-ecosystem` well. |
| `/ci-cd` | Pipeline generation | `ci-cd-architect` (opus) | Standalone. |

---

## Proactive Skills

These trigger automatically when Claude detects the right signals. A hierarchy governs which skill fires:

### `proactive-orchestration` (Top-Level Orchestrator)

**Triggers on:** Complex feature requests (multiple components/files), architectural changes (new endpoints, services, modules), "add/implement/build/create" + non-trivial scope.
**Does NOT trigger on:** Simple bug fixes, single-file edits, documentation, configuration, refactoring.
**Phases:** DISCOVER (discoverer agent) -> PLAN (planner agent) -> PLAN CRITIC (adversarial review) -> [UI DESIGN] (conditional, for frontend features) -> TDD (ecosystem TDD agent) -> VERIFY (build/types/lint/tests) -> REVIEW (code-reviewer + security reviewers) -> REPORT (SHIP/NEEDS WORK/BLOCKED).
**Runs in main context** (no `context: fork`) to allow user confirmation gates between phases.

When `proactive-orchestration` fires, it subsumes the three individual proactive skills below.

### `proactive-planning` (Standalone Planning)

**Triggers on:** Architectural discussions, requirement analysis, design decisions -- when planning is needed without the full TDD/review pipeline.
**Dispatches to:** `planner` (opus) via `context: fork`.
**Note:** For complex multi-file features, `proactive-orchestration` handles planning as Phase 1.

### `proactive-tdd` (Standalone TDD)

**Triggers on:** Adding tests to existing code, bug fix with reproduction test, isolated TDD needs.
**Dispatches to:** `ts-tdd-guide` | `jvm-tdd-guide` | `python-tdd-guide` (sonnet) via `context: fork`.
**Note:** For complex features, `proactive-orchestration` coordinates TDD as Phase 2.

### `proactive-review` (Standalone Review)

**Triggers on:** Pre-commit review, reviewing existing code, task completion for non-orchestrated work.
**Dispatches to:** `code-reviewer` (opus) via `context: fork`.
**Note:** For complex features, `proactive-orchestration` includes review as Phase 4.

---

## The Ideal Flow vs Reality

### What the user expects

```
User: "Add a health check endpoint to the API"
  1. Planning happens automatically
  2. User confirms the plan
  3. TDD agent writes tests first
  4. Implementation fills in the code
  5. Build/type/lint verified automatically
  6. Code review runs automatically
  7. User sees: "Ready to commit" or "Needs work: [specific actions]"
```

### What now happens (with proactive-orchestration)

```
User: "Add a health check endpoint to the API"
  1. proactive-orchestration fires (detects complex feature request)
  2. Phase 1: planner agent designs approach, waits for user confirmation
  3. Phase 2: Ecosystem TDD agent implements with backend patterns in context
  4. Phase 3: Verification runs (build + types + lint + tests + debug audit)
     -> If build fails: auto-invokes build-resolver, re-verifies
  5. Phase 4: code-reviewer + security reviewers check quality
     -> If issues found: reports with specific remediation commands
  6. Phase 5: SHIP / NEEDS WORK / BLOCKED verdict
```

### What previously happened (before orchestration)

```
User: "Add a health check endpoint to the API"
  1. proactive-planning MAY trigger (depends on complexity signals)
  2. User confirms the plan
  3. proactive-tdd MAY trigger (depends on detection signals)
     -- OR proactive-planning and proactive-tdd both try to trigger (no precedence)
  4. Implementation happens (possibly without TDD if signals missed)
  5. Hooks auto-format, type-check, detect debug statements (per-file, not comprehensive)
  6. proactive-review does NOT trigger (no task completion signal)
  7. User must manually run /code-review and /verify
```

---

## Gap Summary

### Resolved (v2.1.0)

| Gap | Resolution |
|-----|-----------|
| **Plan -> TDD handoff** | `proactive-orchestration` coordinates Discover -> Plan -> Plan Critic -> [UI Design] -> TDD -> Verify -> Review as sequential phases |
| **TDD -> Verify** | `proactive-orchestration` Phase 3 runs verification after TDD completes |
| **TDD -> Review** | `proactive-orchestration` Phase 4 runs code review; task lifecycle managed via TaskCreate/TaskUpdate |
| **Review -> Fix** | `/code-review` now includes remediation suggestions mapping issues to specific commands |
| **Verify -> Fix** | `/verify` now includes remediation suggestions mapping failures to specific commands |
| **Orchestrate -> Verify** | `/orchestrate feature` now includes verification phase between TDD and Review |
| **Proactive precedence** | `proactive-orchestration` is the top-level orchestrator; individual proactive skills fire only for standalone work |
| **TS/JS security hook** | `typescript-security.js` PostToolUse hook created (Semgrep + npm audit + pattern checks) |
| **Remediation suggestions** | Both `/verify` and `/code-review` now suggest next commands based on failure type |
| **`/tdd` vs `proactive-tdd`** | Unified: `proactive-tdd` delegates to `/tdd` command workflow (single implementation) |
| **`/verify` vs `verification-loop`** | Unified: `verification-loop` delegates to `/verify full` process (single implementation) |
| **`/code-review` vs `proactive-review`** | Unified: `proactive-review` delegates to `/code-review` workflow (single implementation) |
| **Backend patterns in TDD** | TDD agents now include `*-backend-patterns` skills in frontmatter |
| **Backend patterns in build-resolvers** | Build-resolver agents now include `*-backend-patterns` skills in frontmatter |
| **Phantom `explorer` agent** | Replaced with `Explore` (built-in Claude Code subagent) in `/orchestrate` bugfix workflow |

### Resolved (v2.1.1)

| Gap | Resolution |
|-----|-----------|
| **Test coverage delegation** | `/test-coverage` now delegates to ecosystem TDD agents (`ts-tdd-guide`, `jvm-tdd-guide`, `python-tdd-guide`) for RED-GREEN-REFACTOR test generation |
| **Auto-learn** | `evaluate-session.cjs` emits `ACTION REQUIRED` message; `plugin/rules/continuous-learning.md` instructs Claude to proactively run `/learn` when patterns are detected |

### Resolved (v2.2.2)

| Gap | Resolution |
|-----|-----------|
| **Orchestrate -> Eval** | Opt-in `--with-evals <name>` flag on `/orchestrate feature` and `proactive-orchestration`. Phase 1.5 runs `/eval define`, Phase 4.5 runs `/eval check`. Results included in REPORT verdict. |

### Resolved (v2.5.0)

| Gap | Resolution |
|-----|-----------|
| **TaskCompleted hook** | `task-completed.cjs` provides advisory quality gate for task completion events (both regular tasks and Agent Teams) |
| **Notification hook** | `notify.cjs` provides cross-platform desktop notification when Claude needs user input |
| **Hook validation tests** | `tests/hooks/hooks.test.cjs` validates hooks.json structure, event types, handler fields, script existence, and matcher validity (17 tests) |
| **Hook UX** | All 22 hook handlers now include `statusMessage` fields for custom spinner text during execution |
| **Agent Teams reference** | `plugin/skills/agent-teams/SKILL.md` provides pre-configured team scenarios with token cost guard rails (gated by `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) |

### Remaining Gaps (Deferred)

| Gap | Current | Impact | Priority |
|-----|---------|--------|----------|
| **Checkpoint -> Eval** | Independent systems | Low -- narrow audience (users of both checkpoint AND eval) | Low |
| **Ecosystem cache reuse** | Commands re-detect ecosystem via project markers | Negligible -- detection is essentially free (file existence check) | Lowest |

---

## Agent Model Assignments

| Model | Agents | Rationale |
|-------|--------|-----------|
| **opus** | planner, architect, code-reviewer, java-reviewer, kotlin-reviewer, groovy-reviewer, python-reviewer, ts-security-reviewer, jvm-security-reviewer, python-security-reviewer, ci-cd-architect | Deep reasoning: architecture, security, quality |
| **sonnet** | ts-tdd-guide, jvm-tdd-guide, python-tdd-guide, ts-build-resolver, jvm-build-resolver, python-build-resolver, ts-e2e-runner, jvm-e2e-runner, python-e2e-runner, setup-agent, gradle-expert, maven-expert | Speed + quality balance: implementation tasks |
| **haiku** | ts-refactor-cleaner, jvm-refactor-cleaner, python-refactor-cleaner, doc-updater | Speed: bounded, mechanical tasks |

---

## Design Principle: Zero Cognitive Load

The user should never need to memorize command names. The only commands a user needs to know:

- `/setup` -- first-time project setup
- `/extend` -- adding new ecosystem support

Everything else should be proactive. Commands remain as escape hatches for explicit control, but the default path is: **describe what you want, the system does the rest.**

### Why the Current Architecture Falls Short

The plugin has the right components but the wrong wiring. Three independent proactive skills (`proactive-planning`, `proactive-tdd`, `proactive-review`) each decide independently whether to fire. They don't coordinate, share state, or enforce ordering. Meanwhile `/orchestrate` -- which *does* coordinate agents in sequence -- is user-invoked only. The full pipeline exists but requires the user to know to type `/orchestrate feature`.

### Skills vs Commands: The Key Insight

Per the plugin spec (see official docs: `magic-claude-docs:docs skills`), skills and commands are merged in Claude Code. Both create slash commands. Skills add: `context: fork`, `user-invocable: false`, `disable-model-invocation`, and **auto-loading by Claude based on description**. Skills with `user-invocable: false` let Claude load them automatically when context matches -- the user never invokes them explicitly.

This means the fix is architectural, not additive. Instead of adding more proactive skills, unify the orchestration.

---

## Implementation Status

All items from the original proposed redesign have been implemented:

1. **Unified Proactive Orchestration** -- `proactive-orchestration` skill coordinates DISCOVER -> PLAN -> PLAN CRITIC -> [UI DESIGN] -> TDD -> VERIFY -> REVIEW -> REPORT
2. **Unified Implementations** -- `proactive-tdd`, `proactive-review`, `verification-loop` delegate to their command counterparts
3. **Pattern Skills in Agent Context** -- Option A implemented: `*-backend-patterns` added to TDD agents and build-resolvers
4. **Task Lifecycle Automation** -- `proactive-orchestration` manages TaskCreate/TaskUpdate across phases
5. **Remediation Suggestions** -- `/verify` and `/code-review` map failures to specific commands
6. **TypeScript/JavaScript Security Hook** -- `typescript-security.js` mirrors Java and Python security hooks

### What This Achieves

**Before (user must know):**
```
"Add a health check endpoint"
  -> User must run /plan (or hope proactive-planning fires)
  -> User must run /tdd (or hope proactive-tdd fires)
  -> User must run /verify
  -> User must run /code-review (or hope proactive-review fires)
  -> User must know /build-fix if build breaks
  -> User must know /test-coverage if coverage is low
```

**After (system orchestrates):**
```
"Add a health check endpoint"
  -> proactive-orchestration fires (detects complex feature request)
  -> Phase 1: planner designs approach, waits for user confirmation
  -> Phase 2: TDD agent implements with ecosystem-appropriate patterns
  -> Phase 3: verification checks build/types/lint/tests
     -> If build fails: auto-invokes build-resolver, re-verifies
  -> Phase 4: code-reviewer checks quality and security
     -> If issues found: reports with specific remediation commands
  -> Phase 5: "Ready to commit" or "Needs work: [specific actions]"
```

The user's cognitive load: describe what you want. The system handles the rest.
