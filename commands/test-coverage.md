---
description: Analyze test coverage and generate missing tests to reach 80%+ threshold
---

# Test Coverage

Analyze test coverage, identify gaps, and delegate test generation to specialist TDD agents.

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

## Step 2: Run Coverage

### TypeScript/JavaScript
```bash
npm test -- --coverage
# or
pnpm test --coverage
```
Coverage report: `coverage/coverage-summary.json`

### JVM (Gradle + JaCoCo)
```bash
./gradlew test jacocoTestReport
```
Coverage report: `build/reports/jacoco/test/html/index.html`

### JVM (Maven + JaCoCo)
```bash
./mvnw test jacoco:report
```
Coverage report: `target/site/jacoco/index.html`

### Python (pytest-cov)
```bash
pytest --cov=src --cov-report=json --cov-report=html
```
Coverage report: `htmlcov/index.html` and `coverage.json`

## Step 3: Analyze Coverage Report

1. Parse coverage report for the detected ecosystem
2. Identify files below 80% coverage threshold
3. For each under-covered file, list the untested code paths (functions, branches, lines)
4. Prioritize by: security-critical code > business logic > utilities

## Step 4: Delegate Test Generation to TDD Agent

Dispatch under-covered files to the appropriate TDD specialist agent using the Task tool:

| Ecosystem | Agent | Prompt Pattern |
|-----------|-------|----------------|
| TypeScript/JavaScript | **ts-tdd-guide** | "Write tests for [file] covering [untested paths]. Current coverage: [X]%. Target: 80%+" |
| JVM (Gradle) | **jvm-tdd-guide** | "Write tests for [file] covering [untested paths]. Current coverage: [X]%. Target: 80%+" |
| JVM (Maven) | **jvm-tdd-guide** | "Write tests for [file] covering [untested paths]. Current coverage: [X]%. Target: 80%+" |
| Python | **python-tdd-guide** | "Write tests for [file] covering [untested paths]. Current coverage: [X]%. Target: 80%+" |

The TDD agent will:
1. Write failing tests first (RED)
2. Implement minimal code to pass (GREEN) -- only if production code gaps exist
3. Refactor while keeping tests green (REFACTOR)
4. Ensure proper assertions, mocking, and edge case coverage

**Batch strategy:** If multiple files need coverage, group related files and dispatch to the TDD agent together. Use parallel Task calls for independent file groups.

## Step 5: Verify

1. Re-run the coverage command from Step 2
2. Parse the updated coverage report
3. Show before/after coverage metrics per file
4. Confirm project reaches 80%+ overall coverage
5. If still below threshold, repeat Steps 3-4 for remaining gaps

## Focus Areas

- Happy path scenarios
- Error handling
- Edge cases (null, undefined, empty, None)
- Boundary conditions

## Related Agents

| Ecosystem | Agent | Skill |
|-----------|-------|-------|
| TypeScript/JavaScript | `ts-tdd-guide` | `tdd-workflow` |
| JVM (Java/Kotlin/Groovy) | `jvm-tdd-guide` | `jvm-tdd-workflow` |
| Python | `python-tdd-guide` | `python-tdd-workflow` |
