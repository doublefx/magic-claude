---
name: systematic-debugging
description: Use when encountering bugs, test failures, or unexpected behavior that build resolvers cannot fix. Enforces root cause investigation before proposing fixes.
user-invocable: false
context: fork
allowed-tools: Read, Grep, Glob, Bash(node *), Bash(npm *), Bash(npx *), Bash(pnpm *), Bash(yarn *), Bash(./gradlew *), Bash(./mvnw *), Bash(pytest *), Bash(python -m *), Bash(git *)
---

# Systematic Debugging

Structured root-cause investigation for bugs that escape the build/test pipeline. This skill complements build resolvers (which fix known error patterns) and TDD agents (which enforce test-first discipline) by providing a methodical investigation framework for unknown or complex bugs.

## When to Activate

- Build resolver exhausted its pattern library and the error persists
- Test failure that is not a build/type/lint error (logic bug, race condition, wrong output)
- Flaky test (passes sometimes, fails sometimes)
- Test pollution suspected (test passes in isolation, fails in suite)
- Production bug reproduction needed
- 2+ fix attempts have already failed (thrashing signal)

## When NOT to Activate

- Build/type/lint errors with known patterns -> use `magic-claude:*-build-resolver`
- Missing imports, type mismatches, config errors -> use build resolvers
- New feature implementation -> use `magic-claude:proactive-orchestration`
- Code quality issues -> use `magic-claude:code-reviewer`

## The Iron Law

> **NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

A fix without root cause understanding is a guess. Guesses create new bugs, hide the real problem, and waste more time than a proper investigation. The iron law applies to every bug regardless of perceived simplicity or time pressure.

## Anti-Rationalization Table

| Rationalization | Reality |
|----------------|---------|
| "I think I know what's wrong" | Thinking is not knowing. Trace the actual execution path. |
| "Let me just try this fix" | Trying fixes without root cause creates new bugs. |
| "The user is waiting" | A wrong fix wastes more time than a correct investigation. |
| "This is probably a race condition" | "Probably" means you haven't proven it. Reproduce first. |
| "It works on my machine" | Environment differences ARE the bug. Document them. |
| "Let me add more logging" | Logging without a hypothesis is fishing. Form hypothesis first. |
| "The test is just flaky" | Flaky means non-deterministic. Find the shared state or timing dependency. |
| "This worked before the merge" | Good -- now bisect to find the exact commit. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = wrong mental model. Return to Phase 1. |
| "Build resolver already failed, just patch it" | Build resolver failure means unknown root cause. Investigate, don't patch. |

## Red Flags (STOP Signals)

If any of these are happening, STOP and return to Phase 1:

- Proposing a fix before tracing the data flow
- "Quick fix for now, investigate later"
- Adding multiple changes without testing each one
- Skipping the failing test in Phase 4
- Each fix reveals a new problem in a different location
- Copying code from Stack Overflow without understanding the root cause
- Disabling or `@Ignore`-ing the failing test

## Phase 1: Root Cause Investigation

**Goal:** Identify the EXACT line/condition where behavior diverges from expectation.

1. **Reproduce the failure deterministically**
   - Run the failing test in isolation. Does it fail consistently?
   - If intermittent: suspect shared state, timing, or ordering dependency
   - Record exact reproduction steps, environment, and error output

2. **Capture the full error context**
   - Read the COMPLETE error message, stack trace, and surrounding logs
   - Note error codes, line numbers, and assertion messages
   - Check for swallowed exceptions upstream

3. **Trace backward from the symptom**
   - Start at the crash site (the line that throws/fails)
   - Work backward through the call chain: "Was the value correct here?"
   - See `root-cause-tracing.md` for the full 5-step process

4. **Identify the divergence point**
   - The transition from correct to incorrect state is the root cause location
   - State the root cause: "X happens because Y when Z"

**Output:** A root cause statement, not a fix proposal.

## Phase 2: Pattern Analysis

**Goal:** Classify the bug and assess its scope.

1. **Classify the bug pattern**
   - Race condition / timing dependency
   - Shared mutable state / test pollution
   - Null/undefined propagation
   - Stale closure / stale reference
   - Environment assumption (paths, OS, timezone, locale)
   - Missing validation at a boundary (see `defense-in-depth.md`)

2. **Search for similar patterns in the codebase**
   - If the bug is in function `foo()`, check all callers and similar functions
   - If it's a data flow issue, trace all paths that touch the same data
   - Use Serena tools (`jet_brains_find_referencing_symbols`) when available

