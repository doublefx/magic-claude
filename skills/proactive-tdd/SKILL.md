---
name: proactive-tdd
description: Proactive test-driven development enforcement. Claude invokes this automatically when writing new features, fixing bugs, or implementing business logic to ensure tests are written first.
user-invocable: false
---

# Proactive TDD Enforcement

This skill enforces test-driven development methodology when Claude is implementing new functionality. It detects the project ecosystem and invokes the appropriate TDD agent.

## When Claude Should Invoke This Skill

Claude should proactively use TDD methodology when:

1. **New Feature Implementation** - Adding new functions, components, or modules
2. **Bug Fixes** - Write test that reproduces bug first
3. **Business Logic** - Any logic involving calculations, rules, or workflows
4. **API Endpoints** - New routes or handlers
5. **Data Transformations** - Parsing, formatting, mapping functions

## Ecosystem Detection

Detect the target ecosystem from file context:

**TypeScript/JavaScript** (dispatch to `ts-tdd-guide`):
- Working with `.ts`, `.tsx`, `.js`, `.jsx` files
- `tsconfig.json`, `package.json`, `jest.config.*`, `vitest.config.*` present
- Test command: `npm test` or `npx vitest`

**JVM (Java/Kotlin/Groovy)** (dispatch to `jvm-tdd-guide`):
- Working with `.java`, `.kt`, `.groovy` files
- `pom.xml`, `build.gradle`, `build.gradle.kts` present
- Test command: `./gradlew test` or `./mvnw test`

**Python** (dispatch to `python-tdd-guide`):
- Working with `.py` files
- `pyproject.toml`, `setup.py`, `conftest.py` present
- Test command: `pytest`

## TDD Cycle

```
RED → GREEN → REFACTOR → REPEAT

RED:      Write a failing test first
GREEN:    Write minimal code to make it pass
REFACTOR: Improve code while tests stay green
REPEAT:   Next test case
```

## Mandatory Workflow

### Step 1: Detect Ecosystem
Examine the file being worked on and project markers to choose the right agent.

### Step 2: Write Failing Test (RED)

**TypeScript/JavaScript:**
```typescript
describe('newFunction', () => {
  it('should handle happy path', () => {
    expect(newFunction(input)).toEqual(expected)
  })
})
```

**JVM (Java):**
```java
@Test
@DisplayName("should handle happy path")
void shouldHandleHappyPath() {
    assertThat(newFunction(input)).isEqualTo(expected);
}
```

**Python:**
```python
def test_should_handle_happy_path():
    assert new_function(input) == expected
```

### Step 3: Run Test - MUST FAIL

| Ecosystem | Command |
|-----------|---------|
| TypeScript/JavaScript | `npm test path/to/test` |
| JVM (Gradle) | `./gradlew test --tests "*TestClass"` |
| JVM (Maven) | `./mvnw test -Dtest=TestClass` |
| Python | `pytest tests/test_module.py -v` |

### Step 4: Implement Minimal Code (GREEN)

### Step 5: Run Test - MUST PASS

### Step 6: Refactor (IMPROVE)

### Step 7: Check Coverage

| Ecosystem | Command | Target |
|-----------|---------|--------|
| TypeScript/JavaScript | `npm test -- --coverage` | 80%+ |
| JVM (Gradle) | `./gradlew jacocoTestReport` | 80%+ |
| JVM (Maven) | `./mvnw jacoco:report` | 80%+ |
| Python | `pytest --cov=src --cov-fail-under=80` | 80%+ |

## Test Cases to Write

For every function:

| Case Type | Example |
|-----------|---------|
| **Happy path** | Valid input -> expected output |
| **Empty input** | Empty array, empty string, null/None |
| **Edge cases** | Max values, min values, boundaries |
| **Error cases** | Invalid input -> appropriate error |
| **Type safety** | Wrong types rejected |

## Coverage Requirements

| Code Type | Minimum Coverage |
|-----------|-----------------|
| General code | 80% |
| Business logic | 90% |
| Financial calculations | 100% |
| Authentication | 100% |
| Security-critical | 100% |

## Anti-Patterns to Avoid

- **NO** - Writing implementation before tests
- **NO** - Skipping the "verify test fails" step
- **NO** - Writing too much code at once
- **NO** - Testing implementation details
- **NO** - Mocking everything
- **NO** - Leaving tests commented out

## Proactive Triggers

Claude should automatically enforce TDD when:

- User says "add", "implement", "create" + function/feature
- User describes new business logic
- User requests a bug fix (write reproducing test first)
- Working on files with existing tests
- Creating new source files

## Related

- `/tdd` command - Explicit user-invoked TDD session (with ecosystem router)
- `ts-tdd-guide` agent - TypeScript/JavaScript TDD specialist
- `jvm-tdd-guide` agent - JVM (Java/Kotlin/Groovy) TDD specialist
- `python-tdd-guide` agent - Python TDD specialist
- `tdd-workflow` skill - TypeScript/JavaScript TDD methodology reference
- `jvm-tdd-workflow` skill - JVM TDD methodology reference
- `python-tdd-workflow` skill - Python TDD methodology reference
