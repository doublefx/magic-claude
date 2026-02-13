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

### PreToolUse

| Hook | What It Does | Trigger |
|------|-------------|---------|
| `pre-commit-review.cjs` | Suggests `code-reviewer` agent before git commit | `git commit` (not amend) |
| `suggest-compact.cjs` | Suggests `/compact` after 50 tool calls, then every 25 | Every Edit/Write |

### Lifecycle

| Hook | What It Does |
|------|-------------|
| `session-start.cjs` | Load previous context, detect ecosystem, detect package manager, check Serena |
| `session-end.cjs` | Persist session log |
| `evaluate-session.cjs` | Detect extractable patterns, suggest `/learn` (SessionEnd + PreCompact) |
| `stop-validation.cjs` | Check ALL modified files for debug statements (every Claude response) |
| `post-task-update.cjs` | Inject "Code Review Recommended" when task marked completed |

### Gap: No TypeScript/JavaScript Security Hook

Java gets `java-security.js`. Python gets `python-security.js`. TypeScript/JavaScript gets nothing. A `typescript-security.js` hook (ESLint security plugin, Semgrep JS rules) is missing.

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
**Skills consumed:** `tdd-workflow` | `jvm-tdd-workflow` | `python-tdd-workflow`, `claude-mem-context`
**Hooks during:** auto-format, type check, debug detect, security scan (Java/Python only)
**Verification:** Agent self-check only (was TDD cycle followed?). No build/lint/full-test verification.
**Gap:** Does not trigger `verification-loop` or `/verify` at the end. Does not trigger `proactive-review`. Does not create a task, so `post-task-update.cjs` never fires to suggest code review.

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
  -> Severity report (CRITICAL / HIGH / MEDIUM)
  -> Verdict: BLOCK / WARN / APPROVE
```

**Agents:** `code-reviewer` (opus) + language-specific reviewers as needed
**Skills consumed:** `coding-standards`, `security-review`, `claude-mem-context`, `serena-code-navigation`
**Verification:** Agent Stop hook checks completeness (files read, security checked, verdict given).
**Gap:** Does not suggest next commands based on issue type. If build is broken: should suggest `/build-fix`. If coverage is low: should suggest `/test-coverage`. The verdict is final but not actionable.

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
**Gap:** Reports failures but does not suggest specific remediation. Build fails -> should suggest `/build-fix`. Tests fail -> should suggest `/tdd`. Coverage low -> should suggest `/test-coverage`.

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
**Gap:** No verification between agent handoffs. Does not use `/eval` to define success criteria upfront. Does not run `verification-loop` between agents to ensure build stays green.

---

### `/test-coverage` -- Coverage Analysis

```
User: /test-coverage
  -> Detect ecosystem, run coverage tool
  -> Identify files below 80%
  -> Generate missing tests
  -> Verify new tests pass
  -> Before/after metrics
```

**Agents:** None -- runs in main context.
**Gap:** Does not link to `/tdd` for structured test writing. Could delegate to TDD agents for generating high-quality tests.

---

### Other Commands

| Command | Purpose | Agents | Gap |
|---------|---------|--------|-----|
| `/learn` | Extract patterns from session | None | Manual only; `evaluate-session.cjs` suggests but cannot auto-invoke |
| `/checkpoint` | Save verification state | None | Uses `/verify quick` internally. Does not integrate with `/eval`. |
| `/eval` | Eval-driven development | None | Standalone. Not used by `/orchestrate` or `/checkpoint`. |
| `/update-docs` | Sync docs from source | `doc-updater` (haiku) | Minimal gaps. |
| `/setup` | Project setup | `setup-agent` (sonnet) | Orchestrates `/setup-pm` and `/setup-ecosystem` well. |
| `/ci-cd` | Pipeline generation | `ci-cd-architect` (opus) | Standalone. |

---

## Proactive Skills

These trigger automatically when Claude detects the right signals.

### `proactive-planning`

**Triggers on:** Complex feature requests, architectural changes, unclear requirements, "implement", "build", "create" + multiple files.
**Dispatches to:** `planner` (opus)
**Gap:** After the plan is confirmed, does not hand off to `proactive-tdd`. User must manually proceed.

### `proactive-tdd`

**Triggers on:** "Add", "implement", "create" + function/feature. Bug fix requests. Files with existing tests.
**Dispatches to:** `ts-tdd-guide` | `jvm-tdd-guide` | `python-tdd-guide` (sonnet)
**Gap:** Can conflict with `proactive-planning`. Both trigger on "implement". No defined precedence. Expected flow: plan first, then TDD. Not enforced.

### `proactive-review`

**Triggers on:** Task completion, before commit, significant changes, security-sensitive code.
**Dispatches to:** `code-reviewer` (opus) + language-specific reviewers.
**Gap:** Only triggers on task completion if the `post-task-update.cjs` hook fires. Commands like `/tdd` don't create tasks, so proactive-review is never suggested after `/tdd`.

---

## The Ideal Flow vs Reality

### What the user expects

```
User: "Add a health check endpoint to the API"
  1. Planning happens automatically (proactive-planning)
  2. User confirms the plan
  3. TDD agent writes tests first (proactive-tdd)
  4. Implementation fills in the code
  5. Build/type/lint verified automatically (verification-loop)
  6. Code review runs automatically (proactive-review)
  7. User sees: "Ready to commit. Run /verify pre-commit for final check."
