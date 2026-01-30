---
description: Synchronize Serena memories with external git changes. Processes sync reminder logs, identifies affected memories, and updates them with new code state.
context: fork
---

# /git-sync - Synchronize Memories with Git Changes

## When to Use

- After pulling/merging external changes
- After rebasing
- After branch switching
- When sync reminder log has entries
- Periodically during long sessions

## Workflow

### Step 1: Check for Pending Syncs

**Read sync reminder log**:
```bash
cat .git/serena-sync-reminder.log
```

**Parse entries**:
```
2026-01-29 10:30:00 UTC - pull origin main
2026-01-29 11:15:00 UTC - merge feature/auth
```

### Step 2: Analyze Git Changes

**Get changed files since last sync**:
```bash
git diff --name-only HEAD@{1}..HEAD
```

Or if tracking last sync date:
```bash
git log --since="${LAST_SYNC_DATE}" --name-only --pretty=format:
```

**Categorize changes**:
- Added files
- Modified files
- Deleted files
- Renamed files

### Step 3: Identify Affected Memories

**Map changes to memories**:

| Changed Path | Likely Affected Memories |
|--------------|-------------------------|
| `src/api/*` | `backend_api_*` |
| `src/auth/*` | `auth_*`, `security_*` |
| `src/components/*` | `frontend_*`, `ui_*` |
| `tests/*` | `testing_*` |
| `config/*` | `*_configuration` |
| `docs/*` | `*_guide`, `*_overview` |

**Read current memories**:
```
Use Serena MCP: list_memories()
```

**Check "Watched Paths" in memory metadata** (if present):
```markdown
**Watched Paths**: src/api/**, src/services/auth/**
```

### Step 4: Review and Update Memories

For each affected memory:

**1. Read current memory content**:
```
Use Serena MCP: read_memory("memory_name")
```

**2. Check if changes invalidate content**:
- Function signatures changed?
- Files moved/renamed?
- Logic significantly altered?
- New patterns introduced?

**3. Update confidence if needed**:

| Change Type | Confidence Impact |
|-------------|-------------------|
| Minor refactor | Keep current |
| API changes | Drop to Medium |
| Major restructure | Drop to Low/Needs Review |
| File deleted | Mark as Deprecated |

**4. Update memory content**:
```
Use Serena MCP: edit_memory("name", "old_text", "new_text")
```

Update:
- `Last Updated` date
- `Confidence` level
- `Last Code Sync` timestamp
- Outdated code references

### Step 5: Handle Deprecated Content

**If referenced files deleted**:
```markdown
**Status**: Deprecated
**Superseded By**: [new_memory_name if applicable]
**Deprecation Reason**: Referenced files removed in commit abc123
```

**If content significantly outdated**:
- Mark as `Needs Review`
- Add note about what changed
- Consider rewriting with `/after-exploring`

### Step 6: Clear Sync Log

After processing:
```bash
> .git/serena-sync-reminder.log
```

Or truncate to keep history:
```bash
echo "# Synced $(date -u '+%Y-%m-%d %H:%M:%S UTC')" > .git/serena-sync-reminder.log
```

### Step 7: Report Sync Results

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Git Sync Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Changes Analyzed:
- Files changed: 12
- Added: 3
- Modified: 8
- Deleted: 1

Memories Affected:
- Updated: 4
  - backend_api_authentication_workflow (confidence → Medium)
  - auth_session_management_specifics (content updated)
  - testing_integration_guide (added new test patterns)
  - database_schema_overview (referenced file moved)

- Deprecated: 1
  - legacy_auth_flow_workflow (files removed)

- Unchanged: 10

Recommendations:
- Review backend_api_authentication_workflow (Medium confidence)
- Consider rewriting database_schema_overview (/after-exploring)

Next sync reminder: After next pull/merge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Automatic Sync Detection

Git hooks installed by `/serena-setup` trigger reminders:

```bash
# In .git/hooks/post-merge
#!/bin/bash
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') - $GIT_REFLOG_ACTION" >> .git/serena-sync-reminder.log
echo "[Serena] External changes detected. Run /git-sync to update memories."
```

## Best Practices

1. **Sync after every pull** - keeps memories current
2. **Don't ignore warnings** - stale memories cause confusion
3. **Update confidence honestly** - Low confidence is better than wrong High
4. **Deprecate don't delete** - keep history for reference
5. **Re-explore if major changes** - use `/before-exploring` → `/after-exploring`
