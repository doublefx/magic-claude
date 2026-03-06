---
description: Eval-driven development with quality pipeline — craft mode with eval phases
argument-hint: "[define|check|report|list] [feature-name]"
---

# /eval — Eval-Driven Development

Invoke the `magic-claude:craft` skill with **eval define/check phases** integrated into the quality pipeline.

## Usage

```bash
# Define evals for a feature, then implement with full pipeline
/eval define feature-name

# Check evals after implementation
/eval check feature-name

# Generate comprehensive eval report
/eval report feature-name

# List all eval definitions
/eval list
```

## What Happens

1. **EVAL DEFINE** — Create eval criteria in `.claude/evals/feature-name.md` (capability + regression evals)
2. **TDD** — Implement using the craft pipeline (RED → GREEN → REFACTOR)
3. **VERIFY** — Build, type check, lint, test suite with coverage
4. **EVAL CHECK** — Run evals against implementation, record PASS/FAIL
5. **REVIEW** — Code review with harden loop (FULL mode)

This integrates the `magic-claude:eval-harness` skill into the craft pipeline. For TDD without evals, use `/tdd`. For the full pipeline without evals, use `/craft`.

## Eval Structure

```markdown
## EVAL: feature-name
Created: $(date)

### Capability Evals
- [ ] [Description of capability 1]
- [ ] [Description of capability 2]

### Regression Evals
- [ ] [Existing behavior 1 still works]
- [ ] [Existing behavior 2 still works]

### Success Criteria
- pass@3 > 90% for capability evals
- pass^3 = 100% for regression evals
```

## Subcommands

| Subcommand | What it does |
|------------|-------------|
| `define <name>` | Create new eval definition |
| `check <name>` | Run and check evals |
| `report <name>` | Generate full report |
| `list` | Show all evals |
| `clean` | Remove old eval logs (keeps last 10 runs) |

## Related

- `magic-claude:craft` skill — Full quality pipeline
- `magic-claude:eval-harness` skill — Eval definition and checking methodology
- `/craft` — Quality pipeline without eval phases
- `/tdd` — Lightweight TDD (craft LITE mode)
