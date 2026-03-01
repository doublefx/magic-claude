# Testing Requirements

## Minimum Test Coverage: 80%

Test Types (ALL required):
1. **Unit Tests** - Individual functions, utilities, components
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Critical user flows

## Test-Driven Development

TDD workflow (enforced by meta-skill and proactive-tdd):
1. Write test first (RED)
2. Run test - it should FAIL
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)

## Troubleshooting Test Failures

1. Use the appropriate **magic-claude:tdd-guide** agent (ts/jvm/python)
2. Check test isolation
3. Verify mocks are correct
4. Fix implementation, not tests (unless tests are wrong)

## Agent Support

- **magic-claude:ts-tdd-guide** - TypeScript/JavaScript TDD (Jest/Vitest)
- **magic-claude:jvm-tdd-guide** - JVM TDD (JUnit 5, Mockito, MockK)
- **magic-claude:python-tdd-guide** - Python TDD (pytest, hypothesis)
- **magic-claude:ts-e2e-runner** - Playwright E2E testing
- **magic-claude:jvm-e2e-runner** - Selenium/REST Assured E2E testing
- **magic-claude:python-e2e-runner** - pytest-playwright E2E testing
