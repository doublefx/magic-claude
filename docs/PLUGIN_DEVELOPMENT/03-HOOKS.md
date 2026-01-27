# Hooks System - Complete Reference

## What Are Hooks?

Hooks are automated actions triggered by specific events in the Claude Code workflow. They enable side effects like file formatting, security checks, and notifications without blocking normal operations.

**Key Characteristics:**
- Event-driven (PreToolUse, PostToolUse, SessionStart, SessionEnd, PreCompact, Stop)
- Non-blocking except PreToolUse (which can block execution)
- Execute Node.js scripts with JSON input/output
- Support pattern matching with CEL expressions
- Only PreToolUse can block operations
- Executed synchronously in order

## Hook Lifecycle Diagram

```
Workflow Event
    ↓
[Hook Type: PreToolUse, PostToolUse, SessionStart, etc.]
    ↓
[Matcher CEL Expression Evaluated]
    ↓
Match? YES → [Execute Hook Commands in Order]
     ↓              ↓
     NO            [Node.js Script Runs]
     ↓              ↓
  Skip        [Read from stdin, Write to stdout]
              ↓
          [Hook Decision: 0=continue, 1=block]
              ↓
          [Only PreToolUse can block]
              ↓
          [Return to Workflow]
```

## Hook File Structure

**File:** `hooks/hooks.json`

**Root Structure:**
```json
{
  "hooks": {
    "PreToolUse": [ /* array of hook rules */ ],
    "PostToolUse": [ /* array of hook rules */ ],
    "SessionStart": [ /* array of hook rules */ ],
    "SessionEnd": [ /* array of hook rules */ ],
    "PreCompact": [ /* array of hook rules */ ],
    "Stop": [ /* array of hook rules */ ]
  }
}
```

Each hook type contains an array of hook rule objects.

## Hook Types - Complete Reference

### Hook Type Overview

| Hook Type | When | Blocking | Stdin | Stdout | Purpose |
|-----------|------|----------|-------|--------|---------|
| **PreToolUse** | Before tool execution | YES | JSON | JSON | Validation, blocking operations |
| **PostToolUse** | After tool execution | NO | JSON | JSON | Side effects, formatting, checks |
| **SessionStart** | Session begins | NO | JSON | JSON | Initialization, context loading |
| **SessionEnd** | Session ending | NO | JSON | JSON | Cleanup, state persistence |
| **PreCompact** | Before context compaction | NO | JSON | JSON | State preservation |
| **Stop** | Before response sent | NO | JSON | JSON | Final validation checks |

## Hook Anatomy

### Hook Rule Structure

```json
{
  "matcher": "CEL expression",
  "hooks": [
    {
      "type": "command",
      "command": "node -e \"...\" or node \"path/to/script.cjs\""
    }
  ],
  "description": "Human-readable explanation"
}
```

### Hook Rule Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `matcher` | string | Yes | CEL expression to match when hook should run |
| `hooks` | array | Yes | Array of hook commands to execute |
| `description` | string | Yes | Human-readable explanation of what hook does |

### Hook Command Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Always "command" (only type currently) |
| `command` | string | Yes | Node.js command: `node -e "..."` or `node "script.cjs"` |

## Complete Input Schemas for Each Hook Type

### PreToolUse Input Schema

**Fired:** Before a tool is executed
**Can Block:** YES (exit code 1)
**Stdin JSON:**

```json
{
  "tool": "Bash|Edit|Write|Read|Grep|Glob|TaskCreate|TaskUpdate",
  "tool_input": {
    // Tool-specific input parameters
    // Examples below for each tool type
  }
}
```

**Tool-Specific Input Examples:**

**Bash Tool:**
```json
{
  "tool": "Bash",
  "tool_input": {
    "command": "npm install",
    "description": "Install dependencies"
  }
}
```

**Edit Tool:**
```json
{
  "tool": "Edit",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "old_string": "const x = 1",
    "new_string": "const x = 2"
  }
}
```

