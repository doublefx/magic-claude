---
name: proactive-tdd
description: Proactive test-driven development enforcement. Claude invokes this automatically when writing new features, fixing bugs, or implementing business logic to ensure tests are written first.
user-invocable: false
context: fork
---

# Proactive TDD Enforcement

This skill enforces test-driven development methodology when Claude is implementing new functionality. It detects the project ecosystem and delegates to the `/tdd` command workflow.

## When Claude Should Invoke This Skill

Claude should proactively use TDD methodology when:

1. **New Feature Implementation** - Adding new functions, components, or modules
2. **Bug Fixes** - Write test that reproduces bug first
3. **Business Logic** - Any logic involving calculations, rules, or workflows
4. **API Endpoints** - New routes or handlers
5. **Data Transformations** - Parsing, formatting, mapping functions

## Scope

For isolated TDD needs (adding tests to existing code, bug fix with reproduction test), this skill handles TDD directly.

For complex multi-file features, `proactive-orchestration` coordinates TDD as part of the full pipeline (planning, TDD, verification, review). This skill fires only when TDD is needed without the full orchestration pipeline.

## Workflow

When triggered, follow the same workflow as the `/tdd` command:

1. **Detect ecosystem** from file context and project markers
2. **Dispatch to specialist agent** (`ts-tdd-guide`, `jvm-tdd-guide`, or `python-tdd-guide`)
3. **Execute TDD cycle**: RED (failing test) -> GREEN (minimal implementation) -> REFACTOR -> REPEAT
4. **Verify 80%+ coverage** using ecosystem-appropriate coverage tool

See the `/tdd` command for the full ecosystem detection table, dispatch matrix, coverage requirements, and best practices.

## Proactive Triggers

Claude should automatically enforce TDD when:

- User says "add", "implement", "create" + function/feature
- User describes new business logic
- User requests a bug fix (write reproducing test first)
- Working on files with existing tests
- Creating new source files

## Related

- `/tdd` command - Explicit user-invoked TDD session (single source of truth for TDD workflow)
- `proactive-orchestration` skill - Full pipeline orchestration (includes TDD as a phase)
- `ts-tdd-guide` agent - TypeScript/JavaScript TDD specialist
- `jvm-tdd-guide` agent - JVM (Java/Kotlin/Groovy) TDD specialist
- `python-tdd-guide` agent - Python TDD specialist
- `tdd-workflow` skill - TypeScript/JavaScript TDD methodology reference
- `jvm-tdd-workflow` skill - JVM TDD methodology reference
- `python-tdd-workflow` skill - Python TDD methodology reference
