---
description: Create step-by-step implementation plan. WAIT for user CONFIRM first.
argument-hint: "[feature description]"
---

# Plan Command

This command invokes the **magic-claude:planner** agent to create a comprehensive implementation plan before writing any code. The plan goes through adversarial review before user approval.

## What This Command Does

1. **Discover** - Run codebase discovery to ground the plan in verified facts
2. **Plan** - Create a step-by-step implementation plan
3. **Critic Review** - Adversarial stress-testing of the plan (auto-loop, max 3 cycles)
4. **Wait for Confirmation** - MUST receive user approval before proceeding
5. **Persist** - Save approved plan to `.claude/plans/YYYY-MM-DD-<feature>.md`

## When to Use

Use `/plan` when:
- Starting a new feature
- Making significant architectural changes
- Working on complex refactoring
- Multiple files/components will be affected
- Requirements are unclear or ambiguous

**Note:** For full feature implementation (plan + TDD + review + delivery), use `magic-claude:craft` instead — it includes planning as Phase 4.1 and handles the entire pipeline.

## How It Works

### Step 1: Discover (Phase 3)

Invoke the **magic-claude:discoverer** agent (opus) to ground the plan:
- Search claude-mem for prior decisions about this feature area
- Use Serena to explore affected symbols, find similar implementations
- Produce a Discovery Brief with verified facts (files, patterns, risks)

### Step 2: Plan (Phase 4.1)

Invoke the **magic-claude:planner** agent (opus) with the Discovery Brief:
1. **Analyze the request** and restate requirements in clear terms
2. **Break down into phases** with specific, actionable steps
3. **Identify dependencies** between components
4. **Assess risks** and potential blockers
5. **Present the draft plan** for critic review

### Step 3: Plan Critic (Phase 4.2 — auto-loop, max 3 cycles)

Invoke the **magic-claude:plan-critic** agent for adversarial review:
- Reviews for feasibility, completeness, risk, ordering, negative constraints
- Cross-references against Discovery Brief to catch hallucinated paths/APIs
- Produces severity-classified findings (CRITICAL/HIGH/MEDIUM/LOW)
- Auto-loops with planner to resolve CRITICAL/HIGH issues
- Exits when clean or after 3 cycles

### Step 4: Present and Confirm

Present the refined plan with:
- Summary of critic auto-loop process
- Any unresolved CRITICAL/HIGH findings (prominently highlighted)
- MEDIUM/LOW findings as advisory notes

**WAIT for explicit user confirmation** before proceeding.

### Step 5: Persist

Save approved plan to `.claude/plans/YYYY-MM-DD-<feature-name>.md` so it survives session loss, compaction, or exit.

## User Response Options

If you want changes, respond with:
- "modify: [your changes]"
- "different approach: [alternative]"
- "skip phase 2 and do phase 3 first"

## Important Notes

**CRITICAL**: The planner agent will **NOT** write any code until you explicitly confirm the plan with "yes" or "proceed" or similar affirmative response.

## Integration with Other Commands

After planning:
- Use `magic-claude:tdd` to implement with test-driven development
- Use `magic-claude:build-fix` if build errors occur
- Use `magic-claude:code-review` to review completed implementation

## Related

- `magic-claude:craft` skill - Full pipeline (includes planning as Phase 4.1)
- `magic-claude:planner` agent - Implementation planning
- `magic-claude:discoverer` agent - Codebase discovery (feeds into planner)
- `magic-claude:plan-critic` agent - Adversarial plan review