**Write Tool:**
```json
{
  "tool": "Write",
  "tool_input": {
    "file_path": "/path/to/file.md",
    "content": "File content here"
  }
}
```

**Read Tool:**
```json
{
  "tool": "Read",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "limit": 100,
    "offset": 0
  }
}
```

**Grep Tool:**
```json
{
  "tool": "Grep",
  "tool_input": {
    "pattern": "function.*async",
    "path": "/src",
    "type": "ts"
  }
}
```

**Glob Tool:**
```json
{
  "tool": "Glob",
  "tool_input": {
    "pattern": "**/*.test.ts",
    "path": "/src"
  }
}
```

**PreToolUse Output:**

```bash
# Continue execution (default)
exit(0)

# Block execution (PreToolUse only)
exit(1)
```

Script can also output JSON to stdout (same as input).

### PostToolUse Input Schema

**Fired:** After a tool has executed
**Can Block:** NO
**Stdin JSON:**

```json
{
  "tool": "Tool name",
  "tool_input": { /* Input that was sent to tool */ },
  "tool_output": {
    "output": "Standard output",
    "error": "Standard error",
    "exit_code": 0
  }
}
```

**Example:**

```json
{
  "tool": "Bash",
  "tool_input": {
    "command": "npm test"
  },
  "tool_output": {
    "output": "PASS src/utils.test.ts\n  ✓ adds numbers",
    "error": "",
    "exit_code": 0
  }
}
```

**PostToolUse Output:**

JSON passed to stdout (usually just echo input or modified version).

### SessionStart Input Schema

**Fired:** When session begins
**Can Block:** NO
**Stdin JSON:**

```json
{
  "event": "SessionStart",
  "session_id": "${CLAUDE_SESSION_ID}",
  "timestamp": "2025-01-27T12:00:00Z",
  "environment": {
    "CLAUDE_PLUGIN_ROOT": "/path/to/plugin",
    "HOME": "/home/user",
    "PWD": "/current/dir"
  }
}
```

**SessionStart Output:**

Can output configuration or context to be loaded.

### SessionEnd Input Schema

**Fired:** When session is ending
**Can Block:** NO
**Stdin JSON:**

```json
{
  "event": "SessionEnd",
  "session_id": "${CLAUDE_SESSION_ID}",
  "timestamp": "2025-01-27T12:00:00Z",
  "duration_ms": 3600000,
  "messages_count": 42
}
```

**SessionEnd Output:**

Can output cleanup or persistence status.

### PreCompact Input Schema

**Fired:** Before context compaction
**Can Block:** NO
**Stdin JSON:**

```json
{
  "event": "PreCompact",
  "session_id": "${CLAUDE_SESSION_ID}",
  "current_tokens": 45000,
  "compaction_target": 30000
}
```

**PreCompact Output:**

Can output state to be saved before compaction.

### Stop Input Schema

**Fired:** Before response sent to user
**Can Block:** NO
**Stdin JSON:**

```json
{
  "event": "Stop",
  "session_id": "${CLAUDE_SESSION_ID}",
  "response_ready": true,
  "files_modified": ["path1.ts", "path2.ts"],
  "timestamp": "2025-01-27T12:00:00Z"
}
```

**Stop Output:**

Can output final validation warnings.

## Matchers (CEL Expressions)

Matchers use Common Expression Language (CEL) to determine when hooks run.

### CEL Syntax Reference

| Pattern | Meaning |
|---------|---------|
| `*` | Match all (any tool, any event) |
| `tool == "Bash"` | Match only Bash tool |
| `tool == "Edit" \|\| tool == "Write"` | Match Edit OR Write |
| `tool == "Edit" && tool_input.file_path matches "\\.ts$"` | Match Edit with TypeScript files |
| `!(tool == "Read")` | Match any tool except Read |

### Basic Matchers

**Match All Events:**
```json
"matcher": "*"
```

