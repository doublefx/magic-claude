# Migration Guide: v2.x → v3.0.0

**Serena-First Architecture Release**

## Overview

Version 3.0.0 simplifies configuration by making **Serena the single source of truth**. JSON config files are removed in favor of Serena memories.

**Breaking Change**: If you relied on `.claude/everything-claude-code.*.json` files, those are no longer read or created.

## What Changed

### Removed: JSON Config Files

The following files are **no longer used**:

| File | v2.x Purpose | v3.0 Replacement |
|------|--------------|------------------|
| `.claude/everything-claude-code.package-manager.json` | Package manager preference | `CLAUDE_PACKAGE_MANAGER` env var or `package.json` `packageManager` field |
| `.claude/everything-claude-code.project-type.json` | Cached project types | On-demand detection (fast) |
| `.claude/everything-claude-code.ecosystems.json` | Detected ecosystems | On-demand detection or Serena `project_config_context` memory |
| `.claude/everything-claude-code.setup-status.json` | Setup completion tracking | `.serena/project.yml` existence |

### Setup Completion Detection

**v2.x**: Checked `.claude/everything-claude-code.setup-status.json`

**v3.0**: Checks `.serena/project.yml` existence

### Package Manager Detection Priority

**v2.x (6 tiers)**:
1. Environment variable
2. Project config JSON
3. package.json field
4. Lock file
5. Global config JSON
6. Fallback

**v3.0 (4 tiers)**:
1. `CLAUDE_PACKAGE_MANAGER` environment variable
2. `package.json` `packageManager` field
3. Lock file detection
4. First available (priority: pnpm, bun, yarn, npm)

## Migration Steps

### If Using Serena (Recommended)

1. Run `/serena-setup` to create `project_config_context` memory
2. Delete old JSON config files:
   ```bash
   rm -f .claude/everything-claude-code.*.json
   ```
3. Setup status now determined by `.serena/project.yml` existence

### If NOT Using Serena

1. Set package manager preference via:
   - `CLAUDE_PACKAGE_MANAGER` environment variable, OR
   - `packageManager` field in `package.json`

2. Delete old JSON config files (no longer read):
   ```bash
   rm -f .claude/everything-claude-code.*.json
   ```

3. Project detection runs on-demand (no caching needed)

## Why This Change?

1. **Single Source of Truth**: Serena memories replace scattered JSON files
2. **Simpler Architecture**: Fewer files to manage
3. **Better Session Continuity**: Serena persists across sessions
4. **Reduced Complexity**: No cache invalidation logic needed

## Backward Compatibility

- **Package manager detection** still works (environment, package.json, lock files)
- **Project type detection** still works (on-demand)
- **Workspace detection** unchanged
- **All commands** work as before

The only breaking change is that `.claude/everything-claude-code.*.json` files are ignored.

## Troubleshooting

### "Wrong package manager detected"

Set explicitly via:
```bash
export CLAUDE_PACKAGE_MANAGER=pnpm
```

Or in `package.json`:
```json
{
  "packageManager": "pnpm@8.6.0"
}
```

### "Setup not detected as complete"

Ensure `.serena/project.yml` exists. Run:
```bash
/serena-setup
```

### "Want to keep using JSON config files"

This is no longer supported in v3.0. Use:
- Environment variables for package manager
- `package.json` for package manager field
- Serena memories for project configuration
