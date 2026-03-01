# Root Cause Tracing

Backward call stack analysis to find where correct state becomes incorrect.

## 5-Step Process

### Step 1: Capture the Full Error

Get the complete stack trace, error message, and surrounding log output. Do not truncate. The root cause clue is often in the middle of the trace, not the top.

### Step 2: Identify the Crash Site

Find the exact line where the error manifests. This is the SYMPTOM, not the cause.

- Stack trace top frame = crash site
- Assertion failure line = crash site
- If no stack trace: the last successful log entry brackets the crash site

### Step 3: Trace Backward

Starting at the crash site, work backward through the call chain. At each frame, ask:

> "Was the value correct at this point?"

- If YES: move to the next frame up (caller)
- If NO: the corruption happened between this frame and the one below

Add temporary assertions at each level to verify:

```
// TypeScript
console.assert(value !== undefined, `Expected value at ${caller}`);

// JVM
assert value != null : "Expected value at " + caller;

// Python
assert value is not None, f"Expected value at {caller}"
```

### Step 4: Find the Boundary

The transition point between "correct" and "incorrect" is the root cause location. Examine:

- What data flows into this point?
- What assumptions does this code make?
- What could change between the correct frame and the incorrect frame?
- Is there shared mutable state? A race condition? An environment assumption?

### Step 5: Verify the Root Cause

Add a targeted assertion at the boundary. Run the failing test.

- If the assertion fires BEFORE the original error: you found the root cause
- If the original error fires first: the root cause is further upstream -- return to Step 3

## When Stack Traces Are Missing

For async errors, swallowed exceptions, or silent failures:

| Situation | Strategy |
|-----------|----------|
| Async/Promise errors | Add `.catch(err => console.error('Async:', err))` at each boundary |
| Swallowed exceptions | Search for empty `catch` blocks along the data path |
| Silent wrong output | Add assertions on intermediate values (binary search the data flow) |
| Event-driven systems | Log event emission and reception with timestamps |

### Ecosystem-Specific Tracing Tools

**TypeScript/JavaScript:**
- `new Error().stack` for synthetic stack traces
- `--trace-warnings` flag for unhandled rejection traces
- `node --inspect` + Chrome DevTools for breakpoint debugging

**JVM (Java/Kotlin):**
- `Thread.currentThread().getStackTrace()` for programmatic traces
- `-verbose:gc` and `-XX:+PrintGCDetails` for GC-related issues
- `jstack <pid>` for thread dump analysis

**Python:**
- `traceback.print_stack()` for current stack
- `tracemalloc` for memory allocation tracing
- `python -X faulthandler` for segfault traces

## Common Root Cause Locations

| Symptom | Likely Root Cause Location |
|---------|---------------------------|
| NullPointerException / undefined | Missing null check at a data boundary |
| Wrong value in output | Transformation function with incorrect logic or stale input |
| Test passes alone, fails in suite | Shared mutable state (see `find-polluter.cjs`) |
| Intermittent failure | Race condition or timing dependency (see `condition-based-waiting.md`) |
| Works locally, fails in CI | Environment assumption (paths, env vars, timezone, locale) |
| Error after dependency update | Breaking change in transitive dependency |
