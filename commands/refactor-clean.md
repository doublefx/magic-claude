---
description: Safely remove dead code with test verification before deletion
---

# Refactor Clean

Polyglot dead code cleanup -- detects the project ecosystem and dispatches to the right refactor specialist agent.

## Step 1: Detect Ecosystem

Check for project markers to determine the ecosystem:

**TypeScript/JavaScript** (any of):
- `tsconfig.json`, `package.json`, `next.config.*`
- Lock files: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`

**JVM (Java/Kotlin/Groovy)** (any of):
- `pom.xml`, `build.gradle`, `build.gradle.kts`, `settings.gradle`, `settings.gradle.kts`
- Wrappers: `mvnw`, `gradlew`

**Python** (any of):
- `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements.txt`
- Lock files: `uv.lock`, `poetry.lock`, `Pipfile.lock`

If multiple ecosystems detected, ask which one to clean.

## Step 2: Dispatch to Specialist Agent

| Ecosystem | Agent | Analysis Tools |
|-----------|-------|----------------|
| TypeScript/JavaScript | **ts-refactor-cleaner** | knip, depcheck, ts-prune |
| JVM (Java/Kotlin/Groovy) | **jvm-refactor-cleaner** | jdeps, mvn dependency:analyze, SpotBugs |
| Python | **python-refactor-cleaner** | vulture, ruff F401/F841, autoflake |

## Step 3: Analysis & Cleanup Workflow

The specialist agent follows this workflow:

1. **Run dead code analysis tools** (ecosystem-specific)

2. **Categorize findings by risk:**
   - SAFE: Unused imports, private methods, local variables
   - CAUTION: Public APIs, exported functions, Spring beans
   - DANGER: Config files, entry points, reflection targets

3. **Propose safe deletions only**

4. **Before each deletion:**
   - Run full test suite
   - Verify tests pass
   - Apply change
   - Re-run tests
   - Rollback if tests fail

5. **Show summary of cleaned items**

Never delete code without running tests first!
