# Hooks System - Complete Reference

## What Are Hooks?

Hooks are user-defined shell commands that execute at specific points in Claude Code's lifecycle. They provide deterministic control over behavior, ensuring certain actions always happen rather than relying on the LLM to choose to run them.

**Key Characteristics:**
- Event-driven with 12 hook types
- Shell commands (bash, python, node) with JSON stdin/stdout
- Support regex pattern matching for tool names
- PreToolUse and PermissionRequest can block/allow/deny operations
- Stop and SubagentStop can force Claude to continue
- Execute with 60-second default timeout (configurable per hook)
- All matching hooks run in parallel

**Use Cases:**
- **Notifications**: Custom alerts when Claude needs input
- **Automatic formatting**: Run prettier, gofmt, etc. after edits
- **Logging**: Track commands for compliance or debugging
- **Feedback**: Enforce codebase conventions
- **Custom permissions**: Block modifications to sensitive files

## Hook Lifecycle Diagram

```
                         ┌─────────────┐
                         │SessionStart │
                         └──────┬──────┘
                                ↓
                    ┌───────────────────────┐
                    │  UserPromptSubmit     │ (can block prompt)
                    └───────────┬───────────┘
                                ↓
                    ┌───────────────────────┐
                    │      Agentic Loop     │
                    │  ┌─────────────────┐  │
                    │  │   PreToolUse    │←─┼── (can block/allow/deny)
                    │  └────────┬────────┘  │
                    │           ↓           │
                    │  ┌─────────────────┐  │
                    │  │PermissionRequest│←─┼── (can allow/deny)
                    │  └────────┬────────┘  │
                    │           ↓           │
                    │  ┌─────────────────┐  │
                    │  │  Tool Executes  │  │
                    │  └────────┬────────┘  │
                    │           ↓           │
                    │  ┌─────────────────┐  │
                    │  │  PostToolUse    │  │ (can provide feedback)
                    │  │ /PostToolFail   │  │
                    │  └────────┬────────┘  │
                    │           ↓           │
                    │  ┌─────────────────┐  │
                    │  │  SubagentStart  │  │
                    │  │   (if Task)     │  │
                    │  └────────┬────────┘  │
                    │           ↓           │
                    │  ┌─────────────────┐  │
                    │  │  SubagentStop   │←─┼── (can force continue)
                    │  └─────────────────┘  │
                    └───────────┬───────────┘
                                ↓
                    ┌───────────────────────┐
                    │        Stop           │← (can force continue)
                    └───────────┬───────────┘
                                ↓
                    ┌───────────────────────┐
                    │     PreCompact        │← (manual or auto)
                    └───────────┬───────────┘
                                ↓
                    ┌───────────────────────┐
                    │     SessionEnd        │
                    └───────────────────────┘
```

## Hook File Structure

**File:** `hooks/hooks.json` (for plugins) or in settings files

**Settings File Locations (in order of precedence):**
- `~/.claude/settings.json` - User settings (global)
- `.claude/settings.json` - Project settings
- `.claude/settings.local.json` - Local project settings (not committed)
- Managed policy settings (enterprise)

**Root Structure:**
```json
{
  "description": "Optional description of hooks purpose",
  "hooks": {
    "PreToolUse": [ /* array of hook rules */ ],
    "PermissionRequest": [ /* array of hook rules */ ],
    "PostToolUse": [ /* array of hook rules */ ],
    "PostToolUseFailure": [ /* array of hook rules */ ],
    "UserPromptSubmit": [ /* array of hook rules */ ],
    "Notification": [ /* array of hook rules */ ],
    "Stop": [ /* array of hook rules */ ],
    "SubagentStart": [ /* array of hook rules */ ],
    "SubagentStop": [ /* array of hook rules */ ],
    "PreCompact": [ /* array of hook rules */ ],
    "Setup": [ /* array of hook rules */ ],
    "SessionStart": [ /* array of hook rules */ ],
    "SessionEnd": [ /* array of hook rules */ ]
  }
}
```

Each hook type contains an array of hook rule objects.

## Hook Types - Complete Reference

### Hook Type Overview