**Match Specific Tool:**
```json
"matcher": "tool == \"Bash\""
```

**Match Tool with Input Condition:**
```json
"matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.ts$\""
```

**Match Multiple Conditions (OR):**
```json
"matcher": "(tool == \"Edit\" || tool == \"Write\") && tool_input.file_path matches \"\\\\.java$\""
```

### Common Tool Matchers

| Pattern | Matches |
|---------|---------|
| `tool == "Bash"` | Bash commands |
| `tool == "Edit"` | File edits |
| `tool == "Write"` | File creation |
| `tool == "Read"` | File reads |
| `tool == "Grep"` | Content search |
| `tool == "Glob"` | File glob |
| `tool == "TaskCreate"` | Task creation |
| `tool == "TaskUpdate"` | Task updates |

### Tool Input Matchers

| Pattern | Description | Example |
|---------|-------------|---------|
| `tool_input.command matches "pattern"` | Bash command pattern | `matches "npm install"` |
| `tool_input.file_path matches "pattern"` | File path pattern | `matches "\\.ts$"` |
| `!tool_input.file_path matches "pattern"` | Negated pattern | `!matches "test"` |

### File Extension Patterns

| Pattern | Matches |
|---------|---------|
| `\\.ts$` | TypeScript files |
| `\\.(ts\|tsx)$` | TypeScript and TSX |
| `\\.(js\|jsx)$` | JavaScript files |
| `\\.java$` | Java files |
| `\\.py$` | Python files |
| `\\.md$` | Markdown files |

### Command Patterns

| Pattern | Matches |
|---------|---------|
| `npm install` | Exact command |
| `(npm\|pnpm) install` | npm or pnpm install |
| `npm (install\|test)` | npm install or test |
| `git push` | Git push |
| `(pytest\|vitest\|jest)` | Test runners |

### Negation Patterns

```json
// Block creation of random .md files
"matcher": "tool == \"Write\" && tool_input.file_path matches \"\\\\.md$\" && !(tool_input.file_path matches \"README\\\\.md\")"
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

### Example 1: Block Dev Servers Outside Tmux (PreToolUse)

```json
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm run dev|yarn dev|pnpm dev)\"",
  "hooks": [
    {
      "type": "command",
      "command": "node -e \"console.error('[Hook] BLOCKED: Dev server must run in tmux');console.error('Use: tmux new -s dev \\\"npm run dev\\\"');process.exit(1)\""
    }
  ],
  "description": "Block dev servers outside tmux for log access"
}
```

**Flow:**
1. User tries to run `npm run dev`
2. PreToolUse hook matches
3. Script outputs error and exits with code 1
4. Execution is BLOCKED
5. User is told to use tmux

### Example 2: Format Code After Edit (PostToolUse)

```json
{
  "matcher": "(tool == \"Edit\" || tool == \"Write\") && (tool_input.file_path matches \"\\\\.ts$\" || tool_input.file_path matches \"\\\\.tsx$\")",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/smart-formatter.js\""
    }
  ],
  "description": "Auto-format TypeScript/TSX files with prettier"
}
```

**Flow:**
1. User edits a .ts or .tsx file
2. Tool execution completes
3. PostToolUse hook matches
4. smart-formatter.js script runs
5. File is formatted
6. User continues (no blocking)

### Example 3: Session Initialization (SessionStart)

```json
{
  "matcher": "*",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/session-start.cjs\""
    }
  ],
  "description": "Load previous context and detect package manager on new session"
}
```

**Flow:**
1. New session starts
2. SessionStart hook fires
3. session-start.cjs runs
4. Loads previous session state
5. Detects package manager
6. Sets up environment

### Example 4: Security Check on Java Files (PostToolUse)

```json
{
  "matcher": "(tool == \"Edit\" || tool == \"Write\") && tool_input.file_path matches \"\\\\.java$\"",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/java-security.js\""
    }
  ],
  "description": "Run security checks on Java files (SQL injection, hardcoded credentials)"
}
```

**Flow:**
1. Java file is edited or created
2. PostToolUse hook matches
3. java-security.js runs security checks
4. Reports any vulnerabilities found
5. Non-blocking (user can continue)

### Example 5: Warn About Console.log (Stop)

```json
{
  "matcher": "*",
  "hooks": [
    {
      "type": "command",
      "command": "node -e \"const fs=require('fs');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const files=(i.files_modified||[]).filter(f=>/(ts|js)x?$/.test(f));let found=false;for(const f of files){if(fs.existsSync(f)&&fs.readFileSync(f,'utf8').includes('console.log')){console.error('[Hook] ⚠️  console.log in '+f);found=true}}console.log(d)})\""
    }
  ],
  "description": "Check for console.log statements before sending response"
}
```

**Flow:**
1. Claude prepares response
2. Stop hook fires
3. Script checks modified files for console.log
4. Warns user if found
5. Response is sent (non-blocking)

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

    // Log to stderr (visible to user)
    if (shouldBlock(input)) {
      console.error('[Hook] ERROR: Operation not allowed');
      process.stdout.write(data);  // Pass through unchanged
      process.exit(1);              // Exit with error code (blocks PreToolUse)
    }

    // Perform side effects
    performAction(input);

    // Pass through or modified JSON
    process.stdout.write(data);
    process.exit(0);                // Success
  } catch (error) {
    console.error('[Hook] Script error:', error.message);
    process.stdout.write(data);
    process.exit(0);  // Don't crash the workflow
  }
});

function shouldBlock(input) {
  // Your logic here
  return false;
}

function performAction(input) {
  // Your side effects here
}
```

