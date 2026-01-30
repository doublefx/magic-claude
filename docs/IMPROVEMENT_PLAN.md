# Plugin Improvement Plan

**Based on:** Comprehensive inventory + Updated official documentation (v2.1.0 agents, v3.0.0 hooks)
**Generated:** 2026-01-28
**Last Updated:** 2026-01-28

---

## Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Critical Fixes (matcher syntax, inline scripts) | COMPLETE |
| Phase 2 | High Value Additions (UserPromptSubmit, PermissionRequest, Notification) | COMPLETE |
| Phase 3 | Agent Improvements (permissionMode) | COMPLETE |
| Phase 4 | Advanced Features (prompt-based hooks, SubagentStop) | PENDING |

---

## Completed Changes

### Phase 1: Critical Fixes

#### 1.1 Hook Matcher Syntax (FIXED)

All matchers in `hooks/hooks.json` have been converted from CEL expressions to regex patterns:

| Old CEL Matcher | New Regex Matcher |
|-----------------|-------------------|
| `tool == "Bash" && tool_input.command matches "^git\\s+commit\\b"` | `Bash` |
| `tool == "Edit" \|\| tool == "Write"` | `Edit\|Write` |
| `tool == "TaskUpdate"` | `TaskUpdate` |
| `(tool == "Edit" \|\| tool == "Write") && tool_input.file_path matches "\\.java$"` | `Edit\|Write` |
| `tool == "Edit" && tool_input.file_path matches "\\.(ts\|tsx)$"` | `Edit` |

#### 1.2 Inline Scripts Extracted (FIXED)

All inline Node.js scripts have been extracted to separate files:

| Inline Script | New File |
|---------------|----------|
| PR URL logging | `scripts/hooks/pr-url-logger.cjs` |
| TypeScript checker | `scripts/hooks/typescript-checker.cjs` |
| Console.log detector | `scripts/hooks/console-log-detector.cjs` |
| Stop validation | `scripts/hooks/stop-validation.cjs` |

### Phase 2: High Value Additions

#### 2.1 UserPromptSubmit Hook (ADDED)

New hook injects dynamic context at prompt time:
- Current time
- Git branch and uncommitted changes
- Package manager detected
- Pending task count

**File:** `scripts/hooks/inject-prompt-context.cjs`

#### 2.2 PermissionRequest Hook (ADDED)

New hook auto-approves safe bash commands:
- Testing: npm/yarn/pnpm test, pytest, go test, cargo test
- Linting: prettier, eslint, ruff check
- Building: npm run build, tsc, mvn compile
- Git read operations: status, log, diff, branch
- Version checks: node -v, npm -v, etc.

**File:** `scripts/hooks/permission-filter.cjs`

#### 2.3 Notification Hook (ADDED)

Cross-platform desktop notification when Claude needs input:
- **Linux:** notify-send (libnotify) with zenity fallback
- **macOS:** osascript (AppleScript)
- **Windows:** PowerShell toast notifications with balloon tip fallback

**File:** `scripts/hooks/notify.cjs`

#### 2.4 CLAUDE_ENV_FILE Integration (ADDED)

SessionStart hook now persists environment via CLAUDE_ENV_FILE:
- `DETECTED_PKG_MANAGER` - detected package manager
- `PKG_MANAGER_SOURCE` - how it was detected
- `DETECTED_ECOSYSTEM` - nodejs/python/jvm/rust
- `IS_WORKSPACE` - whether in monorepo

**File:** `scripts/hooks/session-start.cjs` (updated)

### Phase 3: Agent Improvements

#### 3.1 permissionMode Added

| Agent | permissionMode | Reason |
|-------|----------------|--------|
| `architect` | `plan` | Read-only design work |
| `planner` | `plan` | Read-only planning |
| `refactor-cleaner` | `acceptEdits` | Cleanup tasks |
| `doc-updater` | `acceptEdits` | Documentation updates |
| `build-error-resolver` | `acceptEdits` | Quick fixes |

---

## Remaining Work (Phase 4)

### 4.1 Prompt-Based Hooks

Convert complex validation to LLM-powered decisions:

```json
{
  "matcher": "*",
  "hooks": [{
    "type": "prompt",
    "prompt": "Review the work completion status: $ARGUMENTS\n\nCheck:\n1. Are there console.log statements in modified files?\n2. Were all requested changes implemented?\n3. Are tests passing?\n\nReturn {\"ok\": true} if complete, or {\"ok\": false, \"reason\": \"...\"} with specific issues.",
    "timeout": 30
  }],
  "description": "LLM-powered completion validation"
}
```

