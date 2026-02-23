# Condition-Based Waiting

Replace arbitrary timeouts with condition polling to eliminate flaky tests.

## The Problem

Arbitrary timeouts (`sleep(500)`, `Thread.sleep(2000)`, `time.sleep(3)`) are wrong by construction:

- **Too short:** fails on slow machines, CI under load, or different hardware
- **Too long:** wastes time on every test run, compounds across the suite
- **Always wrong:** the actual operation duration is non-deterministic

## The Solution

Poll for the actual condition with a hard timeout ceiling:

```
// BAD: arbitrary timeout
await sleep(500);
expect(result).toBeDefined();

// GOOD: condition-based waiting
const result = await waitFor(() => getResult());
expect(result).toBeDefined();
```

## Generic `waitFor` Pattern

### TypeScript/JavaScript

```typescript
async function waitFor<T>(
  condition: () => T | Promise<T | null | undefined> | null | undefined,
  options: { timeout?: number; interval?: number; message?: string } = {}
): Promise<T> {
  const { timeout = 5000, interval = 50, message = 'Condition not met' } = options;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const result = await condition();
    if (result !== null && result !== undefined) return result;
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`waitFor timed out after ${timeout}ms: ${message}`);
}
```

### JVM (Java)

```java
// Using Awaitility (recommended)
import static org.awaitility.Awaitility.await;

await().atMost(Duration.ofSeconds(5))
       .pollInterval(Duration.ofMillis(50))
       .until(() -> repository.findById(id).isPresent());

// Manual implementation
public static <T> T waitFor(Supplier<Optional<T>> condition, Duration timeout) {
    long deadline = System.currentTimeMillis() + timeout.toMillis();
    while (System.currentTimeMillis() < deadline) {
        Optional<T> result = condition.get();
        if (result.isPresent()) return result.get();
        Thread.sleep(50);
    }
    throw new TimeoutException("Condition not met within " + timeout);
}
```

### Python

```python
import asyncio

async def wait_for(
    condition: Callable[[], Awaitable[T | None]],
    timeout: float = 5.0,
    interval: float = 0.05,
    message: str = "Condition not met"
) -> T:
    deadline = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < deadline:
        result = await condition()
        if result is not None:
            return result
        await asyncio.sleep(interval)
    raise TimeoutError(f"waitFor timed out after {timeout}s: {message}")
```

## Common Scenarios

| Anti-Pattern | Condition-Based Replacement |
|-------------|----------------------------|
| `await sleep(2000)` before DOM check | `await waitFor(() => page.querySelector('.loaded'))` |
| `Thread.sleep(5000)` for async processing | `await().until(() -> repo.findById(id).isPresent())` |
| `time.sleep(3)` for file write | `await wait_for(lambda: path.exists())` |
| `setTimeout(check, 1000)` for event | `await waitFor(() => events.find(e => e.type === 'done'))` |
| `sleep(500)` between retries | `await waitFor(() => service.isHealthy(), { timeout: 30000 })` |

## When Timeouts ARE Acceptable

Arbitrary timeouts are correct when the timeout IS the feature being tested:

- **Debounce behavior:** testing that a function fires after 300ms delay
- **Rate limiting:** testing that requests are throttled to N per second
- **Animation timing:** testing CSS transition completion
- **Retry backoff:** testing that retry delay increases exponentially

In these cases, **document WHY** the specific timeout value is correct:

```typescript
// Testing debounce: 300ms debounce + 50ms buffer for execution
await sleep(350); // Intentional: testing 300ms debounce behavior
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Polling too fast (1ms interval) | Use 50ms minimum to avoid CPU spin |
| No timeout ceiling | Always set a maximum wait (5-30s depending on operation) |
| Polling stale data | Ensure the condition function re-fetches (no cached reference) |
| Swallowing poll errors | Let unexpected errors propagate, only retry expected transient states |
