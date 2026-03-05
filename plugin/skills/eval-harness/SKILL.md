---
name: eval-harness
description: >
  Use this skill when you want to establish what success looks like before building — creating test cases, assertions, and success metrics upfront. Invoke for eval-driven development, defining acceptance criteria first, setting up continuous quality checks, or building a measurement harness to track whether code works as intended. This is about defining the finish line before you start coding.
---

# Eval Harness

Eval-Driven Development (EDD): define expected behavior BEFORE implementation, measure continuously.

## Philosophy

- Define evals **before** coding — forces clarity on success criteria
- Run evals continuously — catch regressions early
- Use code graders when possible — deterministic > probabilistic
- Human review for security — never fully automate security checks
- Keep evals fast — slow evals don't get run
- Version evals with code — evals are first-class artifacts

## Metrics

| Metric | Meaning | Target |
|--------|---------|--------|
| pass@1 | First attempt success rate | Track over time |
| pass@3 | At least one success in 3 attempts | > 90% for capabilities |
| pass^3 | All 3 trials succeed | 100% for regressions / critical paths |

## Workflow

1. **Define** (before coding) — capability evals + regression evals + success metrics
2. **Implement** — write code to pass the defined evals
3. **Evaluate** — run each eval, record PASS/FAIL
4. **Report** — summarize with pass@k metrics + status

## Grader Types

- **Code-based** — `grep`, `npm test`, `npm run build` → deterministic, fastest
- **Model-based** — Claude evaluates open-ended output on a 1–5 scale
- **Human review** — flag HUMAN REVIEW REQUIRED for security-sensitive changes

## Eval Storage

```
.claude/evals/
  feature-xyz.md      # Eval definition
  feature-xyz.log     # Eval run history
  baseline.json       # Regression baselines
```

## Templates

See [references/templates.md](references/templates.md) for:
- Capability eval template
- Regression eval template
- Code/model/human grader templates
- Eval definition (pre-implementation) template
- Eval report template
- Complete authentication example
