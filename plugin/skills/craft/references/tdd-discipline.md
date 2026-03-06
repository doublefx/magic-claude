# TDD Discipline

## Iron Law

<HARD-GATE>
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.
If you write implementation code before a test exists and fails, DELETE the
implementation and start over. No exceptions.
</HARD-GATE>

## Anti-Rationalization

| Thought | Reality |
|---------|---------|
| "This is too simple for tests" | Simple code is the easiest to test. Write the test. |
| "I'll add tests after I write the code" | That's not TDD. Delete the code and write the test first. |
| "The test would just be trivial" | Trivial tests catch regressions. Write it. |
| "Let me get the code working first" | Code written without tests tends to stay untested. Test first. |
| "This is just a refactor, no new tests needed" | Run existing tests. If none cover it, add them before refactoring. |

## Proactive Triggers

Automatically enforce TDD when:

- User says "add", "implement", "create" + function/feature
- User describes new business logic
- User requests a bug fix (write reproducing test first)
- Working on files with existing tests
- Creating new source files

## Workflow

1. **Detect ecosystem** from file context and project markers
2. **Dispatch to specialist agent** (`magic-claude:ts-tdd-guide`, `magic-claude:jvm-tdd-guide`, or `magic-claude:python-tdd-guide`)
3. **Execute TDD cycle**: RED (failing test) → GREEN (minimal implementation) → REFACTOR → REPEAT
4. **Verify 80%+ coverage** using ecosystem-appropriate coverage tool

See `magic-claude:tdd-workflow` for the full ecosystem-specific methodology, tooling reference, and code patterns.
