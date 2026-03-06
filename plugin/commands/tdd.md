---
description: Test-driven development with verification and review — craft LITE mode
argument-hint: "[task description]"
---

# /tdd — TDD with Quality Tail

Invoke the `magic-claude:craft` skill in **LITE mode** — skips planning phases but always includes verification and review.

## Usage

```bash
# TDD a specific feature
/tdd "add email validation to signup form"

# TDD a bug fix (write reproducing test first)
/tdd "fix null pointer in UserService.findById"
```

## What Happens

1. **TDD** — Detect ecosystem, dispatch to specialist agent (RED → GREEN → REFACTOR)
2. **VERIFY** — Build, type check, lint, test suite with coverage
3. **REVIEW** — Single-pass code review (no harden loop)

This is equivalent to `/craft --lite`. For the full pipeline with planning, discovery, and harden loop, use `/craft --full` or just `/craft` (auto-detects).

## Ecosystem Detection

| Markers | Ecosystem | Agent |
|---------|-----------|-------|
| `package.json`, `tsconfig.json` | TypeScript/JavaScript | `magic-claude:ts-tdd-guide` |
| `pom.xml`, `build.gradle*` | JVM | `magic-claude:jvm-tdd-guide` |
| `pyproject.toml`, `setup.py` | Python | `magic-claude:python-tdd-guide` |

## TDD Discipline

> See `magic-claude:craft` → [references/tdd-discipline.md](../skills/craft/references/tdd-discipline.md) for the Iron Law, anti-rationalization table, and proactive triggers.

## Coverage Requirements

- **80% minimum** for all code
- **100% required** for: financial calculations, authentication, security-critical, core business logic

## Related

- `magic-claude:craft` skill — Full pipeline (LITE and FULL modes)
- `magic-claude:tdd-workflow` skill — Ecosystem-specific TDD methodology reference
