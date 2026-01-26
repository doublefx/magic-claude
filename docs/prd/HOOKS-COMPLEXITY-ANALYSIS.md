# Hooks Implementation Complexity Analysis

**Status**: ✅ RESOLVED - Investigation Complete (2026-01-25)

**Resolution**: Agent research confirmed Claude Code matchers support **only basic string/regex patterns**. PRD v2.1 updated to use **runtime filtering** approach (Option B). No expression evaluator exists or needed.

**PRD Updates**:
- Section 2 "Conditional Hook System" - Replaced expression evaluator with runtime filtering implementation
- Phase 1 tasks (P1-00 through P1-08) - Updated to reflect smart hook scripts
- Technology Stack - Removed `expr-eval`, added "Runtime JS scripts"
- Timeline - Unchanged (8 days Phase 1)

---

## Critical Issue: Expression Evaluator May Not Exist (HISTORICAL)

### Current Hook System (Existing)

Looking at `hooks/hooks.json`, the current matcher syntax is:

```json
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"pattern\""
}
```

**Key observations:**
1. Uses `==` for equality checks
2. Uses `matches` keyword for regex matching
3. Uses `&&` for boolean AND
4. Accesses nested properties: `tool_input.command`

**Question**: Does Claude Code's hook system already have an expression evaluator?

### Proposed Enhancement (PRD v2.0)

The PRD proposes:
```json
{
  "matcher": "tool == 'Edit' && contains(project_types, 'python') && tool_input.file_path.endsWith('.py')"
}
```

**New requirements:**
1. `contains(array, value)` - Custom function
2. `endsWith()` - String method access
3. `project_types` - New variable injection
4. Expression evaluation library (`expr-eval`)

---

## Complexity Assessment

### Scenario 1: Claude Code Already Has Expression Evaluator

**If true:**
- ✅ **Low complexity** - Just need to:
  1. Inject `project_types` into evaluation context
  2. Register `contains()` function
  3. Update matchers in hooks.json

**Implementation**: 2-3 days in Phase 1

### Scenario 2: Claude Code Does NOT Have Expression Evaluator

**If true:**
- ⚠️ **HIGH complexity** - Need to:
  1. Build entire expression evaluation system
  2. Modify Claude Code's hook engine core
  3. Add context injection mechanism
  4. Implement security sandboxing
  5. Support backward compatibility with existing matchers

**Implementation**: 1-2 weeks (blocks Phase 1)

**This is a CORE SYSTEM MODIFICATION, not a plugin feature.**

---

## Investigation Required

### Questions to Answer

1. **Does `matches` keyword indicate existing expression evaluator?**
   - Or is it just regex string matching in the hook engine?

2. **Can matchers call functions?**
   - Current matchers only use operators (`==`, `&&`, `matches`)
   - None call functions like `contains()` or `endsWith()`

3. **Can matchers access methods?**
   - `tool_input.command` accesses properties
   - But can we call `tool_input.file_path.endsWith('.py')`?

4. **Is this a plugin-level feature or core Claude Code feature?**
   - Plugins can add hooks (JSON)
   - Plugins CANNOT modify the hook evaluation engine
   - **If expression evaluator doesn't exist, this requires Claude Code core changes**

---

## Risk Analysis

### HIGH RISK: Proposed Feature May Be Impossible at Plugin Level

**Problem**: If Claude Code's hook system doesn't support expression evaluation:
- We can't add it from a plugin
- Would require contributing to Claude Code core
- Timeline impact: +2-4 weeks for upstream contribution
- Dependency: Anthropic team acceptance and release cycle

**Mitigation Options**:

#### Option A: Fallback to Simple Matchers (RECOMMENDED)

Instead of complex expressions, use simpler approach:

**Separate hook files per project type:**
```
hooks/
  hooks.json          # Universal hooks (git, tmux)
  hooks-nodejs.json   # Auto-loaded when nodejs detected
  hooks-python.json   # Auto-loaded when python detected
  hooks-maven.json    # Auto-loaded when maven detected
```

**Pros:**
- ✅ No expression evaluator needed
- ✅ Works with existing Claude Code
- ✅ Simple to implement
- ✅ Easy to debug

**Cons:**
- ❌ More files to maintain
- ❌ Duplication across hook files

**Implementation:**
```javascript
// scripts/hooks/session-start.cjs
const { detectProjectType } = require('../detect-project-type');

function loadHooksForProject() {
  const types = detectProjectType(process.cwd());
  const hookFiles = ['hooks.json']; // Always load universal hooks

  // Add project-specific hooks
  if (types.includes('nodejs')) hookFiles.push('hooks-nodejs.json');
  if (types.includes('python')) hookFiles.push('hooks-python.json');
  if (types.includes('maven')) hookFiles.push('hooks-maven.json');

  // Tell Claude Code to load these hook files
  return hookFiles;
}
```

**Complexity**: Low (3-5 days in Phase 1)

#### Option B: Runtime Hook Filtering

