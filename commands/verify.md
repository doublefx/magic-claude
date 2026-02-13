---
description: Run comprehensive verification on current codebase state - build, types, lint, tests, and security checks across all ecosystems
---

# Verification Command

Run comprehensive verification on current codebase state.

## Current State

Git status:
!`git status --short`

## Step 1: Detect Ecosystem

Check for ecosystem markers:
- `package.json` / `tsconfig.json` → TypeScript/JavaScript
- `pom.xml` / `build.gradle` / `build.gradle.kts` → JVM
- `pyproject.toml` / `setup.py` / `requirements.txt` → Python

## Instructions

Execute verification in this exact order:

### 1. Build Check

| Ecosystem | Command |
|-----------|---------|
| TypeScript/JavaScript | `npm run build` or `pnpm build` |
| JVM (Gradle) | `./gradlew build -x test` |
| JVM (Maven) | `./mvnw compile` |
| Python | `python -m py_compile` or `python -m build` |

If build fails, report errors and STOP.

### 2. Type Check

| Ecosystem | Command |
|-----------|---------|
| TypeScript | `npx tsc --noEmit` |
| Python | `pyright .` or `mypy .` |
| JVM | (Handled by compiler in build step) |

Report all type errors with file:line.

### 3. Lint Check

| Ecosystem | Command |
|-----------|---------|
| TypeScript/JavaScript | `npm run lint` or `npx eslint .` |
| JVM (Java) | `./gradlew checkstyleMain` or `./mvnw checkstyle:check` |
| JVM (Kotlin) | `./gradlew ktlintCheck` or `./gradlew detekt` |
| Python | `ruff check .` |

### 4. Test Suite

| Ecosystem | Command |
|-----------|---------|
| TypeScript/JavaScript | `npm test -- --coverage` |
| JVM (Gradle) | `./gradlew test jacocoTestReport` |
| JVM (Maven) | `./mvnw test jacoco:report` |
| Python | `pytest --cov=src -v` |

Report: Total tests, Passed, Failed, Coverage %

### 5. Debug Statement Audit

| Ecosystem | Search Pattern |
|-----------|---------------|
| TypeScript/JavaScript | `console.log` in `*.ts`, `*.tsx`, `*.js`, `*.jsx` |
| JVM (Java/Kotlin) | `System.out.println`, `e.printStackTrace()` in `*.java`, `*.kt` |
| Python | `print(`, `breakpoint()`, `pdb.set_trace()` in `*.py` |

### 6. Git Status
- Show uncommitted changes
- Show files modified since last commit

## Output

Produce a concise verification report:

```
VERIFICATION: [PASS/FAIL]

Ecosystem: [TypeScript/JVM/Python]
Build:     [OK/FAIL]
Types:     [OK/X errors]
Lint:      [OK/X issues]
Tests:     [X/Y passed, Z% coverage]
Secrets:   [OK/X found]
Debug:     [OK/X statements found]

Ready for PR: [YES/NO]
```

If any critical issues, list them with fix suggestions.

## Remediation Suggestions

When issues are found, include actionable next steps:

| Issue | Suggested Action |
|-------|-----------------|
| Build FAIL | "Run `/build-fix` to resolve build errors" |
| Types FAIL | "Run `/build-fix` to resolve type errors" |
| Tests FAIL | "Run `/tdd` to fix failing tests" |
| Coverage LOW | "Run `/test-coverage` to fill coverage gaps" |
| Debug FOUND | "Remove debug statements before committing" |
| Security FOUND | "Run `/code-review` for detailed security analysis" |

## Arguments

$ARGUMENTS can be:
- `quick` - Only build + types
- `full` - All checks (default)
- `pre-commit` - Checks relevant for commits
- `pre-pr` - Full checks plus security scan
