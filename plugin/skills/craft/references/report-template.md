# Orchestration Report Template

```
ORCHESTRATION REPORT
====================

Pipeline: [ARCHITECT] -> DEEP DISCOVER -> PLAN <-> PLAN CRITIC (auto-loop) -> [EVAL DEFINE] -> [UI DESIGN] -> TDD (per-task) -> VERIFY -> REVIEW+HARDEN -> SIMPLIFY -> [EVAL CHECK] -> [DELIVER]
Ecosystem: [TypeScript/JVM/Python]

ARCHITECT:[SKIPPED / architecture proposal + ADRs produced]
DISCOVER: [Discovery Brief produced — N files mapped, M patterns found, K risks identified]
PLAN:     [APPROVED by user]
PLAN CRITIC: [N cycles, M findings resolved automatically, R remaining (C critical, H high, M medium, L low)]
UI DESIGN:[SKIPPED / design spec produced via <tool> + frontend-design]
BASELINE: [X tests passing, Y failing / clean]
TDD:      [N tasks completed, X tests written, Y% coverage]
SPEC:     [N/N tasks passed spec review (Z fix cycles)]
VERIFY:   [Build OK, Types OK, Lint OK, Tests X/Y passed]
HARDEN:   [N cycles, X issues fixed (C critical, H high, M medium, L low)]
SIMPLIFY: [Applied / Reverted / N files simplified]
REVIEW:   [APPROVE/WARN/BLOCK — no MEDIUM+ issues remaining]
EVALS:    [X/Y capability, X/Y regression] (if --with-evals)
DELIVER:  [current-branch / merged / PR #N / user-managed / SKIPPED]

Verdict:  SHIP / NEEDS WORK / BLOCKED

Next Steps:
- [If SHIP]: Ready to commit. Run `git add` and `git commit`.
- [If NEEDS WORK]: List specific remediation with commands.
- [If BLOCKED]: List critical blockers that must be resolved.
```
