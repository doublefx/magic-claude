---
name: proactive-tdd
description: Proactive test-driven development enforcement. Claude invokes this automatically when writing new features, fixing bugs, or implementing business logic to ensure tests are written first.
user-invocable: false
---

# Proactive TDD Enforcement

This skill enforces test-driven development methodology when Claude is implementing new functionality.

## When Claude Should Invoke This Skill

Claude should proactively use TDD methodology when:

1. **New Feature Implementation** - Adding new functions, components, or modules
2. **Bug Fixes** - Write test that reproduces bug first
3. **Business Logic** - Any logic involving calculations, rules, or workflows
4. **API Endpoints** - New routes or handlers
5. **Data Transformations** - Parsing, formatting, mapping functions

## TDD Cycle

```
RED → GREEN → REFACTOR → REPEAT

RED:      Write a failing test first
GREEN:    Write minimal code to make it pass
REFACTOR: Improve code while tests stay green
REPEAT:   Next test case
```

## Mandatory Workflow

### Step 1: Define Interface (SCAFFOLD)
```typescript
// Define types/interfaces first
interface Input { ... }
interface Output { ... }

function newFunction(input: Input): Output {
  throw new Error('Not implemented')
}
```

### Step 2: Write Failing Test (RED)
```typescript
describe('newFunction', () => {
  it('should handle happy path', () => {
    const input = { ... }
    const expected = { ... }
    expect(newFunction(input)).toEqual(expected)
  })

  it('should handle edge case', () => {
    expect(newFunction(emptyInput)).toEqual(defaultOutput)
  })

  it('should throw on invalid input', () => {
    expect(() => newFunction(null)).toThrow()
  })
})
```

### Step 3: Run Test - MUST FAIL
```bash
npm test path/to/test.ts
# Test MUST fail with expected error
```

### Step 4: Implement Minimal Code (GREEN)
```typescript
function newFunction(input: Input): Output {
  // Only enough code to pass the test
  return { ... }
}
```

### Step 5: Run Test - MUST PASS
```bash
npm test path/to/test.ts
# All tests should pass
```

### Step 6: Refactor (IMPROVE)
- Extract constants
- Improve naming
- Remove duplication
- Optimize if needed
- Keep tests passing!

### Step 7: Check Coverage
```bash
npm test -- --coverage
# Target: 80%+ coverage
```

## Test Cases to Write

For every function:

| Case Type | Example |
|-----------|---------|
| **Happy path** | Valid input → expected output |
| **Empty input** | Empty array, empty string, null |
| **Edge cases** | Max values, min values, boundaries |
| **Error cases** | Invalid input → appropriate error |
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

❌ **NO** - Writing implementation before tests
❌ **NO** - Skipping the "verify test fails" step
❌ **NO** - Writing too much code at once
❌ **NO** - Testing implementation details
❌ **NO** - Mocking everything
❌ **NO** - Leaving tests commented out

## Proactive Triggers

Claude should automatically enforce TDD when:

- User says "add", "implement", "create" + function/feature
- User describes new business logic
- User requests a bug fix (write reproducing test first)
- Working on files with existing tests
- Creating new source files

## Related

- `/tdd` command - Explicit user-invoked TDD session
- `tdd-guide` agent - Full TDD specialist agent
- `tdd-workflow` skill - Complete TDD methodology reference