| Hook Type | When | Can Block | Stdin | Purpose |
|-----------|------|-----------|-------|---------|
| **SessionStart** | Session begins/resumes | NO | JSON | Load context, set env vars |
| **UserPromptSubmit** | User submits prompt | YES | JSON | Validate prompts, add context |
| **PreToolUse** | Before tool execution | YES (allow/deny/ask) | JSON | Permission control, validation |
| **PermissionRequest** | Permission dialog shown | YES (allow/deny) | JSON | Auto-approve or deny permissions |
| **PostToolUse** | After tool succeeds | Feedback only | JSON | Formatting, side effects |
| **PostToolUseFailure** | After tool fails | NO | JSON | Error handling |
| **SubagentStart** | Spawning a subagent | NO | JSON | Track subagent creation |
| **SubagentStop** | Subagent finishes | YES (force continue) | JSON | Validate subagent completion |
| **Stop** | Claude finishes responding | YES (force continue) | JSON | Final validation |
| **PreCompact** | Before context compaction | NO | JSON | Save state |
| **Setup** | With --init/--maintenance | NO | JSON | One-time setup tasks |
| **SessionEnd** | Session terminates | NO | JSON | Cleanup, persistence |
| **Notification** | Claude sends notification | NO | JSON | Custom notifications |

## Hook Anatomy

### Hook Rule Structure

```json
{
  "matcher": "ToolPattern",
  "hooks": [
    {
      "type": "command",
      "command": "your-command-here",
      "timeout": 30
    }
  ],
  "description": "Human-readable explanation"
}
```

### Hook Rule Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `matcher` | string | Depends | Regex pattern for tool names. Required for PreToolUse, PermissionRequest, PostToolUse. Use `*` or `""` to match all. |
| `hooks` | array | Yes | Array of hook commands to execute |
| `description` | string | No | Human-readable explanation of what hook does |

### Hook Command Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `"command"` for bash commands, `"prompt"` for LLM evaluation |
| `command` | string | For command | The bash/shell command to execute |
| `prompt` | string | For prompt | Prompt sent to LLM (use `$ARGUMENTS` for input JSON) |
| `timeout` | number | No | Timeout in seconds (default: 60) |
| `once` | boolean | No | Skills only: run hook only once per session |

### Prompt-Based Hooks (type: "prompt")

Instead of executing bash commands, prompt-based hooks use an LLM (Haiku) to make context-aware decisions.

**Most useful for:** `Stop`, `SubagentStop`, `PreToolUse`, `PermissionRequest`

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Evaluate if Claude should stop: $ARGUMENTS. Check if all tasks are complete.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**Response Schema (from LLM):**
```json
{
  "ok": true,       // true = allow action, false = prevent
  "reason": "..."   // Required when ok is false
}
```

**When to use:**
- Complex context-aware decisions
- Natural language understanding needed
- Bash hooks for simple, deterministic rules

## Complete Input Schemas for Each Hook Type

### Common Fields (All Hooks)

All hooks receive these common fields in stdin JSON:

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../session.jsonl",
  "cwd": "/current/working/directory",
  "permission_mode": "default",  // "default", "plan", "acceptEdits", "dontAsk", "bypassPermissions"
  "hook_event_name": "PreToolUse"
}
```

### PreToolUse Input Schema

**Fired:** Before a tool is executed
**Can Block:** YES (exit code 2, or JSON output)

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm install",
    "description": "Install dependencies",
    "timeout": 120000
  },
  "tool_use_id": "toolu_01ABC123..."
}
```

**Tool-Specific tool_input Examples:**

| Tool | tool_input fields |
|------|-------------------|
| **Bash** | `command`, `description`, `timeout`, `run_in_background` |
| **Edit** | `file_path`, `old_string`, `new_string`, `replace_all` |
| **Write** | `file_path`, `content` |
| **Read** | `file_path`, `offset`, `limit` |
| **Task** | Subagent task parameters |
| **mcp__server__tool** | MCP tool-specific parameters |

### PermissionRequest Input Schema

**Fired:** When permission dialog is shown
**Can Block:** YES (allow/deny)

Same structure as PreToolUse. Matches same tool patterns.

### PostToolUse Input Schema

