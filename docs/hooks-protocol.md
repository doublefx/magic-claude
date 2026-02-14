# Claude Code Hooks Protocol

## Overview

This document describes the capabilities and limitations of Claude Code's hook matcher system, based on research conducted for the Enterprise Stack Extension project (PRD v2.1).

**Key Finding**: Hook matchers support only basic string/regex patterns. Complex conditional logic must be implemented via runtime filtering in hook scripts.

### Hook Event Types (14 Total)

| Event | When It Fires | Matcher Support |
|-------|--------------|-----------------|
| `PreToolUse` | Before tool execution | Yes |
| `PostToolUse` | After successful tool execution | Yes |
| `PostToolUseFailure` | After tool execution fails | Yes |
| `PermissionRequest` | When permission is needed | Yes |
| `Notification` | When Claude needs user attention | Yes |
| `SubagentStart` | Before subagent launches | Yes |
| `SubagentStop` | After subagent completes | Yes |
| `UserPromptSubmit` | When user submits a prompt | Ignored (fires unconditionally) |
| `SessionStart` | When session begins | Yes |
| `SessionEnd` | When session ends | Yes |
| `PreCompact` | Before context compaction | Yes |
| `Setup` | During initial setup | Yes |
| `Stop` | When Claude stops responding | No |
| `TeammateIdle` | When Agent Teams teammate has no tasks | No |
| `TaskCompleted` | When a task is marked complete | No |

### Hook Handler Types (3 Types)

| Type | Description | Timeout Default |
|------|-------------|-----------------|
| `command` | Execute a shell command | 600s |
| `prompt` | Single LLM call (no tool access) | 30s |
| `agent` | Multi-turn subagent with tool access | 60s |

---

## Hook Matcher Capabilities

### ✅ Supported Features

1. **Tool Name Matching**
   - Simple tool name: `"Edit"`, `"Write"`, `"Bash"`
   - Wildcard: `"*"` (matches all tools)
   - Multiple tools: `"Edit|Write"` (OR logic)
   - Pattern matching: `"Notebook.*"` (matches NotebookEdit, NotebookExecute, etc.)

2. **Field Comparisons**
   - Equality check: `tool == "Edit"`
   - Regex matching: `tool_input.file_path matches "\\.ts$"`
   - Boolean AND: `tool == "Bash" && tool_input.command matches "npm"`

3. **Regex Patterns**
   - File extensions: `"\\.py$"`, `"\\.(ts|tsx|js|jsx)$"`
   - Command patterns: `"(npm|yarn|pnpm)"`
   - Complex regex: `"\\.(md|txt)$"` with escaping

### ❌ NOT Supported

1. **Function Calls**
   - `contains()`, `endsWith()`, `startsWith()`
   - `includes()`, `match()`, `test()`
   - Any JavaScript method invocation

2. **Property Access**
   - `tool_input.file_path.endsWith('.py')` ❌
   - `tool_input.command.includes('npm')` ❌
   - Chained property access

3. **Complex Expressions**
   - Boolean OR: `||` (use `|` in tool names instead)
   - Variable assignment
   - Array/object operations
   - Ternary operators

---

## Runtime Filtering Solution

Since matchers cannot evaluate complex conditions, **hook scripts perform runtime filtering** by:

1. Reading tool context from stdin
2. Detecting project types (cached)
3. Checking file extensions, commands, or other criteria
4. Executing appropriate actions conditionally
5. Passing through context to stdout (required by protocol)

### Example: Universal Formatter Hook

**Hook Configuration** (Simple Matcher):
```json
{
  "matcher": "Edit|Write",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/smart-formatter.cjs\""
    }
  ],
  "description": "Auto-format files based on project type"
}
```

**Hook Script** (Runtime Filtering):
```javascript
// scripts/hooks/smart-formatter.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { detectProjectType } = require('../lib/detect-project-type');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const context = JSON.parse(input);
  const filePath = context.tool_input?.file_path;

  if (!filePath) {
    // Not a file operation, pass through
    console.log(input);
    return;
  }

  // Detect project types (uses cached .claude/magic-claude.project-type.json)
  const projectTypes = detectProjectType(process.cwd());
  const ext = path.extname(filePath);

  // Python formatting (only if Python project)
  if (ext === '.py' && projectTypes.includes('python')) {
    if (commandExists('ruff')) {
      execSync(`ruff format "${filePath}"`, { stdio: 'inherit' });
    }
  }

  // TypeScript/JavaScript formatting (only if Node.js project)
  else if (['.ts', '.js', '.tsx', '.jsx'].includes(ext) && projectTypes.includes('nodejs')) {
    if (commandExists('prettier')) {
      execSync(`npx prettier --write "${filePath}"`, { stdio: 'inherit' });
    }
  }

  // REQUIRED: Pass through context to stdout
  console.log(input);
});

function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
```

---

## Hook Protocol Requirements

### 1. Input/Output Contract

**Input** (stdin):
```json
{
  "tool": "Edit",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "old_string": "...",
    "new_string": "..."
  },
  "tool_output": null
}
```

**Output** (stdout):
```json
{
  "tool": "Edit",
  "tool_input": {...},
  "tool_output": null
}
```

**CRITICAL**: Hooks MUST pass through the context to stdout, even if they make no modifications.

### 2. Error Reporting and Exit Codes

| Exit Code | Behavior |
|-----------|----------|
| `0` | Success -- continue execution |
| `1` | Block execution (PreToolUse, PermissionRequest only) |
| `2` | Block + feed stderr back as feedback (TeammateIdle, TaskCompleted -- prevents action, teammate/task continues working) |

