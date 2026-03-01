---
description: Sync documentation from source-of-truth to docs/ directory
---

# Update Documentation

Sync documentation from source-of-truth.

## Step 1: Detect Ecosystem

Check for ecosystem markers and read the appropriate config files:

| Ecosystem | Source-of-Truth Files |
|-----------|----------------------|
| TypeScript/JavaScript | `package.json` (scripts), `.env.example` (env vars) |
| JVM (Gradle) | `build.gradle.kts` / `build.gradle` (tasks, dependencies), `.env.example` |
| JVM (Maven) | `pom.xml` (profiles, plugins, dependencies), `.env.example` |
| Python | `pyproject.toml` (scripts, dependencies), `.env.example` |

## Step 2: Extract Information

### TypeScript/JavaScript
1. Read `package.json` scripts section
   - Generate scripts reference table
   - Include descriptions from comments

### JVM (Gradle)
1. Read `build.gradle.kts` or `build.gradle`
   - Extract task definitions and descriptions
   - List dependencies and their purposes
   - Document custom Gradle tasks

### JVM (Maven)
1. Read `pom.xml`
   - Extract profiles and their purposes
   - List plugins and lifecycle bindings
   - Document dependency management

### Python
1. Read `pyproject.toml`
   - Extract `[project.scripts]` entry points
   - List dependencies and dev dependencies
   - Document tool configurations (ruff, pyright, pytest)

## Step 3: Read Environment Configuration

2. Read `.env.example` (all ecosystems)
   - Extract all environment variables
   - Document purpose and format

## Step 4: Generate Documentation

3. Generate `docs/CONTRIB.md` with:
   - Development workflow
   - Available scripts/tasks/commands
   - Environment setup
   - Testing procedures

4. Generate `docs/RUNBOOK.md` with:
   - Deployment procedures
   - Monitoring and alerts
   - Common issues and fixes
   - Rollback procedures

5. Identify obsolete documentation:
   - Find docs not modified in 90+ days
   - List for manual review

6. Show diff summary

Single source of truth: ecosystem config files and `.env.example`
