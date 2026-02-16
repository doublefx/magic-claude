---
name: verification-loop
description: Use after completing features, before creating PRs, or after refactoring to verify the project is in a healthy state.
allowed-tools: Read, Grep, Glob, Bash(npm run *), Bash(npx *), Bash(node tests/*), Bash(pnpm run *), Bash(yarn run *), Bash(./gradlew *), Bash(./mvnw *), Bash(pytest *), Bash(python -m *), Bash(pyright *), Bash(ruff *)
---

# Verification Loop Skill

A comprehensive verification system for Claude Code sessions across all ecosystems.

## When to Activate

Invoke this skill:
- After completing a feature or significant code change
- Before creating a PR
- When you want to ensure quality gates pass
- After refactoring

## Workflow

Follow the same verification process as `/verify full`:

1. **Detect ecosystem** from project markers (package.json, pom.xml, pyproject.toml, etc.)
2. **Build check** - Compile/build, STOP if fails
3. **Type check** - TypeScript `tsc --noEmit`, Python `pyright`/`mypy`, JVM (compiler)
4. **Lint check** - ESLint, Checkstyle/ktlint, Ruff
5. **Test suite** - Run tests with coverage, report pass/fail and coverage %
6. **Debug statement audit** - Detect console.log, System.out.println, print()
7. **Git status** - Show uncommitted changes

See the `/verify` command for the full ecosystem detection table, command matrix, output format, and remediation suggestions.

## Continuous Mode

For long sessions, run verification every 15 minutes or after major changes:

- After completing each function
- After finishing a component
- Before moving to next task

Run: `/verify`

## Integration with Hooks

This skill complements PostToolUse hooks but provides deeper verification.
Hooks catch issues immediately; this skill provides comprehensive review.
