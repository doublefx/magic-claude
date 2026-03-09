# Planning System Comparison: magic-claude vs paul

## Overview

### magic-claude

magic-claude's planning system is embedded within the **craft** skill (`plugin/skills/craft/SKILL.md`), a comprehensive quality pipeline that treats planning as one phase of a larger DISCOVER -> PLAN -> CRITIC -> TDD -> VERIFY -> REVIEW -> SIMPLIFY -> DELIVER -> REPORT workflow. Planning is agent-delegated: an opus-tier **discoverer** agent gathers verified codebase facts, an opus-tier **planner** agent produces the plan, and an opus-tier **plan-critic** agent stress-tests it through an adversarial auto-loop (max 3 cycles). Plans are persisted to `.claude/plans/` and orchestration state to `.claude/craft-state.md`. The system has two modes: LITE (small changes, skips planning entirely) and FULL (multi-file work, full pipeline).

### paul

paul (Plan-Apply-Unify Loop) is a standalone framework (`npx paul-framework`) built around a strict three-phase loop: PLAN -> APPLY -> UNIFY. Every unit of work must close with a UNIFY phase that reconciles planned vs. actual outcomes. paul explicitly avoids subagent delegation for implementation work, keeping development in-session to preserve context fidelity. State is tracked in `.paul/STATE.md` with visual loop-position indicators. Plans use structured YAML frontmatter with XML-formatted tasks, and acceptance criteria are first-class BDD-formatted elements. paul integrates with CARL (Context Augmentation & Reinforcement Layer) for dynamic just-in-time rule injection.

## Architecture Comparison

| Dimension | magic-claude | paul |
|-----------|-------------|------|
| **Planning entry point** | `craft` skill (proactive) or `/plan` command | `/paul:plan` command (explicit) |
| **Pre-planning discovery** | Dedicated `discoverer` agent (opus) with Serena + claude-mem | `/paul:discover` and `/paul:research` commands; no dedicated agent |
| **Plan creation** | `planner` agent (opus) in forked context via Task tool | In-session plan creation following `plan-phase.md` workflow |
| **Adversarial review** | `plan-critic` agent (opus) with auto-loop (max 3 cycles) | No adversarial review phase; relies on user approval only |
| **Plan format** | Markdown with phases, steps, risks, success criteria | YAML frontmatter + XML tasks + BDD acceptance criteria + boundaries |
| **State tracking** | `.claude/craft-state.md` (phase + task progress) | `.paul/STATE.md` (loop position, velocity metrics, decisions, session continuity) |
| **State visualization** | Phase summary lines (text) | Visual loop-position diagram (`PLAN -> APPLY -> UNIFY` with markers) + progress bars |
| **Implementation** | Delegated to TDD agents (sonnet) per task, with spec review | In-session execution, sequential tasks with verification checkpoints |
| **Closure/reconciliation** | REPORT phase produces summary, archives state | UNIFY phase produces SUMMARY.md, reconciles plan vs. actual, updates all state files |
| **Session continuity** | Crash recovery via state file; auto-resume after compaction | STATE.md session continuity section + HANDOFF-{date}.md for multi-day work |
| **Context management** | No explicit budget tracking; relies on compaction recovery | Explicit context brackets (FRESH >70%, MODERATE 40-70%, DEEP 20-40%, CRITICAL <20%) |
| **Rule system** | Static rules in `~/.claude/rules/` | CARL dynamic just-in-time rule injection based on activity type |
| **Scope per plan** | Entire feature (multi-phase, unlimited tasks) | 2-3 tasks per plan targeting ~50% context usage |
| **Project structure** | `.claude/plans/` and `.claude/craft-state.md` | `.paul/` with PROJECT.md, ROADMAP.md, STATE.md, config.md, SPECIAL-FLOWS.md, phases/ |

## Strengths: magic-claude

### 1. Adversarial Plan Critique (plan-critic auto-loop)

