# Hooks System - Event Automation

## What Are Hooks?

Hooks are automated actions triggered by specific events in the Claude Code workflow. They enable side effects like file formatting, security checks, and notifications without blocking normal operations.

**Key Characteristics:**
- Event-driven (Pre/Post tool use, session start/end, etc.)
- Non-blocking (except PreToolUse)
- Execute Node.js scripts
- Support pattern matching (CEL expressions)
- Can block operations (PreToolUse only)

## Hook File Structure

**File:** `hooks/hooks.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "tool == \"Bash\" && tool_input.command matches \"npm install\"",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"console.error('[Hook] Installing dependencies')\""
          }
        ],
        "description": "Notify when installing dependencies"
      }
    ],
    "PostToolUse": [ /* ... */ ],
    "SessionStart": [ /* ... */ ],
    "SessionEnd": [ /* ... */ ],
    "PreCompact": [ /* ... */ ],
    "Stop": [ /* ... */ ]
  }
}
```

## Hook Types

| Hook Type | Timing | Can Block? | Purpose | Examples |
|-----------|--------|-----------|---------|----------|
| **PreToolUse** | Before tool executes | Yes | Validation, blocking | Block dev servers, suggest tmux |
| **PostToolUse** | After tool executes | No | Side effects | Format code, type check |
| **SessionStart** | Session begins | No | Initialization | Load context, detect PM |
| **SessionEnd** | Session ending | No | Cleanup | Save state, extract patterns |
| **PreCompact** | Before compaction | No | State preservation | Save session state |
| **Stop** | Before response sent | No | Final checks | Warn about console.log |

## Hook Anatomy

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `matcher` | string | CEL expression to match tools and conditions |
| `hooks` | array | Array of hook objects to execute |
| `description` | string | Human-readable explanation |

### Hook Command Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | "command" (only type currently) |
| `command` | string | Yes | Node.js command to execute |

## Matchers (CEL Expressions)

Matchers use Common Expression Language (CEL) to determine when hooks run.

### Basic Matchers

**Match All:**
```json
"matcher": "*"
```

**Match Specific Tool:**
```json
"matcher": "tool == \"Bash\""
```

**Match Tool with Input Check:**
```json
"matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.ts$\""
```

**Match Multiple Conditions:**
```json
"matcher": "(tool == \"Edit\" || tool == \"Write\") && tool_input.file_path matches \"\\\\.java$\""
```

### Common Matchers

| Pattern | Description |
|---------|-------------|
| `tool == "Bash"` | Bash tool execution |
| `tool == "Edit"` | File editing |
| `tool == "Write"` | File writing |
| `tool == "Read"` | File reading |
| `tool == "Glob"` | File globbing |
| `tool == "Grep"` | Content searching |
| `tool_input.command matches "pattern"` | Bash command pattern |
| `tool_input.file_path matches "pattern"` | File path pattern |
| `*` | Match all (any tool) |

### Regular Expression Patterns

File extensions:
```
\\.ts$                 # TypeScript files
\\.(ts\|tsx)$         # TypeScript and TSX
\\.(js\|jsx)$         # JavaScript files
\\.java$              # Java files
\\.py$                # Python files
```

Command patterns:
```
npm install            # Exact command
(npm\|pnpm) install   # Either npm or pnpm
npm (install\|test)   # npm with install or test
```

Exclusion patterns:
```
!(README\\.md)        # NOT README.md
!(CLAUDE\\.md|CONTRIBUTING\\.md)  # NOT these files
```

## Hook Execution Types

### Inline Node.js

Execute JavaScript directly with `node -e`:

```json
{
  "type": "command",
  "command": "node -e \"console.error('[Hook] Running');process.exit(0)\""
}
```

**Use for:** Quick operations, simple logic

### Script File Reference

Execute Node.js script with plugin root reference:

```json
{
  "type": "command",
  "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/my-hook.cjs\""
}
```

**Use for:** Complex logic, code reuse

### Stdin/Stdout Pattern

Receive input via stdin, process, and output:

```javascript
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  const input = JSON.parse(data);
  // Process input
  console.log(JSON.stringify(output));
});
```

## Hook Event Details

### PreToolUse Hooks

Executed **before** the tool runs. Can block execution by calling `process.exit(1)`.

**Tool Input Available:**
```javascript
{
  "tool": "Bash",
  "tool_input": {
    "command": "npm install"
  }
}
```

**Example: Block Dev Server Outside Tmux**
```json
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm|pnpm) dev\"",
  "hooks": [
    {
      "type": "command",
      "command": "node -e \"if(!process.env.TMUX){console.error('[Hook] BLOCKED: Must run in tmux');process.exit(1)}\""
    }
  ],
  "description": "Ensure dev servers run in tmux"
}
```

### PostToolUse Hooks

Executed **after** the tool completes. Cannot block, but can have side effects.

