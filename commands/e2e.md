---
description: Generate and run end-to-end tests with ecosystem-aware dispatch
argument-hint: "[test description or user flow]"
---

# E2E Command

This command detects the project ecosystem and dispatches to the appropriate E2E testing specialist.

## Step 1: Detect Ecosystem

Check for ecosystem markers in the project root:

| Marker File | Ecosystem | Agent |
|-------------|-----------|-------|
| `package.json`, `tsconfig.json`, `next.config.*` | TypeScript/JavaScript | **magic-claude:ts-e2e-runner** |
| `pom.xml`, `build.gradle`, `build.gradle.kts`, `*.java`, `*.kt` | JVM (Java/Kotlin/Groovy) | **magic-claude:jvm-e2e-runner** |
| `pyproject.toml`, `setup.py`, `requirements.txt`, `*.py` | Python | **magic-claude:python-e2e-runner** |

If multiple ecosystems detected, ask user which to target.

## Step 2: Dispatch to Specialist

| Ecosystem | Agent | Framework |
|-----------|-------|-----------|
| TypeScript/JavaScript | **magic-claude:ts-e2e-runner** | Playwright |
| JVM | **magic-claude:jvm-e2e-runner** | Selenium WebDriver, REST Assured |
| Python | **magic-claude:python-e2e-runner** | pytest-playwright, httpx |

## Step 3: E2E Workflow

The specialist agent will:

1. **Analyze user flow** and identify test scenarios
2. **Generate E2E tests** using the ecosystem's preferred framework
3. **Run tests** and capture results
4. **Capture failures** with screenshots, videos, traces, or logs
5. **Generate report** with results and artifacts
6. **Identify flaky tests** and recommend fixes

## What This Command Does

1. **Generate Test Journeys** - Create tests for user flows
2. **Run E2E Tests** - Execute tests across browsers/environments
3. **Capture Artifacts** - Screenshots, videos, traces on failures
4. **Upload Results** - HTML reports and JUnit XML
5. **Identify Flaky Tests** - Quarantine unstable tests

## When to Use

Use `/e2e` when:
- Testing critical user journeys (login, trading, payments)
- Verifying multi-step flows work end-to-end
- Testing UI interactions and navigation
- Validating API integration flows
- Preparing for production deployment

## Ecosystem-Specific Commands

### TypeScript/JavaScript (Playwright)
```bash
npx playwright test
npx playwright test --headed
npx playwright test --trace on
npx playwright show-report
```

### JVM (Selenium/REST Assured)
```bash
./gradlew test --tests "*E2E*"
./gradlew test -Dtags="e2e"
./mvnw verify -Dit.test="*E2E*"
```

### Python (pytest-playwright)
```bash
pytest tests/e2e/ -v
pytest tests/e2e/ --headed
pytest tests/e2e/ --tracing on
pytest tests/e2e/ --html=report.html
```

## Best Practices (All Ecosystems)

**DO:**
- Use Page Object Model for maintainability
- Use data-testid attributes for selectors
- Wait for conditions, not arbitrary timeouts
- Test critical user journeys end-to-end
- Capture screenshots on failure

**DON'T:**
- Use brittle CSS selectors
- Test implementation details
- Run tests against production
- Ignore flaky tests
- Skip artifact review on failures
