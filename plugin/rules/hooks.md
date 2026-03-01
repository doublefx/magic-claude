# Hooks System

## Hook Types

- **UserPromptSubmit**: Before prompt processing (context injection)
- **PermissionRequest**: Auto-approve safe commands
- **PreToolUse**: Before tool execution (validation, parameter modification)
- **PostToolUse**: After tool execution (auto-format, checks)
- **PreCompact**: Before context compaction (save state)
- **SessionStart**: On new session (load context, detect environment)
- **SessionEnd**: On session end (persist state, extract patterns)
- **Stop**: After each response (final verification)
- **Notification**: Desktop notifications when Claude needs input

## Task Management

Use TaskCreate/TaskUpdate/TaskList/TaskGet tools to:
- Track progress on multi-step tasks
- Verify understanding of instructions
- Enable real-time steering
- Show granular implementation steps
- Manage dependencies between tasks

Task list reveals:
- Out of order steps
- Missing items
- Extra unnecessary items
- Wrong granularity
- Misinterpreted requirements

## Auto-Accept Permissions

Use with caution:
- Enable for trusted, well-defined plans
- Disable for exploratory work
- Never use dangerously-skip-permissions flag
- Configure `allowedTools` in `~/.claude.json` instead
