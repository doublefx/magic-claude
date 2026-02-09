---
name: verification-loop
description: Comprehensive verification system for Claude Code sessions. Use after completing features, before creating PRs, or after refactoring to ensure build, types, lint, tests, and security checks all pass.
allowed-tools: Read, Grep, Glob, Bash(npm run *), Bash(npx *), Bash(node tests/*), Bash(pnpm run *), Bash(yarn run *), Bash(./gradlew *), Bash(./mvnw *), Bash(pytest *), Bash(python -m *), Bash(pyright *), Bash(ruff *)
---

# Verification Loop Skill

A comprehensive verification system for Claude Code sessions across all ecosystems.

## When to Use

Invoke this skill:
- After completing a feature or significant code change
- Before creating a PR
- When you want to ensure quality gates pass
- After refactoring

## Step 1: Detect Ecosystem

Check for ecosystem markers:
- `package.json` / `tsconfig.json` → TypeScript/JavaScript
- `pom.xml` / `build.gradle` / `build.gradle.kts` → JVM
- `pyproject.toml` / `setup.py` / `requirements.txt` → Python

## Verification Phases

### Phase 1: Build Verification

| Ecosystem | Command |
|-----------|---------|
| TypeScript/JavaScript | `npm run build 2>&1 \| tail -20` or `pnpm build 2>&1 \| tail -20` |
| JVM (Gradle) | `./gradlew build -x test 2>&1 \| tail -20` |
| JVM (Maven) | `./mvnw compile 2>&1 \| tail -20` |
| Python | `python -m py_compile <files> 2>&1 \| tail -20` |

If build fails, STOP and fix before continuing.

### Phase 2: Type Check

| Ecosystem | Command |
|-----------|---------|
| TypeScript | `npx tsc --noEmit 2>&1 \| head -30` |
| Python | `pyright . 2>&1 \| head -30` or `mypy . 2>&1 \| head -30` |
| JVM | (Handled by compiler in Phase 1) |

Report all type errors. Fix critical ones before continuing.

### Phase 3: Lint Check

| Ecosystem | Command |
|-----------|---------|
| TypeScript/JavaScript | `npm run lint 2>&1 \| head -30` |
| JVM (Gradle) | `./gradlew ktlintCheck 2>&1 \| head -30` or `./gradlew checkstyleMain 2>&1 \| head -30` |
| JVM (Maven) | `./mvnw checkstyle:check 2>&1 \| head -30` |
| Python | `ruff check . 2>&1 \| head -30` |

### Phase 4: Test Suite

| Ecosystem | Command |
|-----------|---------|
| TypeScript/JavaScript | `npm run test -- --coverage 2>&1 \| tail -50` |
| JVM (Gradle) | `./gradlew test jacocoTestReport 2>&1 \| tail -50` |
| JVM (Maven) | `./mvnw test jacoco:report 2>&1 \| tail -50` |
| Python | `pytest --cov=src -v 2>&1 \| tail -50` |

Report:
- Total tests: X
- Passed: X
- Failed: X
- Coverage: X% (target: 80% minimum)

### Phase 5: Security Scan

#### Secret Detection (All Ecosystems)
```bash
grep -rn "sk-" --include="*.ts" --include="*.js" --include="*.py" --include="*.java" --include="*.kt" . 2>/dev/null | head -10
grep -rn "api_key" --include="*.ts" --include="*.js" --include="*.py" --include="*.java" --include="*.kt" . 2>/dev/null | head -10
```

#### Debug Statement Detection

| Ecosystem | Search Pattern |
|-----------|---------------|
| TypeScript/JavaScript | `console.log` in `src/` `*.ts`, `*.tsx` |
| JVM (Java/Kotlin) | `System.out.println`, `e.printStackTrace()` in `src/` `*.java`, `*.kt` |
| Python | `print(`, `breakpoint()` in `src/` `*.py` |

### Phase 6: Diff Review
```bash
# Show what changed
git diff --stat
git diff HEAD~1 --name-only
```

Review each changed file for:
- Unintended changes
- Missing error handling
- Potential edge cases

## Output Format

After running all phases, produce a verification report:

```
VERIFICATION REPORT
==================

Ecosystem: [TypeScript/JVM/Python]
Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errors)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (X issues)
Debug:     [PASS/FAIL] (X statements)
Diff:      [X files changed]

Overall:   [READY/NOT READY] for PR

Issues to Fix:
1. ...
2. ...
```

## Continuous Mode

For long sessions, run verification every 15 minutes or after major changes:

```markdown
Set a mental checkpoint:
- After completing each function
- After finishing a component
- Before moving to next task

Run: /verify
```

## Integration with Hooks

This skill complements PostToolUse hooks but provides deeper verification.
Hooks catch issues immediately; this skill provides comprehensive review.