The auto-loop between planner and plan-critic (`plugin/agents/plan-critic.md`) is the standout differentiator. The critic uses BMAD's "must find issues" mandate with a minimum of 3 findings per review, severity classification (CRITICAL/HIGH/MEDIUM/LOW), confidence levels, and a structured attack plan (feasibility, completeness, risk, backward compatibility, ordering, negative constraints). This catches hallucinated file paths, missing edge cases, and ordering bugs before a single line of code is written. paul has no equivalent -- plans go directly from creation to user approval.

### 2. Discovery Brief as Ground Truth

The `discoverer` agent (`plugin/agents/discoverer.md`) produces a structured Discovery Brief with verified file paths, symbols, patterns, and risks -- all confirmed via Serena code navigation tools and claude-mem cross-session memory. The planner and critic cross-reference against this brief, catching plans that reference non-existent APIs or files. paul's `/paul:discover` is a simpler command without dedicated agent specialization or tool-verified output.

### 3. Multi-Agent Specialization

magic-claude uses purpose-built agents at each phase: architect (system design), discoverer (codebase facts), planner (plan creation), plan-critic (adversarial review), TDD guides (ecosystem-specific), code reviewers, security reviewers, and build resolvers. Each agent has a focused mandate and model tier (opus for planning/review, sonnet for implementation). paul keeps everything in a single session with a single agent.

### 4. Ecosystem-Aware Pipeline

The craft pipeline auto-detects ecosystems (TypeScript, JVM, Python) and routes to ecosystem-specific TDD agents, build resolvers, and security reviewers. paul is ecosystem-agnostic -- it defines task structure but doesn't specialize verification or implementation by language.

### 5. Integrated Quality Tail

Planning flows directly into TDD -> VERIFY -> REVIEW+HARDEN -> SIMPLIFY -- the entire quality pipeline is one continuous orchestration. paul's APPLY phase handles execution but quality verification is more manual (the `/paul:verify` command exists but is not automatically chained).

## Strengths: paul

### 1. Mandatory Loop Closure (UNIFY Phase)

paul's signature innovation is the mandatory UNIFY phase that reconciles planned vs. actual outcomes. Every plan produces a SUMMARY.md documenting what was built, what deviated, and why. This creates an audit trail that magic-claude lacks -- craft's REPORT phase produces a summary but doesn't systematically compare plan vs. reality at the task level. The UNIFY concept prevents orphaned plans and ensures every unit of work has documented closure.

### 2. Explicit Context Budget Management

paul's context bracket system (FRESH >70%, MODERATE 40-70%, DEEP 20-40%, CRITICAL <20%) with specific behavioral rules per bracket is a mature approach to a real problem. It includes token cost estimates for typical operations (PLAN templates ~3-5k, task execution ~5-15k, verification ~2-5k). magic-claude's craft skill relies on compaction recovery via state files but never explicitly tracks or manages context consumption. This is a significant gap -- context exhaustion mid-pipeline is a real failure mode.

### 3. Plan Sizing Discipline (2-3 Tasks, ~50% Context)

paul enforces a hard constraint: plans should contain 2-3 tasks targeting ~50% context usage. This prevents the common failure mode where a large plan consumes the entire context window during implementation. magic-claude plans can have unlimited tasks -- the pipeline trusts compaction recovery to handle context overflow, but recovery is inherently lossy.

### 4. Structured State File with Performance Metrics

paul's STATE.md (`src/templates/STATE.md`) is remarkably comprehensive: loop-position visualization, velocity metrics (plans completed, average duration, trend analysis), accumulated decisions table, deferred issues with effort estimates, active blockers, protected boundaries, and session continuity details -- all in a target of <100 lines. magic-claude's `craft-state.md` is more minimal: just phase progress, current task, and key decisions. paul's state file doubles as a project dashboard.

### 5. Session Continuity with Handoff Files

paul has a two-tier continuity model: STATE.md for quick same-day resume (minimal context needed) and HANDOFF-{date}.md for zero-context multi-day work. The `/paul:resume` command reads STATE.md and suggests exactly ONE next action, eliminating decision fatigue. magic-claude's crash recovery detects orphaned state files and auto-resumes, but lacks the deliberate handoff protocol for multi-day work across different sessions.