```

### What actually happens

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

### Connection Gaps (workflows that should chain but don't)

| Gap | Current | Should Be |
|-----|---------|-----------|
| **Plan -> TDD handoff** | Plan ends, user must manually start TDD | After plan confirmation, offer to invoke TDD agent |
| **TDD -> Verify** | TDD ends after RED-GREEN-REFACTOR | Run `verification-loop` as final step |
| **TDD -> Review** | No task created, so post-task-update hook never fires | Create task at start, complete at end to trigger review suggestion |
| **Review -> Fix** | Verdict given but no next-step suggestions | Suggest `/build-fix`, `/test-coverage`, or `/tdd` based on issue type |
| **Verify -> Fix** | Reports PASS/FAIL but no remediation suggestions | Map failure categories to commands |
| **Orchestrate -> Verify** | No verification between agent handoffs | Insert verification phase between each handoff |
| **Orchestrate -> Eval** | Does not define or check evals | Start with `/eval define`, end with `/eval check` |
| **Checkpoint -> Eval** | Independent systems | `/checkpoint verify` could run `/eval check` if eval exists |
| **Proactive precedence** | `proactive-planning` and `proactive-tdd` can conflict | Define: planning first, TDD second |

### Missing Components

| Component | What's Missing | Impact |
|-----------|---------------|--------|
| **TS/JS security hook** | No `typescript-security.js` PostToolUse hook | TypeScript files get no security scanning on edit (Java and Python do) |
| **Remediation suggestions** | `/verify` and `/code-review` don't suggest fix commands | User must know which command fixes which problem |
| **Ecosystem cache reuse** | Commands re-detect ecosystem instead of reading `session-start.cjs` detection | Redundant work on every command |
| **Auto-learn** | `evaluate-session.cjs` detects patterns but only suggests `/learn` | Patterns are lost if user forgets to run `/learn` |

### Coherence Issues

| Issue | Detail |
|-------|--------|
| **`/tdd` vs `proactive-tdd`** | Same TDD agents, same workflow, different entry points. No shared state. If `proactive-tdd` ran partway, `/tdd` starts fresh. |
| **`/verify` vs `verification-loop` skill** | Nearly identical logic. `/verify` is user-invoked, `verification-loop` is Claude-invocable. Could be one implementation. |
| **`/code-review` vs `proactive-review`** | Same agent chain, different triggers. `proactive-review` has `context: fork`, `/code-review` does not. |
| **Test coverage** | `/test-coverage` generates tests in main context. `/tdd` uses specialist TDD agents. `/test-coverage` could delegate to TDD agents for better quality tests. |

---

## Agent Model Assignments

| Model | Agents | Rationale |
|-------|--------|-----------|
| **opus** | planner, architect, code-reviewer, java-reviewer, kotlin-reviewer, groovy-reviewer, python-reviewer, ts-security-reviewer, jvm-security-reviewer, python-security-reviewer, ci-cd-architect | Deep reasoning: architecture, security, quality |
| **sonnet** | ts-tdd-guide, jvm-tdd-guide, python-tdd-guide, ts-build-resolver, jvm-build-resolver, python-build-resolver, ts-e2e-runner, jvm-e2e-runner, python-e2e-runner, setup-agent, gradle-expert, maven-expert | Speed + quality balance: implementation tasks |
| **haiku** | ts-refactor-cleaner, jvm-refactor-cleaner, python-refactor-cleaner, doc-updater | Speed: bounded, mechanical tasks |

---

## Recommended Priority Fixes

### High: Complete the proactive chain

1. **Define proactive precedence:** `proactive-planning` triggers first for complex tasks. After plan confirmation, `proactive-tdd` triggers for implementation. After implementation, `proactive-review` triggers.
2. **Task lifecycle integration:** `/tdd` (and proactive-tdd) should create a task at start and complete it at end. This triggers `post-task-update.cjs` which suggests code review.
3. **Verification after TDD:** TDD agents should invoke `verification-loop` as a final step (build + types + lint + tests).

### Medium: Add remediation suggestions

4. **`/verify` failure mapping:** Build fail -> suggest `/build-fix`. Test fail -> suggest `/tdd`. Coverage low -> suggest `/test-coverage`. Lint fail -> suggest specific fix.
5. **`/code-review` next steps:** BLOCK verdict -> suggest specific commands per issue category.
6. **`/orchestrate` verification phases:** Insert `/verify quick` between agent handoffs.

### Low: Fill component gaps

7. **TypeScript security hook:** Create `typescript-security.js` mirroring `java-security.js` and `python-security.js`.
8. **Eval integration:** `/orchestrate feature` could start with `/eval define` and end with `/eval check`.
9. **Ecosystem cache reuse:** Commands read `DETECTED_ECOSYSTEM` from session instead of re-detecting.
10. **`/test-coverage` agent delegation:** Delegate test generation to TDD agents for ecosystem-appropriate test quality.