**Tool Input + Output Available:**
```javascript
{
  "tool": "Bash",
  "tool_input": { "command": "npm test" },
  "tool_output": {
    "output": "Test results...",
    "exit_code": 0
  }
}
```

**Example: Format TypeScript After Edit**
```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.ts$\"",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/smart-formatter.js\""
    }
  ],
  "description": "Auto-format TypeScript files"
}
```

### SessionStart Hooks

Executed when a new session begins. No input data.

**Example: Load Previous Context**
```json
{
  "matcher": "*",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/session-start.cjs\""
    }
  ],
  "description": "Load session context and detect package manager"
}
```

### SessionEnd Hooks

Executed when session ends. No input data.

**Example: Persist Session State**
```json
{
  "matcher": "*",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/session-end.cjs\""
    }
  ],
  "description": "Save session state and extract patterns"
}
```

### PreCompact Hooks

Executed before context compaction. Chance to save state.

**Example: Save State Before Compaction**
```json
{
  "matcher": "*",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/pre-compact.cjs\""
    }
  ],
  "description": "Save state before context compaction"
}
```

### Stop Hooks

Executed before final response. Can warn about issues.

**Example: Check for Console.log**
```json
{
  "matcher": "*",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/check-console-log.cjs\""
    }
  ],
  "description": "Warn about console.log statements"
}
```

## Real-World Hook Examples

### Example 1: Block Dev Server Outside Tmux

```json
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm run dev|pnpm( run)? dev|yarn dev|bun run dev)\"",
  "hooks": [
    {
      "type": "command",
      "command": "node -e \"console.error('[Hook] BLOCKED: Dev server must run in tmux for log access');console.error('[Hook] Use: tmux new-session -d -s dev \\\"npm run dev\\\"');console.error('[Hook] Then: tmux attach -t dev');process.exit(1)\""
    }
  ],
  "description": "Block dev servers outside tmux - ensures you can access logs"
}
```

### Example 2: Suggest Tmux for Long-Running Commands

```json
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm (install|test)|pnpm (install|test)|yarn (install|test)?|bun (install|test)|cargo build|make|docker|pytest|playwright)\"",
  "hooks": [
    {
      "type": "command",
      "command": "node -e \"if(!process.env.TMUX){console.error('[Hook] Consider running in tmux for session persistence');console.error('[Hook] tmux new -s dev  |  tmux attach -t dev')}\""
    }
  ],
  "description": "Reminder to use tmux for long-running commands"
}
```

### Example 3: Auto-Format Code on Edit

```json
{
  "matcher": "tool == \"Edit\" || tool == \"Write\"",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/smart-formatter.js\""
    }
  ],
  "description": "Auto-format files based on type (Prettier for JS/TS, Ruff for Python)"
}
```

### Example 4: TypeScript Type Check

```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx)$\"",
  "hooks": [
    {
      "type": "command",
      "command": "node -e \"const{execSync}=require('child_process');const fs=require('fs');const path=require('path');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const p=i.tool_input?.file_path;if(p&&fs.existsSync(p)){let dir=path.dirname(p);while(dir!==path.dirname(dir)&&!fs.existsSync(path.join(dir,'tsconfig.json'))){dir=path.dirname(dir)}if(fs.existsSync(path.join(dir,'tsconfig.json'))){try{const r=execSync('npx tsc --noEmit --pretty false 2>&1',{cwd:dir,encoding:'utf8',stdio:['pipe','pipe','pipe']});const lines=r.split('\\n').filter(l=>l.includes(p)).slice(0,10);if(lines.length)console.error(lines.join('\\n'))}catch(e){const lines=(e.stdout||'').split('\\n').filter(l=>l.includes(p)).slice(0,10);if(lines.length)console.error(lines.join('\\n'))}}}console.log(d)})\""
    }
  ],
  "description": "TypeScript check after editing .ts/.tsx files"
}
```

### Example 5: Warn About console.log

```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx|js|jsx)$\"",
  "hooks": [
    {
      "type": "command",
      "command": "node -e \"const fs=require('fs');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const p=i.tool_input?.file_path;if(p&&fs.existsSync(p)){const c=fs.readFileSync(p,'utf8');const lines=c.split('\\n');const matches=[];lines.forEach((l,idx)=>{if(/console\\\\.log/.test(l))matches.push((idx+1)+': '+l.trim())});if(matches.length){console.error('[Hook] WARNING: console.log found in '+p);matches.slice(0,5).forEach(m=>console.error(m));console.error('[Hook] Remove console.log before committing')}}console.log(d)})\""
    }
  ],
  "description": "Warn about console.log statements after edits"
}
```

### Example 6: Block Random Documentation Files

