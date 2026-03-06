# Orchestration State File Template

```markdown
# Orchestration State
Feature: <feature name>
Started: <ISO timestamp>
Phase: <current phase number and name>
Plan: <path to .claude/plans/ file>
Base SHA: <git SHA at plan approval>
Ecosystem: <TypeScript/JVM/Python>

## Phase Summary
- ARCHITECT: <SKIPPED / completed — brief summary>
- DISCOVER: <completed — N files, M patterns, K risks>
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
