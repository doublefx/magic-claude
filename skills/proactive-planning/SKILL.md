---
name: proactive-planning
description: Proactive implementation planning. Claude invokes this automatically for complex tasks, architectural changes, or unclear requirements before writing code.
user-invocable: false
context: fork
agent: planner
---

# Proactive Implementation Planning

This skill provides automatic implementation planning at strategic moments, ensuring Claude plans before coding on complex tasks.

## When Claude Should Invoke This Skill

Claude should proactively invoke this skill when:

1. **Complex Feature Request** - Task involves multiple components or files
2. **Architectural Changes** - System design or structure modifications
3. **Unclear Requirements** - Ambiguous or incomplete specifications
4. **High-Risk Changes** - Security, payments, or data-critical code
5. **Refactoring** - Large-scale code reorganization

## Scope

For planning without the full TDD/review pipeline (architectural discussions, requirement analysis, design decisions), this skill handles planning directly.

For complex multi-file features, `proactive-orchestration` handles the full pipeline including planning as Phase 1. This skill fires only when planning is needed as a standalone activity.

## Planning Process

### 1. Requirements Analysis

- Restate the requirement in clear terms
- Identify what's being built and why
- List explicit requirements
- Note implicit requirements
- Flag ambiguous areas

### 2. Risk Assessment

| Risk Level | Criteria |
|------------|----------|
| **HIGH** | Security, payments, auth, data loss potential |
| **MEDIUM** | Performance, multiple integrations, new patterns |
| **LOW** | Single file, well-understood domain, isolated change |

### 3. Implementation Breakdown

For each phase:
- **Phase Name** - Descriptive title
- **Components** - Files/modules affected
- **Dependencies** - What must exist first
- **Approach** - How it will be implemented
- **Risks** - Potential issues

### 4. Decision Points

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

## Estimated Scope
- Files affected: X
- New files: Y
- Test files: Z

## Ready to Proceed?
[WAIT for user confirmation before coding]
```

## Proactive Triggers

Claude should automatically plan when detecting:

- "Add", "implement", "build", "create" + multiple files likely
- "Refactor", "redesign", "restructure"
- "I need", "we need" + complex system description
- Questions about architecture or approach
- Uncertainty indicators ("maybe", "not sure", "what do you think")

## Context Forking Note

This skill runs with `context: fork` to allow deep analysis without consuming main context. A summary is returned to the main conversation.

## Related

- `/plan` command - Explicit user-invoked planning
- `proactive-orchestration` skill - Full pipeline orchestration (includes planning as Phase 1)
- `planner` agent - Full planning agent with Opus model
- `architect` agent - System design specialist