### 6. Boundaries as First-Class Plan Elements

Every paul PLAN.md includes an explicit `<boundaries>` section with "DO NOT CHANGE" declarations protecting specific files and patterns. These boundaries are enforced during APPLY -- the agent checks before modifying any file. magic-claude's planner can include negative constraints but they are advisory best practices, not structurally enforced during implementation.

### 7. Acceptance Criteria as First-Class BDD Elements

paul places acceptance criteria in a dedicated `<acceptance_criteria>` section using Given/When/Then format, and every task's `<done>` field references specific AC numbers (e.g., "AC-1 satisfied"). The UNIFY phase then reports PASS/FAIL per acceptance criterion with evidence. magic-claude's plans have "Success Criteria" as checkboxes but without the structured BDD format or per-criterion pass/fail reporting.

### 8. Skill Blocking Before Execution

paul's APPLY phase includes a blocking check: if a plan's `<skills>` section lists required specialized flows, execution halts until those skills are confirmed loaded. This prevents executing tasks that require tools the agent doesn't have. magic-claude has no equivalent pre-execution capability check.

### 9. Deliberate Subagent Restraint

paul's `subagent-criteria.md` provides a rigorous framework for when subagents are appropriate (task independence, clear scope, parallel value, 15-60 min complexity sweet spot, token efficiency, state compatibility) and when they are not. The default is in-session work; subagents are reserved for bounded discovery/research. This is a considered philosophical stance backed by the observation that subagent implementation work produces ~70% quality output requiring cleanup.

### 10. Roadmap and Phase Management

paul provides multi-phase project management with ROADMAP.md, milestones (`/paul:milestone`, `/paul:complete-milestone`), phase transitions, and decimal phase numbering (8.1, 8.2) for urgent work. magic-claude's planning is feature-scoped -- it plans one feature at a time without a broader project roadmap concept.

## Weaknesses: magic-claude

### 1. No Plan-vs-Actual Reconciliation

The craft pipeline's REPORT phase produces a summary but does not systematically compare what was planned against what was actually built. There is no equivalent of paul's UNIFY that documents deviations, logs why the plan diverged, and creates a per-acceptance-criterion PASS/FAIL report. This means plan drift goes undetected and undocumented.

### 2. No Explicit Context Budget Management

The pipeline has no mechanism to track context consumption or adjust behavior based on remaining capacity. It relies entirely on state file recovery after compaction. A plan with 15 tasks can consume the entire context window mid-implementation, trigger compaction, and lose nuanced context that the state file cannot capture.

### 3. Unlimited Plan Size

Plans can have unlimited tasks with no sizing discipline. A planner agent might produce a 20-step plan that cannot possibly execute within one context window. paul's 2-3 task constraint per plan is aggressive but prevents this failure mode.

### 4. No Structured Boundary Enforcement

While the planner's best practices mention "Negative Constraints" and the plan-critic checks for a "Do NOT" section, there is no structural enforcement during implementation. A TDD agent can modify protected files without hitting a guard. paul's boundary enforcement during APPLY is more rigorous.

### 5. No Multi-Session Project Continuity

The orchestration state tracks a single feature pipeline. There is no concept of a project roadmap, milestones, or multi-phase project tracking. Each `/craft` invocation is independent. For large projects requiring phased delivery over multiple sessions, there is no coordination mechanism.

### 6. Subagent Quality Risk

The pipeline delegates implementation to TDD agents (sonnet tier) running in forked context. These agents start fresh, must re-discover implementation context, and produce results that need integration. paul's criticism that subagent implementation produces ~70% quality output is worth taking seriously -- the spec review step in Phase 2 mitigates this but adds cost.

### 7. No Acceptance Criteria Verification at Closure

The REPORT phase does not verify acceptance criteria were met. It reports coverage numbers and review status, but does not trace back to the plan's success criteria with per-criterion evidence. paul's UNIFY does this systematically.