### 4.2 SubagentStop Hook

Validate agent completion, force continuation if needed:

```json
{
  "hooks": {
    "SubagentStop": [
      {
        "hooks": [{
          "type": "prompt",
          "prompt": "Review subagent completion: $ARGUMENTS\n\nDid the agent fully complete its task? Check for:\n1. Incomplete work\n2. Unresolved errors\n3. Missing tests\n\nReturn {\"ok\": true} if complete, {\"ok\": false, \"reason\": \"...\"} to continue.",
          "timeout": 30
        }],
        "description": "Validate subagent completed task fully"
      }
    ]
  }
}
```

### 4.3 Setup Hook

One-time initialization with `--init` flag:

```json
{
  "hooks": {
    "Setup": [
      {
        "matcher": "init",
        "hooks": [{
          "type": "command",
          "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/setup-init.cjs\""
        }],
        "description": "Run one-time setup: check dependencies, configure tools"
      }
    ]
  }
}
```

### 4.4 PostToolUseFailure Hook

Handle tool failures gracefully:

```json
{
  "hooks": {
    "PostToolUseFailure": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/handle-bash-failure.cjs\""
        }],
        "description": "Provide helpful context when bash commands fail"
      }
    ]
  }
}
```

---

## Files Created/Modified

### New Files Created

| File | Purpose |
|------|---------|
| `scripts/hooks/pr-url-logger.cjs` | Extract PR URLs from gh pr create output |
| `scripts/hooks/typescript-checker.cjs` | Run tsc on TypeScript files |
| `scripts/hooks/console-log-detector.cjs` | Warn about console.log in JS/TS |
| `scripts/hooks/stop-validation.cjs` | Check modified files for console.log |
| `scripts/hooks/notify.cjs` | Cross-platform desktop notifications |
| `scripts/hooks/inject-prompt-context.cjs` | Inject context into user prompts |
| `scripts/hooks/permission-filter.cjs` | Auto-approve safe bash commands |

### Files Modified

| File | Changes |
|------|---------|
| `hooks/hooks.json` | Fixed all matchers, added UserPromptSubmit, PermissionRequest, Notification hooks |
| `scripts/hooks/session-start.cjs` | Added CLAUDE_ENV_FILE integration |
| `agents/architect.md` | Added permissionMode: plan |
| `agents/planner.md` | Added permissionMode: plan |
| `agents/refactor-cleaner.md` | Added permissionMode: acceptEdits |
| `agents/doc-updater.md` | Added permissionMode: acceptEdits |
| `agents/build-error-resolver.md` | Added permissionMode: acceptEdits |

---

## Current Plugin Capabilities

### Hook Types Used (10/12)

| Hook Type | Status | Purpose |
|-----------|--------|---------|
| SessionStart | Active | Load context, detect environment |
| UserPromptSubmit | NEW | Inject dynamic context |
| PreToolUse | Active | Pre-commit review, compaction suggestions |
| PermissionRequest | NEW | Auto-approve safe operations |
| PostToolUse | Active | Formatting, security checks, logging |
| Stop | Active | Console.log validation |
| PreCompact | Active | Save state before compaction |
| SessionEnd | Active | Persist state, evaluate patterns |
| Notification | NEW | Desktop alerts |
| SubagentStop | Planned | Agent completion validation |
| Setup | Planned | One-time initialization |
| PostToolUseFailure | Planned | Error handling |

### Agent Frontmatter Fields Used (6/7)

| Field | Status | Usage |
|-------|--------|-------|
| name | Active | All agents |
| description | Active | All agents |
| tools | Active | All agents |
| model | Active | All agents |
| skills | Partial | Some agents |
| permissionMode | NEW | 5 agents |
| disallowedTools | Planned | Security agents |

---

## Testing Checklist

- [x] Hooks fire at correct times
- [x] Matchers match expected tools (regex patterns)
- [x] Scripts handle filtering internally
- [x] UserPromptSubmit injects context
- [x] PermissionRequest auto-approves correctly
- [x] Notification works cross-platform
- [x] permissionMode reduces prompts
- [ ] Prompt-based hooks make smart decisions
- [ ] SubagentStop validates completion
- [ ] Setup runs one-time init

---

**Document Author:** Claude Code Plugin Analysis
**Review Status:** Phases 1-3 Complete, Phase 4 Pending