**Fired:** After a tool succeeds
**Can Block:** Feedback only (not blocking)

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/project",
  "permission_mode": "default",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  },
  "tool_response": {
    "filePath": "/path/to/file.txt",
    "success": true
  },
  "tool_use_id": "toolu_01ABC123..."
}
```

### PostToolUseFailure Input Schema

**Fired:** After a tool fails
Same structure as PostToolUse with error information in `tool_response`.

### UserPromptSubmit Input Schema

**Fired:** When user submits a prompt (before Claude processes it)
**Can Block:** YES

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/project",
  "permission_mode": "default",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "Write a function to calculate factorial"
}
```

### Notification Input Schema

**Fired:** When Claude sends notifications
**Matchers:** `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/project",
  "permission_mode": "default",
  "hook_event_name": "Notification",
  "message": "Claude needs your permission to use Bash",
  "notification_type": "permission_prompt"
}
```

### Stop Input Schema

**Fired:** When main Claude agent finishes responding
**Can Block:** YES (force continue)

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/project",
  "permission_mode": "default",
  "hook_event_name": "Stop",
  "stop_hook_active": true  // true if already continuing from a stop hook
}
```

### SubagentStart Input Schema

**Fired:** When spawning a subagent

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/project",
  "permission_mode": "default",
  "hook_event_name": "SubagentStart",
  "agent_id": "agent-abc123",
  "agent_type": "Explore"  // "Bash", "Explore", "Plan", or custom agent name
}
```

### SubagentStop Input Schema

**Fired:** When subagent finishes
**Can Block:** YES (force continue)

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/project",
  "permission_mode": "default",
  "hook_event_name": "SubagentStop",
  "stop_hook_active": false,
  "agent_id": "def456",
  "agent_transcript_path": "/path/to/session/subagents/agent-def456.jsonl"
}
```

### PreCompact Input Schema

**Fired:** Before context compaction
**Matchers:** `manual` (from /compact), `auto` (full context window)

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "permission_mode": "default",
  "hook_event_name": "PreCompact",
  "trigger": "manual",
  "custom_instructions": ""  // Instructions from /compact command
}
```

### Setup Input Schema

**Fired:** With --init, --init-only, or --maintenance flags
**Matchers:** `init`, `maintenance`

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/project",
  "permission_mode": "default",
  "hook_event_name": "Setup",
  "trigger": "init"  // "init" or "maintenance"
}
```

Use Setup for one-time operations (dependencies, migrations). Use SessionStart for every-session tasks.

### SessionStart Input Schema

**Fired:** When session begins or resumes
**Matchers:** `startup`, `resume`, `clear`, `compact`

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/project",
  "permission_mode": "default",
  "hook_event_name": "SessionStart",
  "source": "startup",  // "startup", "resume", "clear", "compact"
  "model": "claude-sonnet-4-20250514",
  "agent_type": "custom-agent"  // Only if started with claude --agent <name>
}
```

**Persisting Environment Variables:**

SessionStart hooks have access to `CLAUDE_ENV_FILE`:

```bash
#!/bin/bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=production' >> "$CLAUDE_ENV_FILE"
  echo 'export PATH="$PATH:./node_modules/.bin"' >> "$CLAUDE_ENV_FILE"
fi
```

### SessionEnd Input Schema

**Fired:** When session terminates

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/session.jsonl",
  "cwd": "/project",
  "permission_mode": "default",
  "hook_event_name": "SessionEnd",
  "reason": "exit"  // "clear", "logout", "prompt_input_exit", "other"
}
```

## Matchers (Pattern Matching)

Matchers use regex patterns to match tool names. They are case-sensitive.

### Matcher Syntax Reference

| Pattern | Meaning | Hook Types |
|---------|---------|------------|
| `*` | Match all tools | PreToolUse, PermissionRequest, PostToolUse |
| `""` | Match all tools (same as `*`) | PreToolUse, PermissionRequest, PostToolUse |
| `Bash` | Exact match | PreToolUse, PermissionRequest, PostToolUse |
| `Edit\|Write` | Match Edit OR Write (regex) | PreToolUse, PermissionRequest, PostToolUse |
| `Notebook.*` | Regex pattern | PreToolUse, PermissionRequest, PostToolUse |

### Tool Name Matchers

**Match All Tools:**
```json
"matcher": "*"
```

**Match Specific Tool:**
```json
"matcher": "Bash"
```

**Match Multiple Tools (regex OR):**
```json
"matcher": "Edit|Write"
```

**Match Pattern:**
```json
"matcher": "Notebook.*"
```

### Common Tool Names

| Tool Name | Description |
|-----------|-------------|
| `Bash` | Shell commands |
| `Edit` | File edits |
| `Write` | File creation |
| `Read` | File reading |
| `Grep` | Content search |
| `Glob` | File pattern matching |
| `Task` | Subagent tasks |
| `WebFetch` | Web content fetching |
| `WebSearch` | Web search |

### MCP Tool Matchers

MCP tools follow the pattern `mcp__<server>__<tool>`:

```json
// Match all memory server tools
"matcher": "mcp__memory__.*"

