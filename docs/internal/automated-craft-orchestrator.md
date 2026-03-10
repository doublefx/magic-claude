# Automated Craft Orchestrator

## Problem Statement

The craft pipeline relies on Claude following a defined phase sequence (QUICK DISCOVER → DISCOVER → PLAN → CRITIC → TDD → VERIFY → REVIEW+HARDEN → SIMPLIFY → DELIVER). In practice, Claude consistently skips discipline phases (REVIEW, SIMPLIFY) while rationalizing the skip with plausible reasoning. Adding more rules and red-flag tables to the skill file does not fix this — the executor is also the arbiter of process adherence.

**Root cause:** Claude has both the ability and the incentive to skip phases. Ability because there's no enforcement mechanism. Incentive because of context pressure and a bias toward "efficiency." More rules create more things to rationalize away. The solution is removing Claude's authority over the process, not adding constraints to it.

## Chosen Architecture: Claude as Interface, Runner as Process Owner

Claude's role is strictly limited to **user communication**. It receives the user's request, launches the Craft Runner, and reports results. It makes zero process decisions.

```
User ←→ Claude (interface only)
              │
              │ launches once
              ▼
        ┌─────────────────┐
        │  Craft Runner   │  ← Autonomous agent
        │  (state machine)│     that IS the process
        │                 │
        │  Deterministic phase sequence
        │  File-based handoffs between phases
        │  Validates outputs before advancing
        │  Pauses for human input when needed
        │  Writes craft-state.md at every step
        └────────┬────────┘
                 │ dispatches
          ┌──────┼──────┬──────────┐
          ▼      ▼      ▼          ▼
     discoverer planner reviewer  TDD agent
       (opus)   (opus)   (opus)   (sonnet)
```

### Why This Architecture

| Alternative | Problem |
|-------------|---------|
| Claude as supervisor dispatching agents | Claude can still skip dispatching — the exact failure mode observed |
| Stop hook catching skips after the fact | Reactive, Claude can write fake phase summaries |
| More rules in the skill file | Rules are instructions Claude can rationalize away |
| Hard gates in the skill | Claude decides what constitutes a "pass" |
| **Autonomous Runner (chosen)** | **Claude has zero authority over the process** |

### Role Separation

| Concern | Owner |
|---------|-------|
| Understanding user intent | Claude |
| Launching the pipeline | Claude |
| Presenting results / asking for plan approval | Claude |
| Phase sequencing | Craft Runner |
| Agent dispatching | Craft Runner |
| Output validation | Craft Runner |
| Gate decisions (advance/retry/block) | Craft Runner |
| Implementation (writing code) | TDD Agent |
| Review (reading code) | Review Agent |
| Mode selection (LITE/FULL) | Quick Discover phase (data-driven, not judgment) |

## File-Based Handoffs

Each phase produces a structured output file. The next phase reads ONLY its required inputs — not the full codebase context, not the full conversation history. This is the primary mechanism for inter-agent knowledge transfer.

### Handoff Chain

```
User request (text)
    │
    ▼
Phase 0.1: QUICK DISCOVER
    → writes: .claude/craft-state.md (Impact Brief section)
    → decides: LITE or FULL based on fan-out data
    │
    ▼ (FULL only)
Phase 0.5: DISCOVER
    → reads: craft-state.md (Impact Brief)
    → writes: .claude/discovery-brief.md
    │
    ▼ (FULL only)
Phase 1: PLAN
    → reads: discovery-brief.md + craft-state.md
    → writes: .claude/plans/YYYY-MM-DD-feature.md
    │
    ▼ (FULL only)
Phase 1.1: CRITIC (max 3 cycles)
    → reads: plan file only
    → writes: critic findings back to Runner
    → Runner updates plan or advances
    │
    ▼
Phase 2: TDD
    → reads: plan file + specific task
    → writes: code + tests (to repo)
    → Runner validates: tests pass
    │
    ▼
Phase 3: VERIFY
    → reads: nothing (runs test suite)
    → validates: exit code 0, zero failures
    │
    ▼
Phase 4: REVIEW+HARDEN
    → reads: git diff only
    → writes: review verdict + findings
    → Runner validates: APPROVE verdict
    │
    ▼ (FULL only)
Phase 4.5: SIMPLIFY
    → reads: git diff only
    → writes: findings + fixes applied
    │
    ▼
Phase 5: DELIVER
    → reads: craft-state.md
    → executes: version bump, commit, push
```

### Handoff File Specifications

| File | Written by | Read by | Content |
|------|-----------|---------|---------|
| `.claude/craft-state.md` | Runner (every phase) | All phases, Claude (reporting) | Phase, mode, impact brief, resume directive |
| `.claude/discovery-brief.md` | Discoverer agent | Planner agent | Verified file paths, symbols, patterns, risks |
| `.claude/plans/YYYY-MM-DD-*.md` | Planner agent | Critic, TDD agent | Tasks, boundaries, success criteria |
| `git diff` (implicit) | TDD agent | Reviewer, Simplify agents | Code changes |

