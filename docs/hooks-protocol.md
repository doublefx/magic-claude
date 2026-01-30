# Claude Code Hooks Protocol

## Overview

This document describes the capabilities and limitations of Claude Code's hook matcher system, based on research conducted for the Enterprise Stack Extension project (PRD v2.1).

**Key Finding**: Hook matchers support only basic string/regex patterns. Complex conditional logic must be implemented via runtime filtering in hook scripts.

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

  // Detect project types (uses cached .claude/everything-claude-code.project-type.json)
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

### 2. Error Reporting

- Use `console.error()` for warnings and advisories (shown to user)
- Use `process.exit(1)` to block tool execution
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

### 3. Performance Considerations

- Hooks run synchronously before/after each tool use
- Keep hooks fast (<100ms ideally)
- Use caching for expensive operations (e.g., project type detection)
- Gracefully handle missing tools (don't error, just skip)

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

**Hook Matcher Capabilities** (PRD v2.1):
- ✅ Tool name matching with regex
- ✅ Simple field comparisons with `matches`
- ✅ Boolean AND (`&&`) operator
- ❌ Function calls, property access, complex expressions

**Solution**: Runtime filtering in hook scripts
- Simple matchers in hooks.json
- Complex logic in JavaScript hook files
- Project detection with caching
- Graceful degradation when tools missing

**Protocol Requirements**:
- Read JSON context from stdin
- Write JSON context to stdout (pass through)
- Use stderr for user messages
- Exit with code 1 to block execution

---

**References**:
- PRD v2.1: `/docs/prd/PRD-enterprise-stack-extension.md` (lines 317-453)
- Current hooks: `/hooks/hooks.json`
- Implementation plan: `/docs/prd/IMPLEMENTATION-EXECUTION-PLAN.md`