## Environment Variables in Hooks

**Available in all hooks:**

| Variable | Value |
|----------|-------|
| `${CLAUDE_PLUGIN_ROOT}` | Absolute plugin directory |
| `${CLAUDE_SESSION_ID}` | Current session ID |
| `HOME` | User home directory |
| `PWD` | Current working directory |

**Usage:**

```json
{
  "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/check.js\""
}
```

## Hook Execution Order and Parallelization

**Within a Hook Type:**
- Hooks execute sequentially (in order)
- Each hook waits for previous to complete
- All hooks must complete before tool execution (PreToolUse)

**Example with Multiple Hooks:**

```json
{
  "PreToolUse": [
    { "matcher": "*", "hooks": [...] },  // Hook 1 executes
    { "matcher": "*", "hooks": [...] },  // Hook 2 executes after Hook 1
    { "matcher": "*", "hooks": [...] }   // Hook 3 executes after Hook 2
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

## Debugging Hooks

**Enable logging:**

```javascript
// In hook script
const debug = process.env.CLAUDE_HOOK_DEBUG === 'true';
if (debug) console.error('[DEBUG]', input);
```

**Test hook script directly:**

```bash
# Create test input
echo '{"tool":"Edit","tool_input":{"file_path":"test.ts"}}' | \
  node scripts/hooks/my-hook.cjs
```

## Complete Reference Checklist

### Creating a Hook

- [ ] File: `hooks/hooks.json`
- [ ] Valid JSON structure
- [ ] Hook type: PreToolUse/PostToolUse/SessionStart/etc
- [ ] Matcher: Valid CEL expression
- [ ] Commands: Valid Node.js commands
- [ ] Description: Clear explanation
- [ ] Exit codes: Correct for hook type
- [ ] JSON input/output handling
- [ ] Performance: < 1 second ideal
- [ ] Error handling: Graceful failures

### Matcher Checklist

- [ ] Syntax: Valid CEL expression
- [ ] Tool name: Correct (Bash, Edit, etc)
- [ ] Input fields: Correct for tool
- [ ] Regex escaping: Proper backslash escaping
- [ ] Negation: Using correct syntax
- [ ] Testing: Verified matcher works

---

**Last Updated:** 2025-01-27
**Version:** 2.0.0
**Status:** Complete Specification