## Weaknesses: paul

### 1. No Adversarial Plan Review

Plans go from creation directly to user approval. There is no automated stress-testing, no minimum findings requirement, no severity classification. The user is the sole quality gate. If the user approves a plan with hallucinated file paths or missing edge cases, those issues propagate into APPLY.

### 2. No Pre-Plan Discovery Agent

paul's `/paul:discover` command provides codebase exploration, but it lacks a dedicated agent with tool-verified output, anti-hallucination rules, and structured Discovery Brief format. The discoverer in magic-claude uses Serena for verified symbol lookup and claude-mem for cross-session memory -- grounding the plan in facts rather than assumptions.

### 3. In-Session Bottleneck

By keeping all implementation work in-session, paul creates a serial bottleneck. Independent tasks cannot execute in parallel. For features with genuinely independent components (e.g., a backend API endpoint and a frontend component), parallel subagent execution would save time. paul's philosophy is internally consistent but sacrifices throughput.

### 4. No Ecosystem Specialization

paul is language-agnostic. It does not auto-detect whether a project uses TypeScript, Java, or Python, and does not route to specialized TDD, build, or security tools. Verification steps in PLAN.md are user-defined (e.g., "run `npm test`") rather than automatically generated.

### 5. Manual Quality Verification

While paul has `/paul:verify`, it is not automatically chained into the loop. The APPLY phase runs task verification steps, but there is no automated type checking, lint checking, security scanning, or coverage gating equivalent to magic-claude's Phase 3 (VERIFY) and Phase 4 (REVIEW+HARDEN) pipeline.

### 6. No Review/Harden Loop

paul has no code review agent, no iterative review+harden cycle, and no simplification audit. Quality assurance depends on the task-level verification commands defined in the plan and the user's manual review during UNIFY.

### 7. CARL Dependency

paul's rule system depends on CARL (Context Augmentation & Reinforcement Layer), which is a separate tool. Without CARL, paul loses dynamic rule injection and enforcement of loop discipline at phase transitions. magic-claude's rules are self-contained in the plugin.

## Concepts and Techniques to Investigate

### 1. Mandatory Plan-vs-Actual Reconciliation (UNIFY Pattern)

**Source:** `src/workflows/unify-phase.md`, `src/templates/SUMMARY.md`

paul's UNIFY phase creates a SUMMARY.md for every completed plan that compares each acceptance criterion against actual results (PASS/FAIL with evidence), documents deviations with reasons, and logs patterns observed during implementation.

**Why investigate:** magic-claude's REPORT phase is a summary, not a reconciliation. Adding a UNIFY-like step after TDD and before REVIEW would catch plan drift early. Per-criterion PASS/FAIL tracking with evidence creates an audit trail that helps future planning (the planner can reference past reconciliation reports to calibrate estimates and avoid recurring deviations).

**Problem it solves:** Plans that partially succeed but partially diverge go undetected. Without reconciliation, the same planning mistakes repeat across features.

### 2. Context Budget Brackets

**Source:** `src/references/context-management.md`

paul defines four context brackets (FRESH >70%, MODERATE 40-70%, DEEP 20-40%, CRITICAL <20%) with specific behavioral rules: in DEEP mode, use summaries instead of full files; in CRITICAL mode, stop new work and prepare handoff. Token cost estimates per operation type (PLAN ~3-5k, task execution ~5-15k) enable budget forecasting.

**Why investigate:** Context exhaustion mid-pipeline is a real failure mode in magic-claude. The craft pipeline can trigger compaction during implementation, losing nuanced context. Even with state file recovery, the quality of post-compaction work degrades. Explicit budget tracking would allow the pipeline to proactively split plans or suggest compaction at safe boundaries rather than recovering after the fact.

**Problem it solves:** Unpredictable context exhaustion causing mid-pipeline quality degradation.

### 3. Plan Sizing Constraints (2-3 Tasks, ~50% Context Target)

**Source:** `src/references/plan-format.md`, `src/references/context-management.md`