// Match any MCP write operation
"matcher": "mcp__.*__write.*"

// Match specific MCP tool
"matcher": "mcp__github__search_repositories"
```

### Notification Matchers

| Matcher | When |
|---------|------|
| `permission_prompt` | Permission requests |
| `idle_prompt` | Claude waiting for input (60+ seconds idle) |
| `auth_success` | Authentication success |
| `elicitation_dialog` | MCP tool elicitation |

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "permission_prompt",
        "hooks": [{ "type": "command", "command": "/path/to/permission-alert.sh" }]
      },
      {
        "matcher": "idle_prompt",
        "hooks": [{ "type": "command", "command": "/path/to/idle-notification.sh" }]
      }
    ]
  }
}
```

### PreCompact Matchers

| Matcher | When |
|---------|------|
| `manual` | From /compact command |
| `auto` | From auto-compact (full context) |

### Setup Matchers

| Matcher | When |
|---------|------|
| `init` | From --init or --init-only flags |
| `maintenance` | From --maintenance flag |

### SessionStart Matchers

| Matcher | When |
|---------|------|
| `startup` | New session start |
| `resume` | From --resume, --continue, or /resume |
| `clear` | From /clear command |
| `compact` | After auto or manual compact |

## Hook Output

Hooks communicate via exit codes, stdout, and stderr.

### Exit Codes

| Exit Code | Meaning | stdout | stderr |
|-----------|---------|--------|--------|
| **0** | Success | Shown in verbose mode (Ctrl+O). JSON parsed for structured control. | Ignored |
| **2** | Blocking error | Ignored (JSON NOT processed) | Fed back to Claude as error |
| **Other** | Non-blocking error | Ignored | Shown in verbose mode only |

**Exit Code 2 Behavior by Hook:**

| Hook Event | Exit Code 2 Behavior |
|------------|---------------------|
| PreToolUse | Blocks the tool call, shows stderr to Claude |
| PermissionRequest | Denies permission, shows stderr to Claude |
| PostToolUse | Shows stderr to Claude (tool already ran) |
| UserPromptSubmit | Blocks prompt, erases it, shows stderr to user |
| Stop | Blocks stoppage, shows stderr to Claude |
| SubagentStop | Blocks stoppage, shows stderr to subagent |
| Setup, SessionStart, SessionEnd, Notification, PreCompact | Shows stderr to user only |

### JSON Output Structure

All hooks can output JSON to stdout (exit code 0 only) for structured control:

```json
{
  "continue": true,           // false = stop processing after hooks
  "stopReason": "...",        // Message shown when continue is false
  "suppressOutput": true,     // Hide stdout from transcript mode
  "systemMessage": "...",     // Warning shown to user
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    // Hook-specific fields below
  }
}
```

### PreToolUse Decision Control

Control whether a tool call proceeds:

| Decision | Effect |
|----------|--------|
| `"allow"` | Bypasses permission system. Reason shown to user, not Claude. |
| `"deny"` | Prevents tool execution. Reason shown to Claude. |
| `"ask"` | Shows confirmation dialog. Reason shown to user, not Claude. |

**Can also modify tool inputs with `updatedInput`:**

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "Auto-approved read operation",
    "updatedInput": {
      "command": "npm run lint --fix"
    },
    "additionalContext": "Running in production environment"
  }
}
```

### PermissionRequest Decision Control

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow",      // or "deny"
      "updatedInput": { ... },  // Optional: modify tool input
      "message": "...",         // For deny: reason shown to Claude
      "interrupt": true         // For deny: stop Claude
    }
  }
}
```

