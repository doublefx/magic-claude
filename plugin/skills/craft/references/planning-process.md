# Planning Process

Detailed planning methodology for FULL mode (Phase 1). In LITE mode, planning is skipped.

## Requirements Refinement (when needed)

When the request is vague or ambiguous, refine before planning:
- Ask **one question at a time** — never dump multiple questions
- **Prefer multiple choice** over open-ended when possible
- Confirm understanding by restating the requirement back
- Skip when requirements are already specific and actionable

## Approach Exploration (when multiple valid paths exist)

- Present **2-3 approaches** with trade-offs (complexity, performance, maintainability)
- Lead with your recommendation and explain why
- Include the "do less" option — YAGNI applies
- Get user buy-in before detailing the plan

## Risk Assessment

| Risk Level | Criteria |
|------------|----------|
| **HIGH** | Security, payments, auth, data loss potential |
| **MEDIUM** | Performance, multiple integrations, new patterns |
| **LOW** | Single file, well-understood domain, isolated change |

## Decision Points

Identify decisions that need user input:
- Technology choices
- Architectural patterns
- Trade-offs (speed vs quality, etc.)
- Scope boundaries

## Plan Template

```markdown
# Implementation Plan: [Feature Name]

## Requirements Summary
[Clear restatement of what needs to be built]

## Risk Assessment
**Level:** HIGH/MEDIUM/LOW
**Factors:**
- [factor 1]
- [factor 2]

## Implementation Phases

### Phase 1: [Name]
**Components:** [files/modules]
**Approach:** [how to implement]
**Dependencies:** [prerequisites]

### Phase 2: [Name]
...

## Decision Points
1. [Decision needed] - Options: A, B, C
2. [Decision needed] - Options: X, Y

## Scope
- Files affected: X
- New files: Y
- Test files: Z

## Ready to Proceed?
[WAIT for user confirmation before coding]
```