3. **Assess scope**
   - Is this a single occurrence or a pattern?
   - Could the same class of bug exist elsewhere?

**Output:** Pattern classification and list of affected locations.

## Phase 3: Hypothesis Testing

**Goal:** Validate understanding before writing a fix.

1. **State a specific hypothesis**
   - "If [root cause] is correct, then [observable prediction]"
   - Example: "If the cache is stale, then clearing it before the operation should make the test pass"

2. **Design a minimal experiment**
   - Change ONE variable at a time
   - Prefer adding an assertion or temporary log over modifying logic

3. **Run the experiment**
   - If hypothesis is confirmed: proceed to Phase 4
   - If hypothesis is falsified: **form a NEW hypothesis** (do not pile fixes)

4. **Escalation gate**
   - If 3 hypotheses are falsified: the mental model is wrong
   - Escalate to the user and question the architecture, not the symptom
   - Consider invoking `magic-claude:architect` for structural analysis

**Output:** Confirmed hypothesis with evidence.

## Phase 4: Implementation

**Goal:** Fix the bug with a test that proves it, hardened against recurrence.

1. **Write a failing test first**
   - Hand off to the appropriate TDD agent:
     - `magic-claude:ts-tdd-guide` for TypeScript/JavaScript
     - `magic-claude:jvm-tdd-guide` for JVM (Java/Kotlin/Groovy)
     - `magic-claude:python-tdd-guide` for Python
   - The test must reproduce the exact bug condition

2. **Implement the minimal fix**
   - Fix the root cause, not the symptom
   - One fix per bug -- do not bundle unrelated changes

3. **Apply defense-in-depth if warranted**
   - If the bug was caused by missing validation, add validation at multiple layers
   - See `defense-in-depth.md` for the 4-layer pattern

4. **If timing-dependent: apply condition-based waiting**
   - Replace arbitrary `sleep`/`setTimeout`/`Thread.sleep` with condition polling
   - See `condition-based-waiting.md` for the `waitFor` pattern

5. **Verify the fix**
   - Run the new test: it should pass
   - Run the full test suite: no regressions
   - Feed into `magic-claude:verify full` for the complete quality gate

**Output:** Fix with test, verified green.

## Quick Reference Flowchart

```
Bug reported / test failure
      |
Can build-resolver fix it?
  YES --> Use magic-claude:*-build-resolver
  NO  --> Enter systematic-debugging
      |
Phase 1: REPRODUCE & TRACE
      |
Root cause identified?
  NO  --> Gather more context, re-trace
  YES --> Phase 2: CLASSIFY PATTERN
      |
Phase 2: Assess scope, find similar bugs
      |
Phase 3: HYPOTHESIS TEST
      |
Hypothesis confirmed?
  NO  --> New hypothesis (max 3, then escalate)
  YES --> Phase 4: IMPLEMENT (TDD)
      |
Phase 4: Failing test --> Fix --> Verify
      |
Verification green?
  NO  --> Return to Phase 1
  YES --> DONE
```

## Integration Points

| Trigger | This Skill Does | Hands Off To |
|---------|----------------|--------------|
| Build resolver cannot fix error | Phases 1-3: investigate root cause | Phase 4: TDD agent for failing test |
| Phase 4 fix implemented | -- | `magic-claude:verify full` for verification |
| Flaky test detected | Phase 1: reproduce, check pollution | `find-polluter.cjs` for bisection |
| Timeout-related flakiness | Reference `condition-based-waiting.md` | TDD agent for rewrite |
| 3+ hypotheses failed | Escalate to user | `magic-claude:architect` if structural |
| Bug pattern found elsewhere | Phase 2 scope assessment | Bulk fix across all locations |

## Supporting Techniques

| File | Purpose |
|------|---------|
| `root-cause-tracing.md` | 5-step backward call stack analysis process |
| `defense-in-depth.md` | 4-layer validation architecture to prevent recurrence |
| `condition-based-waiting.md` | Replace arbitrary timeouts with condition polling |
| `find-polluter.cjs` | Cross-platform test pollution bisection script |

## Related

- `magic-claude:*-build-resolver` agents -- Known error pattern resolution (upstream of this skill)
- `magic-claude:*-tdd-guide` agents -- Test-first discipline (used in Phase 4)
- `magic-claude:verification-loop` skill -- Quality gate (downstream of Phase 4)
- `magic-claude:proactive-orchestration` skill -- Feature pipeline (this skill handles bugs, not features)
- `magic-claude:architect` agent -- Structural analysis (escalation target from Phase 3)
