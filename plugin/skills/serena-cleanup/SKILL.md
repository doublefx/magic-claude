---
description: Use when removing Serena MCP from a project or cleaning up after Serena uninstall.
context: fork
---

# /serena-cleanup - Safe Cleanup & Removal

## When to Activate

- Removing Serena integration from a project
- Cleaning up test/debug artifacts
- Resetting to fresh state
- Preparing for migration

## Safety First

**This skill prioritizes safety**:
- Always backs up before deleting
- Confirms destructive actions
- Can restore if needed

## Workflow

### Step 1: Show Current State

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Serena Cleanup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current state:
- Memories: ${COUNT} (${SIZE} total)
- Git hooks: 4 installed
- Sync logs: ${LINES} entries
- CLAUDE.md: Serena-aware

What would you like to clean up?
```

### Step 2: Offer Cleanup Options

**Option A: Remove Git Hooks Only**
- Deletes Serena-specific git hooks
- Keeps memories intact
- Safe, non-destructive

**Option B: Clean Sync Logs**
- Removes `.git/serena-sync-reminder.log`
- Keeps everything else
- Very safe

**Option C: Backup & Remove Memories**
- Creates backup in `.serena-backup-YYYY-MM-DD/`
- Removes all memories
- DESTRUCTIVE - requires confirmation

**Option D: Restore Original CLAUDE.md**
- If backup exists: restore from `.claude.md.backup`
- If no backup: warn and skip

**Option E: Full Cleanup**
- All of the above
- Complete removal
- DESTRUCTIVE - requires strong confirmation

### Step 3: Execute Selected Cleanup

#### Remove Git Hooks

```bash
rm .git/hooks/post-merge
rm .git/hooks/post-rebase
rm .git/hooks/post-checkout
rm .git/hooks/post-rewrite
```

#### Clean Sync Logs

```bash
rm .git/serena-sync-reminder.log
```

#### Backup Memories

```bash
# Create timestamped backup
mkdir -p .serena-backup-$(date +%Y-%m-%d)
cp -r .serena/memories/* .serena-backup-$(date +%Y-%m-%d)/
```

#### Remove Memories

```
Use Serena MCP: delete_memory("name") for each memory
```

Or remove `.serena/memories/` directory entirely.

#### Restore CLAUDE.md

```bash
if [ -f .claude.md.backup ]; then
  cp .claude.md.backup CLAUDE.md
fi
```

### Step 4: Clean Environment Cache

**Remove from CLAUDE_ENV_FILE** (if possible):
```
SERENA_PROJECT_ACTIVATED
SERENA_PROJECT_PATH
SERENA_PROJECT_NAME
SERENA_EXPLORATION_ACTIVE
```

### Step 5: Confirm Cleanup

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Cleanup Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Removed:
- [x] Git hooks (4)
- [x] Sync logs
- [x] Memories (backed up to .serena-backup-2026-01-29/)

Preserved:
- [ ] CLAUDE.md (no backup found)
- [x] .serena/project.yml (configuration)

To restore memories:
  cp -r .serena-backup-2026-01-29/* .serena/memories/

To re-setup Serena:
  magic-claude:serena-setup
```

## Rollback

**If cleanup was a mistake**:

```bash
# Restore memories from backup
cp -r .serena-backup-YYYY-MM-DD/* .serena/memories/

# Re-run setup
magic-claude:serena-setup
```

## Partial Cleanup Options

### Keep Memories, Remove Integration

1. Remove git hooks only
2. Update CLAUDE.md to not reference Serena
3. Memories remain accessible manually

### Archive and Start Fresh

1. Backup all memories
2. Remove memories
3. Re-run `magic-claude:serena-setup` for fresh start

## Confirmation Messages

**For destructive operations**:

```
⚠️  WARNING: This will delete ${COUNT} memories.

Type 'DELETE' to confirm, or 'cancel' to abort:
```

**For full cleanup**:

```
⚠️  FULL CLEANUP will:
- Remove all memories (${COUNT})
- Remove git hooks
- Clear sync logs
- Update CLAUDE.md

This cannot be undone without backup.

Type 'FULL CLEANUP' to confirm, or 'cancel' to abort:
```