Each handoff file is small (2-5k tokens) and structured. Agents read only what they need — no agent reads the full codebase from scratch.

## Phase → Agent Mapping

| Phase | Agent | Model | Gate Condition |
|-------|-------|-------|----------------|
| QUICK DISCOVER | Craft Runner (inline) | — | Impact Brief written with real fan-out numbers |
| DISCOVER | `magic-claude:discoverer` | opus | Discovery Brief file written |
| PLAN | `magic-claude:planner` | opus | Plan file written to .claude/plans/ |
| CRITIC | `magic-claude:plan-critic` | opus | ≤ MEDIUM findings after max 3 cycles |
| **PLAN APPROVAL** | **Pause → Claude → User** | — | **User says "approved" (human gate)** |
| TDD | `magic-claude:*-tdd-guide` | sonnet | Tests written + passing |
| VERIFY | Craft Runner (inline) | — | Full test suite passes (exit 0) |
| REVIEW+HARDEN | `magic-claude:code-reviewer` | opus | APPROVE verdict |
| SIMPLIFY | 3 Explore agents (parallel) | sonnet | Agents complete, fixes applied if any |
| DELIVER | Craft Runner (inline) | — | Version bumped, committed, pushed |

## Human-in-the-Loop Points

The Runner pauses and returns control to Claude (who presents to user) at exactly these points:

1. **Plan approval** — After CRITIC converges, present plan for user review
2. **Review findings** — If reviewer returns BLOCK, present findings for user decision
3. **Completion** — Present final report

At all other points, the Runner proceeds autonomously.

## Craft Runner Implementation

The Runner is a long-running agent launched via Task tool:

```javascript
// Claude launches the Runner — this is Claude's ONLY process action
TaskCreate({
  subagent_type: 'magic-claude:craft-runner',
  prompt: `Feature: "${user_request}"
           Execute the craft state machine autonomously.
           Write all state to .claude/craft-state.md.
           Return when: plan needs approval, review blocks, or pipeline complete.`,
  run_in_background: true
});
```

The Runner's prompt IS the state machine. It contains:
- The exact phase sequence (no judgment calls)
- Gate conditions for each phase (objective, verifiable)
- Agent dispatch instructions (which agent, what context to pass)
- Pause conditions (when to return for human input)

The Runner cannot deviate because:
- Its prompt defines the sequence deterministically
- It dispatches agents — it doesn't do the work itself
- Gate conditions are objective (file exists? tests pass? verdict = APPROVE?)
- It has no incentive to skip (it's not under context pressure like Claude is)

## LITE vs FULL Mode

Quick Discover determines the mode based on data (fan-out count, test coverage, cross-module impact). The Runner applies the mode mechanically:

**FULL:** QUICK DISCOVER → DISCOVER → PLAN → CRITIC → [approval pause] → TDD → VERIFY → REVIEW → SIMPLIFY → DELIVER

**LITE:** QUICK DISCOVER → TDD → VERIFY → REVIEW → DELIVER

Both modes enforce REVIEW. Neither mode allows skipping it.

## Quality Guarantees

This architecture provides guarantees that the current system cannot:

| Guarantee | How |
|-----------|-----|
| Every code change is reviewed | Runner dispatches reviewer before DELIVER — no path skips it |
| Plans are stress-tested | Runner dispatches critic — Claude never sees the plan before the critic does |
| Tests exist before code | TDD agent writes tests first — it's the agent's mandate |
| Full test suite passes | Runner runs `node tests/run-all.cjs` and checks exit code |
| Simplification happens | Runner dispatches simplify agents — they run regardless of Claude's opinion |
| State survives compaction | craft-state.md is written at every phase transition (already implemented) |
| Process cannot be rationalized away | Claude has no process authority to rationalize |

## Relationship to Existing Work

- **craft-state.md enrichment** (v2.28.0): Resume Directive and Pipeline Position are already machine-readable state — the Runner reads this format
- **PreCompact + SessionStart hooks**: Already implement the "enrich state → inject context" pattern for compaction recovery
- **Existing agents**: discoverer, planner, plan-critic, code-reviewer, TDD guides — all exist and work. The Runner orchestrates them, it doesn't replace them
- **paul's STATE.md patterns**: Handoff files and visual pipeline position — concepts borrowed and adapted

## Next Steps

1. **Design the Craft Runner agent prompt** — the deterministic state machine as a markdown agent definition
2. **Define handoff file formats** — structured schemas for discovery-brief.md and other intermediary files
3. **Prototype with a real feature** — run the full pipeline once to validate the architecture
4. **Measure quality delta** — compare review findings, test coverage, and bug rate vs current approach
