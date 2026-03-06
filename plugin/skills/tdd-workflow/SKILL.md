---
name: tdd-workflow
description: >
  TDD methodology for TypeScript/JavaScript, JVM (Java/Kotlin/Groovy), and Python. Use when writing
  new features, fixing bugs, or refactoring. Enforces RED → GREEN → REFACTOR with 80%+ coverage.
  Detects ecosystem and loads the matching patterns reference automatically.
context: fork
agent: general-purpose
---

# Test-Driven Development Workflow

## Ecosystem Detection

Detect the project ecosystem from context, then **immediately read the matching reference**:

| Ecosystem | Indicators | Reference to read |
|-----------|-----------|-------------------|
| TypeScript / JavaScript | `package.json`, `.ts`, `.tsx`, `.js` | [references/typescript-patterns.md](references/typescript-patterns.md) |
| JVM (Java / Kotlin / Groovy) | `build.gradle`, `pom.xml`, `.java`, `.kt` | [references/jvm-patterns.md](references/jvm-patterns.md) |
| Python | `pyproject.toml`, `requirements.txt`, `.py` | [references/python-patterns.md](references/python-patterns.md) |

## Iron Law

<HARD-GATE>
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.
If you write implementation code before a test exists and fails, DELETE the
implementation and start over. No exceptions.
</HARD-GATE>

## RED → GREEN → REFACTOR

1. **SCAFFOLD** — Define the interface/signature (no implementation body)
2. **RED** — Write a failing test for the expected behavior
3. **Run** — Confirm the test fails (if it passes, the test is wrong)
4. **GREEN** — Write the minimum code to make the test pass
5. **Run** — Confirm the test passes
6. **REFACTOR** — Clean up without changing behavior; keep tests green
7. **Coverage** — Verify 80%+ with the ecosystem's coverage tool

## Anti-Rationalization

| Thought | Reality |
|---------|---------|
| "This is too simple for tests" | Simple code is the easiest to test. Write the test. |
| "I'll add tests after" | That's not TDD. Delete the code and write the test first. |
| "Just a refactor, no new tests needed" | Run existing tests. If none cover it, add them first. |
| "Let me get the code working first" | Code written without tests tends to stay untested. |

## Coverage Requirements

- Minimum **80%** across branches, functions, lines, and statements
- All edge cases, error scenarios, and boundary conditions covered

## Related

- `magic-claude:craft` skill — Quality pipeline (LITE mode for discrete implementations, FULL mode for complex features)
- `magic-claude:ts-tdd-guide` agent — TypeScript/JavaScript TDD specialist
- `magic-claude:jvm-tdd-guide` agent — JVM TDD specialist
- `magic-claude:python-tdd-guide` agent — Python TDD specialist
