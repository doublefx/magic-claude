---
description: Analyze test coverage and generate missing tests to reach 80%+ coverage threshold. Detects ecosystem and uses appropriate coverage tools.
---

# Test Coverage

Analyze test coverage and generate missing tests.

## Step 1: Detect Ecosystem and Run Coverage

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

## Step 2: Analyze Coverage Report

1. Identify files below 80% coverage threshold

## Step 3: Generate Missing Tests

For each under-covered file:
- Analyze untested code paths
- Generate unit tests for functions
- Generate integration tests for APIs
- Generate E2E tests for critical flows

### Ecosystem-Specific Test Patterns

| Ecosystem | Unit Test Framework | Assertions | Mocking |
|-----------|-------------------|------------|---------|
| TypeScript/JavaScript | Jest / Vitest | expect() | jest.mock() |
| JVM (Java) | JUnit 5 | AssertJ | Mockito |
| JVM (Kotlin) | JUnit 5 / Kotest | AssertJ | MockK |
| Python | pytest | assert / pytest.raises | unittest.mock / pytest-mock |

## Step 4: Verify

5. Verify new tests pass
6. Show before/after coverage metrics
7. Ensure project reaches 80%+ overall coverage

## Focus Areas

- Happy path scenarios
- Error handling
- Edge cases (null, undefined, empty, None)
- Boundary conditions
