---
name: jvm-coding-standards
description: JVM coding standards and best practices for Java, Kotlin, and Groovy development. Covers Google Java Style, Kotlin idioms, null safety, concurrency, and enterprise patterns.
context: fork
agent: general-purpose
---

# JVM Coding Standards

Universal coding standards and best practices for Java, Kotlin, and Groovy development.

## When to Activate

- Writing new JVM code
- Reviewing JVM code quality
- Enforcing consistent coding style
- Setting up new JVM projects

## Java Standards (Google Java Style)

### Naming Conventions
- Classes: `UpperCamelCase` (e.g., `OrderService`)
- Methods/variables: `lowerCamelCase` (e.g., `calculateTotal`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`)
- Packages: `all.lowercase` (e.g., `com.example.service`)

### Immutability
```java
// PREFER: Immutable records (Java 16+)
public record OrderItem(String name, int quantity, BigDecimal price) {}

// PREFER: Final fields
private final String name;

// PREFER: Unmodifiable collections
List<String> items = List.of("a", "b", "c");
Map<String, Integer> map = Map.of("key", 1);
```

### Null Safety
```java
// Use Optional for return types that may be absent
public Optional<User> findById(Long id) { ... }

// Use @Nullable/@NonNull annotations
public void process(@NonNull String input) { ... }

// NEVER return null from collections - return empty
public List<Order> findOrders() {
    return orders != null ? orders : List.of();
}
```

### Error Handling
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

## Kotlin Standards

### Idiomatic Kotlin
```kotlin
// Data classes for DTOs
data class User(val name: String, val email: String)

// Extension functions for utility
fun String.isValidEmail(): Boolean = matches(Regex("^[\\w.]+@[\\w.]+$"))

// Scope functions: let, run, with, apply, also
user?.let { sendEmail(it.email) }

// Sealed classes for exhaustive when
sealed class Result {
    data class Success(val data: String) : Result()
    data class Error(val message: String) : Result()
}
```

### Null Safety
```kotlin
// PREFER: Non-nullable types
val name: String = "Alice"  // Cannot be null

// Use safe calls for nullable
val length = name?.length ?: 0

// AVOID: !! (non-null assertion)
// WRONG: user!!.name
// CORRECT: user?.name ?: throw IllegalStateException("User required")
```

### Coroutines
```kotlin
// Use structured concurrency
suspend fun fetchData(): Result = coroutineScope {
    val users = async { userService.getAll() }
    val orders = async { orderService.getAll() }
    Result(users.await(), orders.await())
}
```

## Design Principles

### SOLID

**S — Single Responsibility:**
```java
// GOOD: Each class has one reason to change
@Service class OrderService { ... }      // business logic
@Repository class OrderRepository { ... } // data access
@Component class OrderValidator { ... }    // validation
```

**O — Open/Closed:**
```java
// GOOD: Strategy pattern — extend by adding implementations, not modifying
interface PricingStrategy { BigDecimal calculate(Order order); }
class StandardPricing implements PricingStrategy { ... }
class DiscountPricing implements PricingStrategy { ... }
// Add new pricing without modifying existing code
```

**L — Liskov Substitution:**
```java
// GOOD: Subtypes are substitutable
interface Shape { double area(); }
class Circle implements Shape { double area() { return PI * r * r; } }
class Square implements Shape { double area() { return side * side; } }
// Any Shape works anywhere Shape is expected
```

**I — Interface Segregation:**
```java
// GOOD: Focused interfaces
interface Readable { byte[] read(String key); }
interface Writable { void write(String key, byte[] data); }
// Consumers depend only on what they need

// BAD: Fat interface
interface Storage { byte[] read(String k); void write(String k, byte[] d); void delete(String k); List<String> list(); }
```

**D — Dependency Inversion:**
```java
// GOOD: Constructor injection with interfaces
@Service
class OrderService {
  private final OrderRepository repository;  // interface, not JpaRepository
  OrderService(OrderRepository repository) { this.repository = repository; }
}
```

### DRY
- Extract shared logic to utility classes or base classes
- Use generics to avoid type-specific duplication
- Shared validation/conversion logic belongs in dedicated components

### YAGNI
- Don't add unused service methods "for completeness"
- Don't create abstractions until you have 2+ concrete implementations
- Prefer direct calls over event bus until you need decoupling

## General Principles

### File Organization
- 200-400 lines typical, 800 max per file
- One top-level class per file (Java)
- Group by feature/domain, not by type

### BigDecimal for Money
```java
// NEVER use float/double for money
BigDecimal price = new BigDecimal("9.99");  // String constructor!
BigDecimal total = price.multiply(BigDecimal.valueOf(quantity));
```

### Testing
- JUnit 5 (not JUnit 4)
- AssertJ (not Hamcrest)
- MockK for Kotlin, Mockito for Java
- @DisplayName on all tests
- 80%+ coverage (JaCoCo)

## Resources
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html)
