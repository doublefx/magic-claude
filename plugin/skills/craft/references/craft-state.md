# Craft State File Template

```markdown
# Craft State
Feature: <feature name>
Started: <ISO timestamp>
Mode: <LITE | FULL>
Phase: <current phase number and name>
Plan: <path to .claude/plans/ file>
Base SHA: <git SHA at plan approval>
Ecosystem: <TypeScript/JVM/Python>

## Pipeline Position
FULL:  QUICK DISCOVER -> DISCOVER -> PLAN -> CRITIC -> TDD -> VERIFY -> REVIEW+HARDEN -> SIMPLIFY -> DELIVER
                                                        ^ HERE
LITE:  QUICK DISCOVER -> TDD -> VERIFY -> REVIEW

## Resume Directive
NEXT ACTION: <exactly one thing to do next>
REMAINING: <phases left in pipeline>
INVOKE: magic-claude:craft to continue the pipeline

## Impact Brief (Phase 0.1 — REQUIRED)
- **Target:** <symbol/file being changed — MUST be filled>
- **Fan-out:** <N call sites (M tested, K untested) — MUST be a number from actual scan>
- **Untested callers:** <list of specific caller symbols/files without test coverage>
- **Similar patterns:** <none | list of locations with line numbers>
- **Cross-module:** <yes/no — which modules>
- **Prior context:** <none | key finding from claude-mem>
- **Gate decision:** <LITE | FULL> — <one-line reason based on data above>

## Phase Summary
- QUICK DISCOVER: <completed — fan-out N, M tested, K untested, gate: LITE|FULL>
- ARCHITECT: <SKIPPED / completed — brief summary>
- DISCOVER: <SKIPPED (LITE) / completed — N files, M patterns, K risks>
- PLAN: <APPROVED by user / pending>
- CRITIC: <N cycles, M resolved, R remaining>
- BASELINE: <X passing, Y failing>
- TDD: <N/M tasks completed, X tests, Y% coverage>
- VERIFY: <status>
- REVIEW: <status>
- SIMPLIFY: <status>
- DELIVER: <status>

## Current Task
Task: <task number/name from plan>
Status: <in_progress / blocked / pending>

## Key Decisions
| When | Decision | Rationale |
|------|----------|-----------|

## Boundaries
- <file/pattern that must not be modified>

## Deferred Issues
| Issue | Effort | Why deferred |
|-------|--------|-------------|
```
