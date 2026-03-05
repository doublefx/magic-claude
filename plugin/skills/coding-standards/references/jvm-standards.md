# JVM (Java / Kotlin / Groovy) — Coding Standards

**Style guides:** Google Java Style, Kotlin Coding Conventions

## Naming Conventions

- Classes: `UpperCamelCase` (`OrderService`)
- Methods/variables: `lowerCamelCase` (`calculateTotal`)
- Constants: `UPPER_SNAKE_CASE` (`MAX_RETRY_COUNT`)
- Packages: `all.lowercase` (`com.example.service`)
- Kotlin: prefer `val` over `var`; use data classes for DTOs

## Immutability

```java
// Java: Immutable records (Java 16+)
public record OrderItem(String name, int quantity, BigDecimal price) {}

// Unmodifiable collections
List<String> items = List.of("a", "b", "c");
Map<String, Integer> map = Map.of("key", 1);
```

```kotlin
// Kotlin: val + data class
data class User(val name: String, val email: String)
```

## Null Safety

```java
// Return Optional, not null
public Optional<User> findById(Long id) { ... }

// Annotate nullable/non-null
public void process(@NonNull String input) { ... }

// Return empty collection, never null
public List<Order> findOrders() {
    return orders != null ? orders : List.of();
}
```

```kotlin
// Use safe calls and Elvis
val length = name?.length ?: 0

// AVOID !!  — throw explicitly instead
val name = user?.name ?: throw IllegalStateException("User required")
```

## Error Handling

```java
// Specific exceptions
throw new OrderNotFoundException("Order " + id + " not found");

// Try-with-resources for AutoCloseable
try (var connection = dataSource.getConnection()) {
    // use connection
}

// WRONG: catch (Exception e) { }
// CORRECT: catch (Exception e) { log.error("Failed", e); throw e; }
```

## Kotlin Idioms

```kotlin
// Scope functions
user?.let { sendEmail(it.email) }

// Sealed classes for exhaustive when
sealed class Result {
    data class Success(val data: String) : Result()
    data class Error(val message: String) : Result()
}

// Coroutines: structured concurrency
suspend fun fetchData() = coroutineScope {
    val users = async { userService.getAll() }
    val orders = async { orderService.getAll() }
    Result(users.await(), orders.await())
}
```

## SOLID (JVM Examples)

**S — Single Responsibility:**
```java
@Service class OrderService { ... }       // business logic
@Repository class OrderRepository { ... } // data access
@Component class OrderValidator { ... }   // validation
```

**O — Open/Closed (Strategy Pattern):**
```java
interface PricingStrategy { BigDecimal calculate(Order order); }
class StandardPricing implements PricingStrategy { ... }
class DiscountPricing implements PricingStrategy { ... }
```

**I — Interface Segregation:**
```java
interface Readable { byte[] read(String key); }
interface Writable { void write(String key, byte[] data); }
// Consumers depend only on what they need
```

**D — Dependency Inversion:**
```java
@Service
class OrderService {
    private final OrderRepository repository; // interface, not JpaRepository
    OrderService(OrderRepository repository) { this.repository = repository; }
}
```

## Money: Always BigDecimal

```java
// NEVER float/double for money
BigDecimal price = new BigDecimal("9.99");  // String constructor!
BigDecimal total = price.multiply(BigDecimal.valueOf(quantity));
```

## File Organization

- One top-level class per file (Java)
- 200–400 lines typical, 800 max
- Group by feature/domain, not by type

## Testing

- JUnit 5 (not JUnit 4), AssertJ (not Hamcrest)
- MockK for Kotlin, Mockito for Java
- `@DisplayName` on all tests
- 80%+ coverage (JaCoCo)

## Common Mistakes

| Wrong | Correct |
|-------|---------|
| `float`/`double` for money | `BigDecimal` with string constructor |
| Return `null` for absent values | Return `Optional<T>` |
| `catch (Exception e) {}` | `log.error("...", e); throw e;` |
| Raw `new Thread()` | `ExecutorService` or coroutines |
| Mutable static fields | Immutable records / `List.of()` |
