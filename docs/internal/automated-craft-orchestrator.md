# Automated Craft Orchestrator

## Problem Statement

The craft pipeline relies on Claude following a defined phase sequence (QUICK DISCOVER → DISCOVER → PLAN → CRITIC → TDD → VERIFY → REVIEW+HARDEN → SIMPLIFY → DELIVER). In practice, Claude consistently skips discipline phases (REVIEW, SIMPLIFY) while rationalizing the skip with plausible reasoning. Adding more rules and red-flag tables to the skill file does not fix this — the executor is also the arbiter of process adherence.

**Root cause:** Claude has both the ability and the incentive to skip phases. Ability because there's no enforcement mechanism. Incentive because of context pressure and a bias toward "efficiency."

## Proposed Solution: Hybrid Orchestrator

An automated state machine that enforces phase sequencing while delegating creative work to Claude and specialized agents.

### Architecture

```
┌─────────────────────────────────────────────────┐
│                  Craft Runner                    │
│           (State Machine + Dispatcher)           │
├─────────────────────────────────────────────────┤
│                                                  │
│  State File (.claude/craft-state.md)             │
│       ↕                                          │
│  Phase Gate: validates output before advancing   │
│       ↕                                          │
│  Agent Dispatcher: launches required agent       │
│       ↕                                          │
│  Output Collector: captures and validates result │
│                                                  │
└─────────────────────────────────────────────────┘
         ↕              ↕              ↕
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │discoverer│  │ planner  │  │code-     │
   │  (opus)  │  │  (opus)  │  │reviewer  │
   └──────────┘  └──────────┘  │  (opus)  │
                               └──────────┘
```

### Phase → Agent Mapping

| Phase | Agent | Gate Condition |
|-------|-------|----------------|
| QUICK DISCOVER | Claude (inline) | Impact Brief written to state file |
| DISCOVER | `magic-claude:discoverer` | Discovery Brief returned |
| PLAN | `magic-claude:planner` | Plan file written to .claude/plans/ |
| CRITIC | `magic-claude:plan-critic` | ≤ MEDIUM findings after max 3 cycles |
| TDD | `magic-claude:*-tdd-guide` | Tests written + passing |
| VERIFY | Claude (inline) | Full test suite passes (exit 0) |
| REVIEW+HARDEN | `magic-claude:code-reviewer` | APPROVE verdict |
| SIMPLIFY | skill:simplify (3 agents) | Agents complete + fixes applied |
| DELIVER | Claude (inline) | Version bumped, committed, pushed |

### Enforcement Mechanisms

**Option A: Stop Hook (Recommended — simplest)**

A Stop hook reads `.claude/craft-state.md` after every Claude response. If the state file shows a phase was skipped (e.g., Phase jumped from TDD to DELIVER without REVIEW), the hook blocks with a message forcing Claude to go back.

```javascript
// Stop hook pseudo-code
const state = readCraftState();
if (state && state.phase === 'DELIVER' && !state.phaseSummary.includes('REVIEW: completed')) {
  return { decision: 'block', message: 'REVIEW phase was not completed. Run magic-claude:code-reviewer before DELIVER.' };
}
```

Pros: Simple, uses existing hook infrastructure, no new dependencies.
Cons: Reactive (catches skips after the fact), Claude can still write a fake phase summary.

**Option B: Agent-Only Pipeline (Most robust)**

Claude never executes phases directly. Instead, a coordinator script launches agents sequentially, passing outputs between them. Claude acts only as the implementer (writing code during TDD) and the human interface (presenting results, asking for plan approval).

Pros: Impossible to skip phases — the state machine controls advancement.
Cons: High token cost (each agent reads context from scratch), complex inter-agent context passing, loses Claude's accumulated understanding between phases.

**Option C: Hybrid with Hard Gates (Balanced)**

Claude orchestrates normally but cannot advance past certain phases without agent validation:
- After TDD: `code-reviewer` MUST run and return APPROVE before DELIVER is allowed
- After PLAN: `plan-critic` MUST run at least 1 cycle
- After implementation: `simplify` agents MUST run

The craft skill itself would check for agent outputs in the state file and refuse to proceed without them.

Pros: Preserves Claude's context and creative ability, enforces discipline at critical gates.
Cons: Claude could still fake the gate conditions (though this is less likely than skipping entirely).

### Key Design Decisions to Make

1. **Where does the orchestrator live?** Hook (reactive), skill (advisory), or standalone script (proactive)?
2. **How much context do agents need?** Full diff? State file? Plan file? All three?
3. **Human-in-the-loop points:** Plan approval, review feedback — how does the orchestrator pause for user input?
4. **Token budget:** Full agent pipeline for a 7-phase FULL mode could cost 200k+ tokens in agent spawns alone.
5. **LITE mode:** Does LITE mode need the same enforcement, or is it trusted for small changes?

### Inter-Agent Context Problem

The biggest technical challenge: each agent starts with zero context. The discoverer's findings need to reach the planner. The planner's output needs to reach the critic. The critic's feedback needs to reach the planner again.

Current approach: write everything to files (.claude/plans/, craft-state.md). This works but loses nuance.

Better approach: structured handoff documents that each agent reads as input. The state file already serves this purpose partially — enriching it further (which we just did with Resume Directive) moves in this direction.

### Relationship to Existing Work

- **craft-state.md enrichment** (just shipped, v2.28.0): Resume Directive and Pipeline Position are the first step toward machine-readable state for an orchestrator
- **paul's STATE.md patterns** (docs/internal/planning-comparison-paul.md): Visual pipeline position, ONE next action — designed for resumability, which an orchestrator also needs
- **PreCompact + SessionStart hooks**: Already implement the "enrich state → inject context" pattern that an orchestrator would use more aggressively

### Next Steps

1. Prototype Option A (Stop hook enforcement) — lowest effort, immediate value
2. Evaluate token cost of Option B with a real pipeline run
3. Design the gate conditions for Option C
4. Consider whether Agent Teams (experimental) could reduce context loss between agents
