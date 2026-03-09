# Orchestration State File Template

```markdown
# Orchestration State
Feature: <feature name>
Started: <ISO timestamp>
Phase: <current phase number and name>
Plan: <path to .claude/plans/ file>
Base SHA: <git SHA at plan approval>
Ecosystem: <TypeScript/JVM/Python>

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
- <user decision 1>
- <user decision 2>
```
