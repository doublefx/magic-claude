---
description: Invoke automatically after git pull, merge, rebase, or branch switch to analyze external changes and report their impact. Produces an actionable change impact report with severity classification.
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob, Bash(git *)
---

# Git Sync - Analyze Changes and Report Impact

## Current Git State

Recent commits:
!`git log --oneline -10`

Sync reminder log:
!`cat .git/serena-sync-reminder.log 2>/dev/null || echo "No sync log found"`

## Workflow

### Step 1: Check for Pending Syncs

**Read sync reminder log** (if it exists):
```bash
cat .git/serena-sync-reminder.log 2>/dev/null
```

**Parse entries** to understand what happened:
```
2026-01-29 10:30:00 UTC - pull origin main
2026-01-29 11:15:00 UTC - merge feature/auth
```

### Step 2: Analyze Git Changes

**Get changed files since last known state**:
```bash
git diff --name-only HEAD@{1}..HEAD
```

Or for broader analysis:
```bash
git log --since="1 day ago" --name-only --pretty=format:
```

**Categorize changes**:
- Added files
- Modified files
- Deleted files
- Renamed files

### Step 3: Assess Impact by Area

**Map changes to codebase areas**:

| Changed Path | Impact Area |
|--------------|-------------|
| `src/api/*` | Backend API contracts, endpoints |
| `src/auth/*` | Authentication, authorization flows |
| `src/components/*` | Frontend UI, component interfaces |
| `tests/*` | Test patterns, coverage |
| `config/*` | Configuration, environment |
| `docs/*` | Documentation accuracy |
| `*.sql`, `migrations/*` | Database schema, queries |
| `package.json`, lock files | Dependencies |

**For each affected area, check**:
- Function signatures changed?
- Files moved/renamed?
- Logic significantly altered?
- New patterns introduced?
- Breaking API changes?

### Step 4: Classify Change Severity

| Change Type | Severity | Action Needed |
|-------------|----------|---------------|
| Minor refactor (same behavior) | Low | No action |
| API signature changes | Medium | Review dependent code |
| Major restructure | High | Re-explore affected modules |
| File/module deleted | High | Check for broken references |
| New dependency added | Medium | Understand its purpose |
| Schema migration | High | Verify data model understanding |

### Step 5: Clear Sync Log

After processing:
```bash
echo "# Synced $(date -u '+%Y-%m-%d %H:%M:%S UTC')" > .git/serena-sync-reminder.log
```

### Step 6: Produce Change Impact Report

Output a structured report:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Git Sync - Change Impact Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Changes Analyzed:
- Files changed: N
- Added: N
- Modified: N
- Deleted: N

Impact by Area:
- [area]: [severity] - [brief description of what changed]
  Example: Backend API: HIGH - Authentication endpoint signatures changed
  Example: Tests: LOW - New test helpers added, no existing tests modified

Action Items:
- [HIGH] Re-explore src/auth/ - major refactor of session management
- [MEDIUM] Review API contracts - new endpoints added
- [LOW] No action needed for test utility additions

Recommendations:
- Re-read [specific files] before making changes in [area]
- [specific breaking change] may affect [dependent code]

Next sync reminder: After next pull/merge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Automatic Sync Detection

Git hooks (installed via `/serena-setup` or manually from `templates/serena/git-hooks/`) write to `.git/serena-sync-reminder.log` after pull, merge, rebase, or branch switch operations. This skill reads that log to understand what changed.
