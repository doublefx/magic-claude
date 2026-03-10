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
FULL:  QUICK DISCOVER -> TASK LIST -> DEEP DISCOVER -> PLAN -> PLAN CRITIC -> TDD -> VERIFY -> REVIEW+HARDEN -> SIMPLIFY -> DELIVER -> REPORT
                                                                              ^ HERE
LITE:  QUICK DISCOVER -> TASK LIST -> TDD -> VERIFY -> REVIEW -> REPORT

## Resume Directive
NEXT ACTION: <exactly one thing to do next>
REMAINING: <phases left in pipeline>
INVOKE: magic-claude:craft to continue the pipeline

## Impact Brief (Phase 1.1 — REQUIRED)
- **Target:** <symbol/file being changed — MUST be filled>
- **Fan-out:** <N call sites (M tested, K untested) — MUST be a number from actual scan>
- **Untested callers:** <list of specific caller symbols/files without test coverage>
- **Similar patterns:** <none | list of locations with line numbers>
- **Cross-module:** <yes/no — which modules>
- **Prior context:** <none | key finding from claude-mem>
- **Gate decision:** <LITE | FULL> — <one-line reason based on data above>

## Phase Summary
- 1.1 QUICK DISCOVER: <completed — fan-out N, M tested, K untested, gate: LITE|FULL>
- 1.2 TASK LIST: <N tasks created>
- 2 ARCHITECT: <SKIPPED / completed — brief summary>
- 3 DEEP DISCOVER: <SKIPPED (LITE) / completed — N files, M patterns, K risks>
- 4.1 PLAN: <APPROVED by user / pending>
- 4.2 PLAN CRITIC: <N cycles, M resolved, R remaining>
- 6.1 BASELINE: <X passing, Y failing>
- 6.2 TDD: <N/M tasks completed, X tests, Y% coverage>
- 7 VERIFY: <status>
- 8.1 REVIEW: <N cycles, M fixed, K deferred — see Review+Harden Report>
- 8.2 SIMPLIFY: <N fixed, M skipped — see Simplify Report>
- 9.2 DELIVER: <status>
- 9.3 REPORT: <status>

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
