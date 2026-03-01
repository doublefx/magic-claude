# Coding Style

## Immutability (CRITICAL - All Ecosystems)

ALWAYS create new objects, NEVER mutate:

### TypeScript/JavaScript
```javascript
// WRONG: Mutation
function updateUser(user, name) {
  user.name = name  // MUTATION!
  return user
}

// CORRECT: Immutability
function updateUser(user, name) {
  return {
    ...user,
    name
  }
}
```

### JVM (Java/Kotlin)
```java
// PREFER: Immutable records (Java 16+)
public record OrderItem(String name, int quantity, BigDecimal price) {}

// PREFER: Final fields
private final String name;

// PREFER: Unmodifiable collections
List<String> items = List.of("a", "b", "c");
```

```kotlin
// PREFER: val over var
val name: String = "Alice"

// PREFER: data class (immutable by default with val)
data class User(val name: String, val email: String)
```

### Python
```python
# PREFER: Frozen dataclasses
@dataclass(frozen=True, slots=True)
class OrderItem:
    name: str
    quantity: int
    price: Decimal

# PREFER: Frozen Pydantic models
class User(BaseModel):
    model_config = ConfigDict(frozen=True)
    name: str
    email: EmailStr

# PREFER: Tuples over lists for fixed collections
ALLOWED_STATUSES = ("active", "pending", "closed")
```

## File Organization

MANY SMALL FILES > FEW LARGE FILES:
- High cohesion, low coupling
- 200-400 lines typical, 800 max
- Extract utilities from large components
- Organize by feature/domain, not by type

## Error Handling

ALWAYS handle errors comprehensively:

### TypeScript/JavaScript
```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('Detailed user-friendly message')
}
```

### JVM
```java
// Specific exceptions, not generic
throw new OrderNotFoundException("Order " + id + " not found");

// Try-with-resources for AutoCloseable
try (var connection = dataSource.getConnection()) {
    // use connection
}

// Don't catch and ignore
// WRONG: catch (Exception e) { }
// CORRECT: catch (Exception e) { log.error("Failed", e); throw e; }
```

### Python
```python
# Specific exceptions, not generic
class OrderNotFoundError(Exception):
    def __init__(self, order_id: int) -> None:
        super().__init__(f"Order {order_id} not found")

# Context managers for resources
with open(path) as f:
    data = f.read()

# Don't catch and ignore
# WRONG: except Exception: pass
# CORRECT: except Exception: logger.exception("Failed"); raise
```

## Input Validation

ALWAYS validate user input:

### TypeScript/JavaScript
```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

### JVM (Bean Validation)
```java
public record CreateOrderRequest(
    @NotNull @Size(min = 1) List<OrderItemRequest> items,
    @Size(max = 500) String notes
) {}
```

### Python (Pydantic)
```python
class CreateOrderRequest(BaseModel):
    items: list[OrderItemRequest] = Field(min_length=1)
    notes: str = Field(default="", max_length=500)
```

## Debug Statement Checks

Remove debug statements before committing:

| Ecosystem | Debug Statements to Remove |
|-----------|---------------------------|
| TypeScript/JavaScript | `console.log`, `console.debug`, `debugger` |
| JVM (Java/Kotlin) | `System.out.println`, `System.err.println`, `e.printStackTrace()` |
| Python | `print()`, `breakpoint()`, `pdb.set_trace()` |

## Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No debug statements (console.log, print(), System.out.println)
- [ ] No hardcoded values
- [ ] No mutation (immutable patterns used)
