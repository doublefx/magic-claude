---
description: Incrementally fix build, type check, and lint errors per ecosystem
---

# Build and Fix

Polyglot build error resolution — detects the project ecosystem and dispatches to the right specialist agent.

## Step 1: Detect Ecosystem

Check for project markers to determine the ecosystem:

**TypeScript/JavaScript** (any of):
- `tsconfig.json`, `package.json`, `next.config.*`, `vite.config.*`
- Lock files: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`

**JVM (Java/Kotlin/Groovy)** (any of):
- `pom.xml`, `build.gradle`, `build.gradle.kts`, `settings.gradle`, `settings.gradle.kts`
- Wrappers: `mvnw`, `gradlew`

**Python** (any of):
- `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements.txt`
- Lock files: `uv.lock`, `poetry.lock`, `Pipfile.lock`

If multiple ecosystems detected, ask which one to fix.

## Step 2: Dispatch to Specialist Agent

| Ecosystem | Agent | Build Command |
|-----------|-------|---------------|
| TypeScript/JavaScript | **magic-claude:ts-build-resolver** | `npx tsc --noEmit` or `npm run build` |
| JVM (Maven) | **magic-claude:jvm-build-resolver** | `./mvnw clean install` |
| JVM (Gradle) | **magic-claude:jvm-build-resolver** | `./gradlew build` |
| Python | **magic-claude:python-build-resolver** | `pyright` or `ruff check .` or `pytest --collect-only` |

## Step 3: Incremental Fix Loop

The specialist agent follows this loop:

1. Run the appropriate build/check command
2. Parse error output — group by file, sort by severity
3. For each error:
   - Show error context (5 lines before/after)
   - Explain the issue
   - Propose minimal fix
   - Apply fix
   - Re-run build/check
   - Verify error resolved
4. Stop if:
   - Fix introduces new errors
   - Same error persists after 3 attempts
   - User requests pause
5. Show summary:
   - Errors fixed
   - Errors remaining
   - New errors introduced

Fix one error at a time for safety!