### PostToolUse Decision Control

Provide feedback after tool execution:

```json
{
  "decision": "block",  // Prompts Claude with reason
  "reason": "Found console.log statements - please remove",
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "File was formatted with prettier"
  }
}
```

### UserPromptSubmit Decision Control

Two ways to add context:
1. **Plain text stdout** - Simplest, text added as context
2. **JSON with additionalContext** - More structured

```json
{
  "decision": "block",  // Optional: block prompt processing
  "reason": "Prompt contains sensitive data",
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "Current time: 2025-01-28T12:00:00Z"
  }
}
```

### Stop/SubagentStop Decision Control

Force Claude to continue working:

```json
{
  "decision": "block",  // Prevents stopping
  "reason": "Tests are still failing - please fix them"
}
```

**Important:** Check `stop_hook_active` in input to prevent infinite loops.

### SessionStart Decision Control

Add context at session start:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Previous session summary: Fixed 3 bugs..."
  }
}
```

### Setup Decision Control

Add context during repository setup:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "Setup",
    "additionalContext": "Dependencies installed. Node v20.10.0 detected."
  }
}
```

## Hook Execution Types

### Inline Node.js Execution

Execute JavaScript directly with `node -e`:

```json
{
  "type": "command",
  "command": "node -e \"console.error('[Hook] Running');process.exit(0)\""
}
```

**Use for:**
- Quick operations
- Simple logic
- One-liners

**Example:**
```json
{
  "type": "command",
  "command": "node -e \"console.error('[Hook] Installing dependencies')\""
}
```

### Script File Reference

Reference external Node.js script:

```json
{
  "type": "command",
  "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/formatter.js\""
}
```

**Use for:**
- Complex logic
- Reusable code
- Long scripts (>50 lines)

**Example:**
```json
{
  "type": "command",
  "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/smart-formatter.js\""
}
```

## Complete Hook Examples

### Example 1: Auto-Format TypeScript Files (PostToolUse)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | { read file_path; if echo \"$file_path\" | grep -q '\\.ts$'; then npx prettier --write \"$file_path\"; fi; }"
          }
        ]
      }
    ]
  }
}
```

### Example 2: File Protection (PreToolUse)

Block edits to sensitive files:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 -c \"import json, sys; data=json.load(sys.stdin); path=data.get('tool_input',{}).get('file_path',''); sys.exit(2 if any(p in path for p in ['.env', 'package-lock.json', '.git/']) else 0)\""
          }
        ],
        "description": "Block edits to sensitive files"
      }
    ]
  }
}
```

### Example 3: Custom Desktop Notification

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "permission_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "notify-send 'Claude Code' 'Awaiting your permission'"
          }
        ]
      }
    ]
  }
}
```

### Example 4: Session Initialization (SessionStart)

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/session-start.cjs\""
          }
        ],
        "description": "Load previous context and detect package manager"
      }
    ]
  }
}
```

