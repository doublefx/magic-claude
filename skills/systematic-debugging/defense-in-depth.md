# Defense in Depth

Multi-layer validation architecture to prevent bugs from propagating. A single validation point can be bypassed by different code paths, refactoring, or mocked tests. Validate at every layer data passes through.

## The Four Layers

### Layer 1: Entry Point Validation

Reject invalid input at API/function boundaries. Fail fast with clear error messages.

**TypeScript/JavaScript:**
```typescript
function processOrder(order: unknown): OrderResult {
  const validated = OrderSchema.parse(order); // Zod validation
  // ...
}
```

**JVM (Java/Kotlin):**
```java
public OrderResult processOrder(@NotNull @Valid CreateOrderRequest request) {
  Objects.requireNonNull(request.items(), "Items required");
  // ...
}
```

**Python:**
```python
def process_order(request: CreateOrderRequest) -> OrderResult:
    # Pydantic validates on construction
    validated = CreateOrderRequest(**request.model_dump())
```

### Layer 2: Business Logic Guards

Invariant checks within business logic. Assert preconditions. Never trust upstream validation alone.

```
// Before: trusts that caller validated
function calculateDiscount(price, percentage) {
  return price * (percentage / 100);
}

// After: defends its own invariants
function calculateDiscount(price, percentage) {
  if (price < 0) throw new Error(`Invalid price: ${price}`);
  if (percentage < 0 || percentage > 100) throw new Error(`Invalid percentage: ${percentage}`);
  return price * (percentage / 100);
}
```

### Layer 3: Environment Guards

Runtime environment validation. Prevent dangerous operations in wrong contexts.

- Check required env vars on startup (not at first use)
- Validate external service connectivity during health checks
- Guard destructive operations: refuse `git init` outside designated directories in tests
- Verify file system permissions before write operations

```
// Test safety guard
if (process.env.NODE_ENV === 'test' && !workDir.startsWith(tmpDir)) {
  throw new Error(`Refusing write outside temp dir in test: ${workDir}`);
}
```

### Layer 4: Debug Instrumentation

Temporary instrumentation for investigation. Add when other layers fail to catch a bug.

- Structured logging at boundaries (entry/exit of key functions)
- Timing measurements for performance bugs
- State snapshots before/after critical operations
- Stack trace capture at suspicious mutation points

**Remove after the bug is fixed.** Instrumentation is diagnostic, not permanent.

## When to Add Layers

After finding a root cause, assess which layer was missing:

| Root Cause Type | Missing Layer | Action |
|----------------|---------------|--------|
| Invalid input reached business logic | Layer 1 (Entry Point) | Add schema validation at the boundary |
| Business logic assumed valid state | Layer 2 (Guards) | Add precondition assertions |
| Wrong environment/config at runtime | Layer 3 (Environment) | Add startup validation |
| Bug only visible with logging | Layer 4 (Instrumentation) | Add permanent structured logging (if recurring pattern) |

## Anti-Pattern: Single-Point Validation

One validation check is never enough because:

1. **Different code paths** bypass the single check
2. **Refactoring** moves or removes the check
3. **Mocks in tests** skip the check entirely
4. **Upstream changes** alter what reaches the check

Each layer is independent -- if one fails, the others still protect the system.