paul enforces that each plan contains 2-3 tasks targeting ~50% context consumption. If a feature requires more, it is split into multiple sequential plans within a phase.

**Why investigate:** magic-claude plans can have arbitrary numbers of tasks. A planner might produce a 15-step plan that works well on paper but causes context overflow during implementation. Adding a sizing heuristic to the planner agent (or to the plan-critic's review criteria) would prevent oversized plans. The planner could split large features into numbered sub-plans that chain sequentially.

**Problem it solves:** Plans that are too large to execute within a single context window.

### 4. Structured Boundary Enforcement

**Source:** `src/templates/PLAN.md` (`<boundaries>` section), `src/workflows/apply-phase.md` (boundary check before file modification)

paul plans include an explicit `<boundaries>` section declaring files that must not be modified, and the APPLY phase checks modified files against this list before executing. Violations halt execution.

**Why investigate:** magic-claude's planner mentions negative constraints as a best practice, and the plan-critic checks for their presence, but there is no runtime enforcement. A TDD agent in a forked context has no mechanism to check boundaries. Adding a PreToolUse hook or a boundary check in the spec-reviewer prompt would close this gap.

**Problem it solves:** Implementation drift where agents modify files they should not touch, breaking unrelated functionality.

### 5. Acceptance Criteria as Structured BDD Elements with Traceability

**Source:** `src/templates/PLAN.md` (`<acceptance_criteria>` section), `src/workflows/unify-phase.md` (per-AC verification)

paul's acceptance criteria use numbered Given/When/Then format, and every task's `<done>` field references specific AC numbers. The UNIFY phase reports PASS/FAIL per criterion with evidence. This creates end-to-end traceability: requirement -> AC -> task -> verification -> result.

**Why investigate:** magic-claude's plan format uses "Success Criteria" as a checklist, but there is no structured traceability from criteria to tasks to results. Adding BDD-formatted acceptance criteria with task-level references would improve the plan-critic's review (it could verify every AC is covered by at least one task) and enable structured pass/fail reporting in the REPORT phase.

**Problem it solves:** Unclear definition of "done" and inability to trace which plan tasks satisfy which requirements.

### 6. Session Continuity with Handoff Protocol

**Source:** `src/references/context-management.md`, `src/templates/HANDOFF.md`, `src/commands/handoff.md`

paul has a deliberate handoff protocol: HANDOFF-{date}.md files include loop position, decisions made, prioritized next actions, and resume context. The `/paul:resume` command reads state and suggests ONE next action.

**Why investigate:** magic-claude's crash recovery is reactive (detect orphaned state, ask user whether to resume). For multi-day features that span sessions intentionally (not due to crashes), there is no protocol for deliberate session handoff. Adding a `/handoff` command that generates a dated handoff file from the orchestration state would improve multi-session workflows.

**Problem it solves:** Loss of context and decision fatigue when resuming work across intentional session boundaries.

### 7. Performance Velocity Tracking

**Source:** `src/templates/STATE.md` (Performance Metrics section)

paul tracks plans completed, average duration, total execution time, per-phase statistics, and recent trend (improving/stable/degrading). This data accumulates over the project lifetime.

**Why investigate:** magic-claude has no visibility into pipeline performance over time. Tracking how long each craft pipeline phase takes (especially critic cycles, harden rounds, and TDD implementation) would enable: (a) identifying phases that are disproportionately slow, (b) calibrating plan sizes based on historical execution times, (c) giving users realistic time estimates.

**Problem it solves:** No data-driven insight into pipeline performance or improvement trends.

### 8. Subagent Decision Framework

**Source:** `src/references/subagent-criteria.md`

paul's six criteria for subagent appropriateness (task independence, clear scope, parallel value, 15-60 min complexity sweet spot, token efficiency, state compatibility) with explicit anti-patterns provide a rigorous decision framework.

**Why investigate:** magic-claude's agent system delegates liberally -- the craft pipeline spawns agents for discovery, planning, critique, TDD, spec review, code review, security review, and simplification. Each delegation costs 2-3k tokens in startup overhead and loses context. Applying paul's criteria would help identify phases where in-session execution is actually better (e.g., the spec review in Phase 2 might be cheaper in-session than as a delegated agent).

**Problem it solves:** Token waste and quality degradation from excessive agent delegation where in-session work would be more efficient.

## Recommendations

Prioritized by impact and implementation feasibility.

### Priority 1: Add Plan-vs-Actual Reconciliation to REPORT Phase

**Effort:** Medium | **Impact:** High

Modify the craft REPORT phase to include a UNIFY-like reconciliation step. For each task in the approved plan, document: completed/skipped/deviated with evidence. For each success criterion, report PASS/FAIL. Archive the reconciliation alongside the plan in `.claude/plans/`. This requires changes to:
- `plugin/skills/craft/SKILL.md` (Phase 5: REPORT section)
- `plugin/skills/craft/references/report-template.md` (add reconciliation section)

### Priority 2: Add Context Budget Awareness to Pipeline

**Effort:** Medium | **Impact:** High

Add a lightweight context budget estimation to the craft pipeline. At minimum, the planner should estimate whether the plan fits within a single context window based on task count and file count. If the estimate exceeds ~60% of capacity, the planner should split into sub-plans. This requires changes to:
- `plugin/agents/planner.md` (add sizing heuristic to planning process)
- `plugin/agents/plan-critic.md` (add "context budget feasibility" to the attack plan)

### Priority 3: Add Plan Sizing Discipline to Planner and Critic

**Effort:** Low | **Impact:** Medium

Add explicit guidance to the planner agent: plans with more than 5-7 tasks should be split into numbered sub-plans. Add a plan-critic check: if a plan has >7 tasks, flag it as HIGH severity with a recommendation to split. This requires minor additions to:
- `plugin/agents/planner.md` (plan sizing section)
- `plugin/agents/plan-critic.md` (add sizing to review attack plan)

### Priority 4: Structured Acceptance Criteria with Traceability

**Effort:** Medium | **Impact:** Medium

Adopt BDD Given/When/Then format for acceptance criteria in the plan template. Require each plan step to reference which AC it satisfies. Add AC-level pass/fail to the REPORT phase. This requires changes to:
- `plugin/skills/craft/references/planning-process.md` (plan template)
- `plugin/agents/planner.md` (plan format section)
- `plugin/skills/craft/references/report-template.md` (add per-AC reporting)

### Priority 5: Add Boundary Enforcement to Spec Reviewer

**Effort:** Low | **Impact:** Medium

Add a boundary check to the spec-reviewer prompt template. If the plan includes negative constraints or "Do NOT" sections, the spec reviewer should verify that TDD agent changes do not violate them. This requires changes to:
- `plugin/skills/craft/references/spec-reviewer-prompt.md` (add boundary validation step)

### Priority 6: Investigate Deliberate Handoff Protocol

**Effort:** Medium | **Impact:** Medium

Create a `/handoff` command that generates a dated handoff file from the current orchestration state, including decisions made, current position, and a single recommended next action. Useful for multi-day features. New files:
- `plugin/commands/handoff.md`
- Update `plugin/skills/craft/SKILL.md` to suggest handoff at natural break points

### Priority 7: Evaluate In-Session Execution for Lightweight Phases

**Effort:** Low | **Impact:** Low-Medium

Audit the craft pipeline to identify phases where agent delegation is overkill. Candidates: spec review (Phase 2 per-task review) could potentially run in-session rather than as a delegated agent, saving ~2-3k tokens per task. The plan-critic could also be evaluated for in-session execution when the plan is small. This is an analysis task, not a code change.

### Priority 8: Add Performance Velocity Tracking

**Effort:** High | **Impact:** Low

Track pipeline execution metrics (phase durations, critic cycles, harden rounds, total time) in the archived state file. Accumulate across features for trend analysis. This requires hook changes and state file format updates -- high effort for primarily informational value.