### Example 5: Intelligent Stop Hook (Prompt-Based)

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Evaluate if Claude should stop working. Context: $ARGUMENTS\n\nCheck if:\n1. All user-requested tasks are complete\n2. Any errors need addressing\n3. Follow-up work is needed\n\nRespond with JSON: {\"ok\": true} to allow stopping, or {\"ok\": false, \"reason\": \"explanation\"} to continue.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### Example 6: Bash Command Validation (Python)

```python
#!/usr/bin/env python3
import json, sys, re

RULES = [
    (r"\bgrep\b(?!.*\|)", "Use 'rg' (ripgrep) instead of 'grep'"),
    (r"\bfind\s+\S+\s+-name\b", "Use 'rg --files -g pattern' instead of 'find -name'"),
]

data = json.load(sys.stdin)
command = data.get("tool_input", {}).get("command", "")

issues = [msg for pattern, msg in RULES if re.search(pattern, command)]
if issues:
    for msg in issues:
        print(f"• {msg}", file=sys.stderr)
    sys.exit(2)  # Block with feedback to Claude
```

### Example 7: Auto-Approve Documentation Reads

```python
#!/usr/bin/env python3
import json, sys

data = json.load(sys.stdin)
tool_name = data.get("tool_name", "")
file_path = data.get("tool_input", {}).get("file_path", "")

if tool_name == "Read" and file_path.endswith((".md", ".txt", ".json")):
    output = {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "allow",
            "permissionDecisionReason": "Documentation file auto-approved"
        },
        "suppressOutput": True
    }
    print(json.dumps(output))
sys.exit(0)
```

## Hook Script Template

**File:** `scripts/hooks/my-hook.cjs`

```javascript
#!/usr/bin/env node

// Read JSON from stdin
let data = '';
process.stdin.on('data', chunk => data += chunk);

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);

    // Block operation with feedback to Claude (PreToolUse/PermissionRequest)
    if (shouldBlock(input)) {
      console.error('Operation not allowed: reason here');  // stderr goes to Claude
      process.exit(2);  // Exit code 2 = blocking error
    }

    // Perform side effects (PostToolUse, SessionStart, etc.)
    performAction(input);

    // JSON output for structured control
    const output = {
      hookSpecificOutput: {
        hookEventName: input.hook_event_name,
        additionalContext: "Hook completed successfully"
      }
    };
    console.log(JSON.stringify(output));
    process.exit(0);  // Success
  } catch (error) {
    console.error('[Hook] Script error:', error.message);
    process.exit(1);  // Non-blocking error
  }
});

function shouldBlock(input) {
  // Your validation logic here
  return false;
}

function performAction(input) {
  // Your side effects here (formatting, logging, etc.)
}
```

**Python Template:**

```python
#!/usr/bin/env python3
import json
import sys

try:
    data = json.load(sys.stdin)

    # Block with feedback to Claude
    if should_block(data):
        print("Operation not allowed: reason", file=sys.stderr)
        sys.exit(2)  # Blocking error

    # Perform action
    perform_action(data)

    # JSON output for structured control
    output = {
        "hookSpecificOutput": {
            "hookEventName": data.get("hook_event_name"),
            "additionalContext": "Hook completed"
        }
    }
    print(json.dumps(output))
    sys.exit(0)

except Exception as e:
    print(f"Hook error: {e}", file=sys.stderr)
    sys.exit(1)  # Non-blocking error

def should_block(data):
    return False

def perform_action(data):
    pass
```

## Environment Variables in Hooks

| Variable | Availability | Description |
|----------|--------------|-------------|
| `CLAUDE_PROJECT_DIR` | All hooks | Absolute path to project root |
| `CLAUDE_PLUGIN_ROOT` | Plugin hooks | Absolute path to plugin directory |
| `CLAUDE_ENV_FILE` | SessionStart, Setup | File path for persisting env vars |
| `CLAUDE_CODE_REMOTE` | All hooks | `"true"` if remote (web), empty if local CLI |
| `HOME` | All hooks | User home directory |
| `PWD` | All hooks | Current working directory |

**Usage in commands:**

```json
{
  "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/check.js\""
}
```

```json
{
  "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/format.sh"
}
```

## Hook Execution Order and Parallelization

**Key Behaviors:**
- **Parallelization**: All matching hooks run in parallel
- **Deduplication**: Identical hook commands are deduplicated automatically
- **Timeout**: 60-second default limit (configurable per hook)
- **Environment**: Runs in current directory with Claude Code's environment

**Multiple hooks from different sources:**

```json
// User settings + Project settings + Plugin hooks
// All matching hooks from all sources run in parallel
{
  "PreToolUse": [
    { "matcher": "Bash", "hooks": [...] },  // All these run
    { "matcher": "Bash", "hooks": [...] },  // in parallel
    { "matcher": "*", "hooks": [...] }      // if they match
  ]
}
```

## Performance Considerations

**Hook Execution Time:**
- Hooks should complete quickly (< 1 second ideal)
- Long hooks slow down tool execution (PreToolUse)
- PostToolUse hooks don't block user, so longer acceptable

**Best Practices:**
- Keep inline Node.js simple
- Use script files for complex logic
- Avoid heavy file I/O in PreToolUse
- Cache results when possible
- Use environmental checks to skip unnecessary work

**Example: Only Run When Needed**

```javascript
// In script - skip if file doesn't exist
if (!fs.existsSync('.git')) {
  console.log(data);
  process.exit(0);  // Skip gracefully
}
```

## Security Considerations

**USE AT YOUR OWN RISK**: Hooks execute arbitrary shell commands automatically with your environment's credentials.

### Security Best Practices

1. **Validate and sanitize inputs** - Never trust input data blindly
2. **Always quote shell variables** - Use `"$VAR"` not `$VAR`
3. **Block path traversal** - Check for `..` in file paths
4. **Use absolute paths** - Specify full paths (use `$CLAUDE_PROJECT_DIR`)
5. **Skip sensitive files** - Avoid `.env`, `.git/`, keys, credentials
6. **Review before enabling** - Always understand hook code before adding

### Configuration Safety

Direct edits to hooks in settings files don't take effect immediately:

- Claude Code captures a **snapshot** of hooks at startup
- Uses this snapshot throughout the session
- **Warns** if hooks are modified externally
- Requires review in `/hooks` menu for changes to apply

This prevents malicious hook modifications from affecting your current session.

### Enterprise Controls

Administrators can use `allowManagedHooksOnly` to block user, project, and plugin hooks.

## Debugging Hooks

### Basic Troubleshooting

1. **Check configuration** - Run `/hooks` to see registered hooks
2. **Verify syntax** - Ensure JSON settings are valid
3. **Test commands** - Run hook commands manually first
4. **Check permissions** - Make sure scripts are executable
5. **Review logs** - Use `claude --debug` to see hook execution

### Common Issues

| Issue | Solution |
|-------|----------|
| Quotes not escaped | Use `\"` inside JSON strings |
| Wrong matcher | Check tool names match exactly (case-sensitive) |
| Command not found | Use full paths for scripts |
| Hook not running | Check matcher regex pattern |

### Debug Mode

Run `claude --debug` to see detailed hook execution:

```
[DEBUG] Executing hooks for PostToolUse:Write
[DEBUG] Getting matching hook commands for PostToolUse with query: Write
[DEBUG] Found 1 hook matchers in settings
[DEBUG] Matched 1 hooks for query "Write"
[DEBUG] Found 1 hook commands to execute
[DEBUG] Executing hook command: <command> with timeout 60000ms
[DEBUG] Hook command completed with status 0: <stdout>
```

### Test Hook Scripts Directly

```bash
# Test PreToolUse hook
echo '{"tool_name":"Edit","tool_input":{"file_path":"test.ts"}}' | \
  node scripts/hooks/my-hook.cjs

# Test with jq for pretty output
echo '{"tool_name":"Bash","tool_input":{"command":"npm test"}}' | \
  python3 my-hook.py | jq .
```

## Hooks in Skills and Agents

Hooks can be defined in skill and agent frontmatter for component-scoped lifecycle:

**Skill Example:**
```yaml
---
name: secure-operations
description: Perform operations with security checks
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
---
```

**Agent Example:**
```yaml
---
name: code-reviewer
description: Review code changes
hooks:
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
---
```

**Supported events for component hooks:** PreToolUse, PostToolUse, Stop

**Skill-only option:** `once: true` - Run hook only once per session

## Complete Reference Checklist

### Creating a Hook

- [ ] File: `hooks/hooks.json` or settings file
- [ ] Valid JSON structure
- [ ] Hook type: One of 12 supported types
- [ ] Matcher: Valid regex pattern (for tool hooks)
- [ ] Commands: Valid shell commands
- [ ] Exit codes: Correct for hook type (0, 2, or other)
- [ ] JSON input/output handling
- [ ] Performance: < 1 second ideal
- [ ] Error handling: Graceful failures
- [ ] Security: No sensitive data exposure

### Matcher Checklist

- [ ] Syntax: Valid regex pattern
- [ ] Tool name: Correct (Bash, Edit, etc)
- [ ] Case sensitivity: Matchers are case-sensitive
- [ ] MCP tools: Use `mcp__server__tool` format
- [ ] Testing: Verified matcher works

### Output Checklist

- [ ] Exit code 0 for success (stdout parsed as JSON)
- [ ] Exit code 2 for blocking errors (stderr to Claude)
- [ ] JSON output uses correct `hookSpecificOutput` structure
- [ ] Decision fields match hook type
- [ ] `additionalContext` for adding information

---

**Last Updated:** 2026-01-28
**Version:** 3.0.0
**Status:** Complete Specification - Based on Official Claude Code Docs
