---
name: proactive-tdd
description: Use when writing new features, fixing bugs, or implementing business logic in isolation (not part of a full orchestration pipeline). Does NOT fire when proactive-orchestration is active.
user-invocable: false
context: fork
---

# Proactive TDD Enforcement

This skill enforces test-driven development methodology when Claude is implementing new functionality. It detects the project ecosystem and delegates to the `magic-claude:tdd` command workflow.

## When Claude Should Invoke This Skill

Claude should proactively use TDD methodology when:

1. **New Feature Implementation** - Adding new functions, components, or modules
2. **Bug Fixes** - Write test that reproduces bug first
3. **Business Logic** - Any logic involving calculations, rules, or workflows
4. **API Endpoints** - New routes or handlers
5. **Data Transformations** - Parsing, formatting, mapping functions

## Scope

For isolated TDD needs (adding tests to existing code, bug fix with reproduction test), this skill handles TDD directly.

For complex multi-file features, `magic-claude:proactive-orchestration` coordinates TDD as part of the full pipeline (planning, TDD, verification, review). This skill fires only when TDD is needed without the full orchestration pipeline.

## Iron Law

<HARD-GATE>
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.
If you write implementation code before a test exists and fails, DELETE the
implementation and start over. No exceptions.
</HARD-GATE>

## Anti-Rationalization

If you catch yourself thinking any of these, STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is too simple for tests" | Simple code is the easiest to test. Write the test. |
| "I'll add tests after I write the code" | That's not TDD. Delete the code and write the test first. |
| "The test would just be trivial" | Trivial tests catch regressions. Write it. |
| "Let me get the code working first" | Code written without tests tends to stay untested. Test first. |
| "This is just a refactor, no new tests needed" | Run existing tests. If none cover it, add them before refactoring. |

**Violating the letter of the rules is violating the spirit of the rules.**

## Workflow

When triggered, follow the same workflow as the `magic-claude:tdd` command:

1. **Detect ecosystem** from file context and project markers
2. **Dispatch to specialist agent** (`magic-claude:ts-tdd-guide`, `magic-claude:jvm-tdd-guide`, or `magic-claude:python-tdd-guide`)
3. **Execute TDD cycle**: RED (failing test) -> GREEN (minimal implementation) -> REFACTOR -> REPEAT
4. **Verify 80%+ coverage** using ecosystem-appropriate coverage tool

See the `magic-claude:tdd` command for the full ecosystem detection table, dispatch matrix, coverage requirements, and best practices.

## Proactive Triggers

Claude should automatically enforce TDD when:

- User says "add", "implement", "create" + function/feature
- User describes new business logic
- User requests a bug fix (write reproducing test first)
- Working on files with existing tests
- Creating new source files

## Related

- `magic-claude:tdd` command - Explicit user-invoked TDD session (single source of truth for TDD workflow)
- `magic-claude:proactive-orchestration` skill - Full pipeline orchestration (includes TDD as a phase)
- `magic-claude:ts-tdd-guide` agent - TypeScript/JavaScript TDD specialist
- `magic-claude:jvm-tdd-guide` agent - JVM (Java/Kotlin/Groovy) TDD specialist
- `magic-claude:python-tdd-guide` agent - Python TDD specialist
- `magic-claude:tdd-workflow` skill - TypeScript/JavaScript TDD methodology reference
- `magic-claude:jvm-tdd-workflow` skill - JVM TDD methodology reference
- `magic-claude:python-tdd-workflow` skill - Python TDD methodology reference
