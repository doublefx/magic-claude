---
description: Enforce test-driven development - tests first, then implement (80%+)
---

# TDD Command

Polyglot test-driven development -- detects the project ecosystem and dispatches to the right TDD specialist agent.

## Step 1: Detect Ecosystem

Check for project markers to determine the ecosystem:

**TypeScript/JavaScript** (any of):
- `tsconfig.json`, `package.json`, `next.config.*`, `vite.config.*`
- Lock files: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`

**JVM (Java/Kotlin/Groovy)** (any of):
- `pom.xml`, `build.gradle`, `build.gradle.kts`, `settings.gradle`, `settings.gradle.kts`
- Wrappers: `mvnw`, `gradlew`

**Python** (any of):
- `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements.txt`
- Lock files: `uv.lock`, `poetry.lock`, `Pipfile.lock`

If multiple ecosystems detected, ask which one to target.

## Step 2: Dispatch to Specialist Agent

| Ecosystem | Agent | Test Command | Coverage Tool |
|-----------|-------|--------------|---------------|
| TypeScript/JavaScript | **magic-claude:ts-tdd-guide** | `npm test` or `npx vitest` | Jest/Vitest `--coverage` |
| JVM (Gradle) | **magic-claude:jvm-tdd-guide** | `./gradlew test` | JaCoCo `./gradlew jacocoTestReport` |
| JVM (Maven) | **magic-claude:jvm-tdd-guide** | `./mvnw test` | JaCoCo `./mvnw jacoco:report` |
| Python | **magic-claude:python-tdd-guide** | `pytest` | pytest-cov `pytest --cov` |

## Step 3: TDD Cycle

The specialist agent follows this cycle:

```
RED → GREEN → REFACTOR → REPEAT

RED:      Write a failing test FIRST
GREEN:    Write minimal code to make it pass
REFACTOR: Improve code while keeping tests green
REPEAT:   Next feature/scenario
```

### What Each Agent Does

1. **Scaffold interfaces** for inputs/outputs
2. **Write tests that will FAIL** (because code doesn't exist yet)
3. **Run tests** and verify they fail for the right reason
4. **Write minimal implementation** to make tests pass
5. **Run tests** and verify they pass
6. **Refactor** code while keeping tests green
7. **Check coverage** and add more tests if below 80%

## Coverage Requirements

- **80% minimum** for all code
- **100% required** for:
  - Financial calculations
  - Authentication logic
  - Security-critical code
  - Core business logic

## TDD Best Practices

**DO:**
- Write the test FIRST, before any implementation
- Run tests and verify they FAIL before implementing
- Write minimal code to make tests pass
- Refactor only after tests are green
- Add edge cases and error scenarios

**DON'T:**
- Write implementation before tests
- Skip running tests after each change
- Write too much code at once
- Test implementation details (test behavior)

## Integration with Other Commands

- Use `magic-claude:plan` first to understand what to build
- Use `magic-claude:tdd` to implement with tests
- Use `magic-claude:build-fix` if build errors occur
- Use `magic-claude:code-review` to review implementation
- Use `magic-claude:test-coverage` to verify coverage

## Related Agents

| Ecosystem | Agent | Skill |
|-----------|-------|-------|
| TypeScript/JavaScript | `magic-claude:ts-tdd-guide` | `magic-claude:tdd-workflow` |
| JVM (Java/Kotlin/Groovy) | `magic-claude:jvm-tdd-guide` | `magic-claude:jvm-tdd-workflow` |
| Python | `magic-claude:python-tdd-guide` | `magic-claude:python-tdd-workflow` |
