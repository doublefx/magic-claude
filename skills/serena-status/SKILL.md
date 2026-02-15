---
description: Display Serena configuration diagnostics. Shows installation status, project activation, memory count, git hooks status, and JetBrains availability.
context: fork
---

# /serena-status - Configuration Diagnostics

## When to Activate

- Troubleshooting Serena issues
- Verifying setup completion
- Checking memory health
- Before major exploration sessions

## Workflow

### Step 1: Check Installation

**Read from environment**:
- `SERENA_INSTALLED` - Plugin installed?
- `SERENA_PROJECT_ACTIVATED` - Project activated?
- `SERENA_PROJECT_PATH` - Cached project path
- `SERENA_JETBRAINS_AVAILABLE` - JetBrains connected?

### Step 2: Verify Project Activation

```
Use Serena MCP: get_current_config()
```

Check if current directory matches activated project.

### Step 3: Count Memories

```
Use Serena MCP: list_memories()
```

Categorize by:
- Topic area (backend, frontend, auth, etc.)
- Type suffix (architecture, workflow, guide, etc.)

### Step 4: Check Git Hooks

**Verify hooks exist in `.git/hooks/`**:
- `post-merge`
- `post-rebase`
- `post-checkout`
- `post-rewrite`

**Check sync reminder log**:
```bash
cat .git/serena-sync-reminder.log
```

### Step 5: Check CLAUDE.md

- Does CLAUDE.md exist?
- Does it reference Serena workflow?
- Is it minimal (references memories) or verbose (contains knowledge)?

### Step 6: Display Status Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Serena Status Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Installation
  Plugin: ✅ Installed
  Version: [if available]

## Project
  Name: ${PROJECT_NAME}
  Path: ${PROJECT_PATH}
  Activated: ✅ Yes / ❌ No
  Onboarded: ✅ Yes / ❌ No

## Languages
  Detected: typescript, python
  Backend: ${JetBrains/LSP}

## Memory Stats
  Total: ${COUNT} memories
  By Topic:
    - backend: 5
    - frontend: 3
    - auth: 2
    - testing: 4

  Health:
    - High confidence: 8
    - Medium confidence: 4
    - Low/Needs Review: 2

## Git Hooks
  Installed: 4/4
    - post-merge: ✅
    - post-rebase: ✅
    - post-checkout: ✅
    - post-rewrite: ✅

  Pending Syncs: ${COUNT}
  Last Sync: ${DATE}

## CLAUDE.md
  Exists: ✅ Yes
  Serena-aware: ✅ Yes / ❌ No
  Type: Minimal (references memories)

## Recommendations
  ${Any issues or suggestions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Status Indicators

| Symbol | Meaning |
|--------|---------|
| ✅ | Good, no action needed |
| ⚠️ | Warning, may need attention |
| ❌ | Error, action required |
| 📌 | Information |

## Common Issues & Fixes

**Project not activated**:
```
Run: /serena-setup
Or: Use activate_project("project_name") directly
```

**Git hooks missing**:
```
Run: /serena-setup (will offer to install)
```

**Pending syncs**:
```
The git-sync agent will run automatically to analyze impact
```

**JetBrains not available**:
```
1. Open project in JetBrains IDE
2. Install Serena JetBrains plugin
3. Restart Serena MCP server
```