- Use `console.error()` for warnings and advisories (shown to user)
- Use `process.exit(1)` to block tool execution
- Use `process.exit(2)` to block with feedback (Agent Teams quality gates)
- Errors on stderr are shown but don't block execution unless exit code is non-zero

**Example: Blocking Hook**
```javascript
if (shouldBlock) {
  console.error('[Hook] BLOCKED: Reason for blocking');
  process.exit(1); // Prevents tool execution
}
```

**Example: Advisory Hook**
```javascript
if (shouldWarn) {
  console.error('[Hook] WARNING: Consider alternative approach');
  // Continues execution
}
console.log(input); // Pass through
```

**Example: Quality Gate (Agent Teams)**
```javascript
// TeammateIdle or TaskCompleted hook
const testResult = execSync('npm test 2>&1', { encoding: 'utf8' });
if (testResult.includes('FAIL')) {
  console.error('Tests must pass before completing task');
  process.exit(2); // Blocks action, feeds back to teammate
}
```

### 3. Handler Fields

Each handler in the `hooks` array supports these fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `"command"`, `"prompt"`, or `"agent"` |
| `command` | string | For command type | Shell command to execute |
| `statusMessage` | string | No | Custom spinner message during execution |
| `async` | boolean | No | Run in background (command type only, non-blocking) |
| `timeout` | number | No | Override default timeout (ms) |
| `once` | boolean | No | Run only once per session |

**statusMessage Example:**
```json
{
  "type": "command",
  "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/smart-formatter.js\"",
  "statusMessage": "Formatting code..."
}
```

### 4. Performance Considerations

- Hooks run synchronously before/after each tool use (unless `async: true`)
- Keep hooks fast (<100ms ideally)
- Use caching for expensive operations (e.g., project type detection)
- Gracefully handle missing tools (don't error, just skip)
- Use `async: true` for non-critical hooks that can run in the background

---

## Current Hook Examples

### 1. Simple Tool Matcher
```json
{
  "matcher": "tool == \"Bash\"",
  "hooks": [{"type": "command", "command": "node script.js"}]
}
```

### 2. Tool with Regex
```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx)$\"",
  "hooks": [{"type": "command", "command": "node typescript-check.js"}]
}
```

### 3. Wildcard Matcher
```json
{
  "matcher": "*",
  "hooks": [{"type": "command", "command": "node session-start.js"}]
}
```

### 4. Complex Regex
```json
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm run dev|yarn dev|pnpm dev)\"",
  "hooks": [{"type": "command", "command": "node block-dev-server.js"}]
}
```

---

## Best Practices

### DO:
- ✅ Use simple matchers in hooks.json
- ✅ Implement complex logic in hook scripts
- ✅ Cache expensive operations (project detection)
- ✅ Check tool availability before running commands
- ✅ Always pass through context to stdout
- ✅ Use stderr for user-visible messages
- ✅ Handle edge cases gracefully (missing files, etc.)

### DON'T:
- ❌ Try to use function calls in matchers
- ❌ Access object properties in matchers
- ❌ Forget to pass through context
- ❌ Run slow operations without caching
- ❌ Assume tools are installed
- ❌ Block execution without clear error messages

---

## Testing Hooks

Use the HookTestHarness to test hook scripts:

```javascript
import { HookTestHarness } from '../harnesses/HookTestHarness.js';

describe('smart-formatter', () => {
  it('should format Python files in Python projects', async () => {
    const harness = new HookTestHarness('/path/to/smart-formatter.js');

    const input = {
      tool: 'Edit',
      tool_input: { file_path: '/path/to/file.py' },
      tool_output: null
    };

    const { stdout, stderr, exitCode } = await harness.execute(input, {
      cwd: '/path/to/python-project'
    });

    expect(exitCode).toBe(0);
    expect(stderr).toContain('ruff format'); // Or check for format action
    expect(JSON.parse(stdout)).toEqual(input); // Pass through verified
  });
});
```

---

## Summary

**Hook Event Types** (14 total):
- PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, Notification
- SubagentStart, SubagentStop, UserPromptSubmit, SessionStart, SessionEnd
- PreCompact, Setup, Stop, TeammateIdle, TaskCompleted

**Hook Handler Types** (3 types):
- `command` (shell execution, 600s default timeout)
- `prompt` (single LLM call, 30s default timeout)
- `agent` (multi-turn subagent, 60s default timeout)

**Hook Matcher Capabilities**:
- ✅ Tool name matching with regex
- ✅ Simple field comparisons with `matches`
- ✅ Boolean AND (`&&`) operator
- ❌ Function calls, property access, complex expressions
- Note: Some events (Stop, TeammateIdle, TaskCompleted) don't support matchers

**Solution**: Runtime filtering in hook scripts
- Simple matchers in hooks.json
- Complex logic in JavaScript hook files
- Project detection with caching
- Graceful degradation when tools missing

**Protocol Requirements**:
- Read JSON context from stdin
- Write JSON context to stdout (pass through)
- Use stderr for user messages
- Exit code 0 = success, 1 = block, 2 = block with feedback
- Use `statusMessage` for custom spinner text during hook execution

---

**References**:
- Official hooks documentation: https://docs.anthropic.com/en/docs/claude-code/hooks
- Current hooks: `/hooks/hooks.json`
- Hook validation tests: `/tests/hooks/hooks.test.cjs`
- Plugin dev reference: `/docs/PLUGIN_DEVELOPMENT/03-HOOKS.md`
