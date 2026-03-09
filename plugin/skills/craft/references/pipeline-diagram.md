# Orchestration Pipeline Diagram

```plantuml
digraph orchestration {
    rankdir=TB;
    node [shape=box, style=rounded];

    // Entry
    start [label="Feature request received", shape=doublecircle];

    // Phase 0.1
    quick_discover [label="Phase 0.1: QUICK DISCOVER\nImpact scan → fan-out\n→ pattern check"];
    gate [label="LITE or FULL?", shape=diamond];

    // Phase 0
    arch_gate [label="System design\ndecision needed?", shape=diamond];
    architect [label="Phase 0: ARCHITECT\n(magic-claude:architect)"];

    // Phase 0.5
    discover [label="Phase 0.5: DISCOVER\n(magic-claude:discoverer)"];

    // Phase 1
    plan [label="Phase 1: PLAN\n(magic-claude:planner)"];

    // Phase 1.1 (loop)
    plan_critic [label="Phase 1.1: PLAN CRITIC\n(adversarial review)"];
    critic_gate [label="CRITICAL/HIGH\nissues?", shape=diamond];
    plan_revise [label="Revise plan\n(incorporate feedback)"];
    cycle_limit [label="≤ 3 cycles?", shape=diamond];
    user_confirm [label="User confirms plan?", shape=diamond];

    // Phase 1.5
    eval_gate [label="--with-evals?", shape=diamond];
    eval_define [label="Phase 1.5: EVAL DEFINE"];

    // Phase 1.75 (advisory gate — FM-2)
    ui_gate [label="UI work detected?\n(advisory, user can skip)", shape=diamond];
    ui_design [label="Phase 1.75: UI DESIGN\n(magic-claude:ui-design)"];

    // Phase 2
    baseline [label="Phase 2.0: BASELINE\nRun existing tests"];
    tdd_loop [label="Phase 2.2: TDD\nRED → GREEN → REFACTOR\n(per-task loop)"];
    spec_review [label="Spec Review\n(adversarial)"];
    spec_pass [label="Spec passes?", shape=diamond];
    coverage_gate [label="Phase 2.3: COVERAGE\n≥ 80%?", shape=diamond];

    // Phase 3
    verify [label="Phase 3: VERIFY\nBuild → Types → Lint → Tests"];
    verify_pass [label="Verify passes?", shape=diamond];
    build_fix [label="Build Resolver\n(auto-fix)"];

    // Phase 4
    review [label="Phase 4.1: REVIEW\n(code-reviewer + security\n+ language reviewers)"];
    harden [label="Phase 4.2: HARDEN\nFix CRITICAL → HIGH → MEDIUM"];
    reverify [label="Re-verify\nTypes → Lint → Tests"];
    rereview [label="Re-review"];
    converge [label="No MEDIUM+\nissues?", shape=diamond];
    cycle_check [label="≤ 3 cycles?", shape=diamond];
    user_checkpoint [label="User: another\nround?", shape=diamond];
    low_issues [label="Fix LOW issues\n(if low-risk)"];
    final_verify [label="Final re-verify\nTypes → Lint → Tests"];

    // Phase 4.5
    simplify [label="Phase 4.5: SIMPLIFY\n(/simplify — 3 parallel agents)"];
    simplify_verify [label="Verify\nsimplification", shape=diamond];
    simplify_fix [label="Attempt fix"];
    simplify_refix [label="Fix succeeded?", shape=diamond];
    simplify_revert [label="Revert\nsimplification"];

    // Phase 4.6
    eval_check_gate [label="Evals defined?", shape=diamond];
    eval_check [label="Phase 4.6: EVAL CHECK"];

    // Phase 4.7
    deliver_gate [label="Delivery strategy?", shape=diamond];
    deliver [label="Phase 4.7: DELIVER\n(commit/merge/PR)"];

    // Phase 5
    report [label="Phase 5: REPORT\nOrchestration summary", shape=doublecircle];

    // LITE path
    lite_tdd [label="Phase 2: TDD\n(LITE path)"];

    // Edges
    start -> quick_discover;
    quick_discover -> gate;
    gate -> arch_gate [label="FULL"];
    gate -> lite_tdd [label="LITE\n(≤3 tested call sites\nisolated, ≤2 files)"];
    lite_tdd -> verify [label="→ VERIFY → REVIEW\n→ done"];
    arch_gate -> architect [label="yes"];
    arch_gate -> discover [label="no"];
    architect -> discover;
    discover -> plan;
    plan -> plan_critic;
    plan_critic -> critic_gate;
    critic_gate -> plan_revise [label="yes"];
    critic_gate -> user_confirm [label="no\n(clean)"];
    plan_revise -> cycle_limit;
    cycle_limit -> plan_critic [label="yes\n(re-critique)"];
    cycle_limit -> user_confirm [label="no\n(present as-is)"];
    user_confirm -> plan [label="modify"];
    user_confirm -> eval_gate [label="yes"];
    eval_gate -> eval_define [label="yes"];
    eval_gate -> ui_gate [label="no"];
    eval_define -> ui_gate;
    ui_gate -> ui_design [label="proceed\n(default)"];
    ui_gate -> baseline [label="skip /\nno UI"];
    ui_design -> baseline;
    baseline -> tdd_loop;
    tdd_loop -> spec_review;
    spec_review -> spec_pass;
    spec_pass -> tdd_loop [label="issues\n(max 2 fix cycles)"];
    spec_pass -> coverage_gate [label="pass\n(next task or done)"];
    coverage_gate -> verify [label="≥ 80%"];
    coverage_gate -> tdd_loop [label="< 80%\nadd tests"];
    verify -> verify_pass;
    verify_pass -> review [label="pass"];
    verify_pass -> build_fix [label="fail"];
    build_fix -> verify;
    review -> harden;
    harden -> reverify;
    reverify -> rereview;
    rereview -> converge;
    converge -> low_issues [label="yes"];
    converge -> cycle_check [label="no"];
    cycle_check -> harden [label="yes"];
    cycle_check -> user_checkpoint [label="no (3 reached)"];
    user_checkpoint -> harden [label="another round\n(reset counter)"];
    user_checkpoint -> low_issues [label="accept &\nproceed"];
    low_issues -> final_verify;
    final_verify -> simplify;
    simplify -> simplify_verify;
    simplify_verify -> eval_check_gate [label="pass"];
    simplify_verify -> simplify_fix [label="fail"];
    simplify_fix -> simplify_refix;
    simplify_refix -> eval_check_gate [label="yes"];
    simplify_refix -> simplify_revert [label="no"];
    simplify_revert -> eval_check_gate;
    eval_check_gate -> eval_check [label="yes"];
    eval_check_gate -> deliver_gate [label="no"];
    eval_check -> deliver_gate;
    deliver_gate -> deliver [label="yes"];
    deliver_gate -> report [label="no"];
    deliver -> report;
}
```