Keep single `hooks.json`, but hooks check project type at runtime:

```json
{
  "matcher": "tool == 'Edit'",
  "hooks": [{
    "type": "command",
    "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/conditional-python-format.cjs\""
  }]
}
```

```javascript
// scripts/hooks/conditional-python-format.cjs
const { detectProjectType } = require('../detect-project-type');

const types = detectProjectType(process.cwd());

// Exit early if not a Python project
if (!types.includes('python')) {
  process.exit(0); // Success, but do nothing
}

// Get file path from stdin (hook context)
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  const context = JSON.parse(data);
  const filePath = context.tool_input?.file_path || '';

  // Only run on .py files
  if (filePath.endsWith('.py')) {
    // Run ruff format
    require('child_process').execSync(`ruff format ${filePath}`);
  }

  console.log(data); // Pass through
});
```

**Pros:**
- ✅ Single hooks.json file
- ✅ Works with existing Claude Code
- ✅ Flexible logic in scripts

**Cons:**
- ❌ Every hook runs detection (performance overhead)
- ❌ More complex hook scripts
- ❌ Harder to debug

**Complexity**: Medium (5-7 days in Phase 1)

#### Option C: Contribute Expression Evaluator to Claude Code Core

Work with Anthropic to add expression evaluation to Claude Code:

**Pros:**
- ✅ Best long-term solution
- ✅ Benefits entire Claude Code ecosystem
- ✅ Clean, declarative syntax

**Cons:**
- ❌ Depends on Anthropic acceptance
- ❌ Adds 4-8 weeks to timeline
- ❌ Out of our control
- ❌ Blocks Phase 1

**Not recommended for this PRD** (could be Phase 7+ enhancement)

---

## Recommendation

### Immediate Action: Verify Hook System Capabilities

**Before Phase 1 starts**, we MUST:

1. ✅ **Test current matcher capabilities**
   ```json
   {
     "matcher": "tool_input.file_path.endsWith('.py')",
     "hooks": [...]
   }
   ```
   Does this work? Or syntax error?

2. ✅ **Check for expression evaluator**
   - Review Claude Code documentation
   - Test function calls in matchers
   - Verify method access

3. ✅ **Decision point:**
   - If expression evaluator exists → Use Option from PRD
   - If not → **Fall back to Option A** (separate hook files)

### Updated PRD Recommendation

**Change Phase 1 to include investigation:**

| Task | Description | Effort | Acceptance Criteria |
|------|-------------|--------|---------------------|
| **P1-00** | **Investigate hook system capabilities** | **S** | **Document what matchers support (functions, methods, expressions)** |
| P1-01 | Create project type detection script | L | Detects multiple types, supports monorepos |
| P1-02 | Implement manifest hash-based caching | M | Stores in `.claude/project-type.json` |
| **P1-03** | **Implement chosen hook strategy** | **M-L** | **Based on P1-00 findings (expression eval OR separate files OR runtime filtering)** |
| P1-04 | Refactor existing hooks | L | JS/TS hooks only fire on nodejs projects |
| P1-05 | SessionStart hook for detection | S | Auto-detects project type |

**Effort adjustment**: +1 day for investigation

---

## Conclusion

**Critical Finding**: The PRD assumes an expression evaluator exists in Claude Code's hook system, but this is **unverified**.

**Impact if evaluator doesn't exist**:
- Cannot implement as specified in PRD
- Must use fallback approach (separate hook files or runtime filtering)
- Timeline not significantly impacted (1 day investigation + same implementation)
- Architecture slightly different but functionally equivalent

**Action Required**:
1. ✅ Add P1-00 investigation task
2. ✅ Document fallback strategies in PRD
3. ✅ Prepare separate hook file structure as backup plan

**Recommended Fallback** (if no expression evaluator):
**Option A - Separate hook files** for:
- Simplicity
- Performance
- Ease of debugging
- No runtime overhead

---

## Files to Update

1. **PRD-enterprise-stack-extension.md**
   - Add P1-00 investigation task
   - Document fallback strategies
   - Note that expression evaluator is conditional

2. **Phase 1 Deliverables**
   - Change from "expression-evaluator.js" to "hook strategy implementation"
   - Could be: expression evaluator OR hook file loader OR runtime filter

---

## Proposed PRD Section Addition

Add to "Design Decisions" section:

### Decision 2a: Hook Conditional Logic Implementation (Conditional)

**Investigation Required**: Claude Code's hook matcher capabilities must be verified before implementation.

**If expression evaluator exists**:
- Use `expr-eval` library with `contains()` function
- Inject `project_types` into evaluation context
- Single `hooks.json` with complex matchers

**If expression evaluator does NOT exist** (Fallback):
- Use separate hook files per project type
- `hooks-nodejs.json`, `hooks-python.json`, `hooks-maven.json`
- SessionStart hook loads relevant files based on detection
- Simpler matchers, no custom functions needed

**Decision**: Made in Phase 1 after investigating current capabilities.
