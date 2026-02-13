---
name: proactive-review
description: Proactive code quality and security review. Claude invokes this automatically when tasks are completed, before commits, or when significant code changes are made.
user-invocable: false
context: fork
agent: code-reviewer
---

# Proactive Code Review

This skill provides automatic code quality and security review at strategic moments in the development workflow. It delegates to the `/code-review` command workflow.

## When Claude Should Invoke This Skill

Claude should proactively invoke this skill when:

1. **Task Completion** - A development task was just completed
2. **Before Commit** - User is about to commit code changes
3. **Significant Changes** - Multiple files or complex logic was modified
4. **Security-Sensitive Code** - Authentication, authorization, input handling, or API endpoints were touched

## Scope

For standalone review needs (pre-commit review, reviewing existing code, reviewing someone else's code), this skill handles review directly.

For complex multi-file features, `proactive-orchestration` includes review as the final phase of the full pipeline (planning, TDD, verification, review). This skill fires only when review is needed without the full orchestration pipeline.

## Workflow

When triggered, follow the same workflow as the `/code-review` command:

1. **Get changed files** via `git diff --name-only HEAD`
2. **Detect ecosystem** from file extensions
3. **Apply ecosystem-appropriate checks** (security, quality, best practices)
4. **Dispatch to specialist agents** (code-reviewer, language reviewers, security reviewers)
5. **Generate report** with severity-based findings
6. **Issue verdict**: BLOCK / WARN / APPROVE
7. **Provide remediation suggestions** if issues found

See the `/code-review` command for the full security checklists, quality checks, agent dispatch table, report format, and remediation suggestions.

## Context Forking Note

This skill runs with `context: fork` to preserve the main conversation context. The review output will be summarized back to the main context, keeping only actionable findings.

## Related

- `/code-review` command - Explicit user-invoked review (single source of truth for review workflow)
- `proactive-orchestration` skill - Full pipeline orchestration (includes review as final phase)
- `code-reviewer` agent - General quality and security review
- `java-reviewer` agent - Java idioms and security
- `kotlin-reviewer` agent - Kotlin idioms and null safety
- `python-reviewer` agent - Python idioms and security
- `groovy-reviewer` agent - Groovy/Spock patterns
- `ts-security-reviewer` agent - TypeScript/JavaScript security specialist
- `jvm-security-reviewer` agent - JVM security specialist
- `python-security-reviewer` agent - Python security specialist
- `security-review` skill - TypeScript/JavaScript security checklist
- `jvm-security-review` skill - JVM security checklist
- `python-security-review` skill - Python security checklist