```json
{
  "matcher": "tool == \"Write\" && tool_input.file_path matches \"\\\\.(md|txt)$\" && !(tool_input.file_path matches \"README\\\\.md|CLAUDE\\\\.md|AGENTS\\\\.md|CONTRIBUTING\\\\.md\")",
  "hooks": [
    {
      "type": "command",
      "command": "node -e \"const fs=require('fs');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const p=i.tool_input?.file_path||'';if(/\\\\.(md|txt)$/.test(p)&&!/(README|CLAUDE|AGENTS|CONTRIBUTING)\\\\.md$/.test(p)){console.error('[Hook] BLOCKED: Unnecessary documentation file creation');console.error('[Hook] File: '+p);console.error('[Hook] Use README.md for documentation instead');process.exit(1)}console.log(d)})\""
    }
  ],
  "description": "Block creation of random .md files - keeps docs consolidated"
}
```

## Creating Custom Hooks

### Step 1: Define Trigger

What event should trigger this hook?

```json
"matcher": "tool == \"Bash\" && tool_input.command matches \"custom\""
```

### Step 2: Choose Execution Method

Inline Node.js or script file?

**Inline (simple):**
```json
"command": "node -e \"console.error('message')\""
```

**Script (complex):**
```json
"command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/my-hook.cjs\""
```

### Step 3: Implement Logic

For inline:
```javascript
node -e "console.error('My message'); process.exit(0)"
```

For script file:
```javascript
// scripts/hooks/my-hook.cjs
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  const input = JSON.parse(data);
  // Do something with input
  console.error('[Hook] Action taken');
  console.log(data);
});
```

### Step 4: Add to hooks.json

```json
{
  "matcher": "...",
  "hooks": [ { "type": "command", "command": "..." } ],
  "description": "What this hook does"
}
```

### Step 5: Test

Trigger the hook and verify it works:
- Check execution
- Verify output
- Confirm side effects

## Hook Best Practices

### 1. Keep Hooks Fast
- Avoid heavy operations
- Minimize subprocess calls
- Target specific conditions

**Good:**
```json
"matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.ts$\""
```

**Bad:**
```json
"matcher": "*"  // Runs on every tool use
```

### 2. Clear Descriptions
```json
"description": "Auto-format TypeScript files after editing"
```

### 3. Use Meaningful Error Output
```javascript
console.error('[Hook] WARNING: Issue detected');
```

### 4. Always Return Data
For PostToolUse hooks, always output the original data:
```javascript
console.log(data);  // Return unmodified input
```

### 5. Handle Errors Gracefully
```javascript
try {
  // Hook logic
} catch (error) {
  console.error('[Hook] Error:', error.message);
  // Continue or fail gracefully
}
```

### 6. Specific Matchers
Use specific matchers to avoid unnecessary execution:

```json
// Good - specific
"matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.ts$\""

// Bad - too general
"matcher": "tool == \"Edit\""
```

### 7. Document Input/Output

If writing script files, document what data the hook receives:

```javascript
/**
 * Receives stdin with format:
 * {
 *   "tool": "Bash",
 *   "tool_input": { "command": "..." },
 *   "tool_output": { "output": "...", "exit_code": 0 }
 * }
 */
```

## Troubleshooting Hooks

### Hook Not Running

1. Check matcher syntax (CEL expression)
2. Verify tool name spelling
3. Test with `*` matcher to confirm hook fires
4. Check hook array structure

### Hook Blocking Operations

Only PreToolUse can block. For others:
- Remove blocking logic
- Use process.exit(1) only in PreToolUse
- Use console.error for warnings in PostToolUse

### Slow Operations

- Reduce subprocess calls
- Cache results
- Use more specific matchers
- Move complex logic to script files

## Performance Considerations

### Hook Overhead
- Each hook adds latency
- Inline scripts: ~10-50ms
- File-based scripts: ~20-100ms
- Subprocess calls: ~50-500ms

### Optimization Tips
1. **Batch operations:** Combine multiple checks
2. **Lazy evaluation:** Only compute when needed
3. **Cache results:** Reuse expensive computations
4. **Minimize I/O:** Reduce file system access
5. **Use specific matchers:** Avoid unnecessary execution

## Environment Variables

Hooks have access to:
- `CLAUDE_PLUGIN_ROOT` - Plugin root directory
- `PWD` - Current working directory
- All system environment variables

Use in commands:
```json
"command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/script.cjs\""
```

## Security Considerations

### 1. Avoid Injection Attacks
Don't use unsanitized input in shell commands:

```javascript
// Bad
execSync(`command ${userInput}`);

// Good
execSync('command', { shell: '/bin/bash', timeout: 5000 });
```

### 2. Timeout Operations
```javascript
execSync('command', { timeout: 5000 }); // 5 second timeout
```

### 3. Validate File Paths
```javascript
const fs = require('fs');
if (!fs.existsSync(filePath)) return;
```

---

**Last Updated:** 2025-01-27
**Version:** 2.0.0
