# Java Style Guidelines

This document defines Java coding standards based on **Google Java Style Guide** with additional enterprise security practices.

## Formatting (Google Java Style)

### Indentation
- **2 spaces** per indentation level
- **NO tabs**
- Continuation indent: 4 spaces

```java
// GOOD
public class Example {
  public void method() {
    if (condition) {
      doSomething();
    }
  }
}

// BAD - Using tabs or 4 spaces
public class Example {
    public void method() {
        if (condition) {
            doSomething();
        }
    }
}
```

### Line Length
- **Maximum 100 characters** per line
- Break long lines at logical points

```java
// GOOD - Proper line breaking
String message = String.format(
    "User %s with email %s was created at %s",
    user.getName(),
    user.getEmail(),
    user.getCreatedAt()
);

// BAD - Line too long
String message = String.format("User %s with email %s was created at %s", user.getName(), user.getEmail(), user.getCreatedAt());
```

### Braces
- **K&R style** (opening brace on same line)
- Always use braces, even for single-statement blocks

```java
// GOOD
if (condition) {
  doSomething();
}

// BAD - Omitting braces
if (condition)
  doSomething();
```

### Imports
- No wildcard imports (`import java.util.*`)
- Organize imports: static imports, then regular imports
- IDE auto-organize preferred

```java
// GOOD
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

// BAD
import java.util.*;
```

## Naming Conventions

### Classes and Interfaces
- **PascalCase**
- Noun or noun phrase
- Interface names should not have "I" prefix

```java
// GOOD
public class UserService { }
public interface PaymentProcessor { }
public class OrderBuilder { }

// BAD
public class user_service { }
public interface IPaymentProcessor { }  // No "I" prefix
```

### Methods
- **camelCase**
- Verb or verb phrase

```java
// GOOD
public void calculateTotal() { }
public boolean isValid() { }
public User findUser(String id) { }

// BAD
public void CalculateTotal() { }
public void find_user(String id) { }
```

### Variables
- **camelCase**
- Descriptive names (no single letters except loop counters)

```java
// GOOD
int userCount;
String emailAddress;
List<Order> activeOrders;

// BAD
int uc;
String e;
List<Order> list;
```

### Constants
- **UPPER_SNAKE_CASE**
- `static final` fields

```java
// GOOD
public static final int MAX_RETRIES = 3;
public static final String API_BASE_URL = "https://api.example.com";

// BAD
public static final int maxRetries = 3;
```

## Null Safety (Critical)

### Use Optional for Nullable Returns

```java
// GOOD - Clear contract that result might be absent
public Optional<User> findUserById(String id) {
  User user = repository.findById(id);
  return Optional.ofNullable(user);
}

// BAD - Unclear if null is expected
public User findUserById(String id) {
  return repository.findById(id);  // May return null
}
```

### Use Annotations

Use `@NonNull` and `@Nullable` from `org.checkerframework.checker.nullness.qual`:

```java
import org.checkerframework.checker.nullness.qual.NonNull;
import org.checkerframework.checker.nullness.qual.Nullable;

public class UserService {
  public @NonNull User createUser(@NonNull String email) {
    // Guaranteed non-null return
  }

  public @Nullable String getMiddleName(@NonNull User user) {
    // May return null
  }
}
```

### Defensive Null Checks

```java
// GOOD - Validate at method boundaries
public void processOrder(@NonNull Order order) {
  Objects.requireNonNull(order, "Order cannot be null");
  // Process order
}

// GOOD - Use Optional for operations
user.getEmail()
    .map(String::toLowerCase)
    .ifPresent(email -> sendEmail(email));
```

## Concurrency (Thread Safety)

### Use Proper Synchronization

```java
// GOOD - Thread-safe with ConcurrentHashMap
private final Map<String, User> cache = new ConcurrentHashMap<>();

// GOOD - Synchronized method
public synchronized void updateCount() {
  count++;
}

// BAD - Unsynchronized access to shared state
private Map<String, User> cache = new HashMap<>();  // Not thread-safe
```

### Prefer ExecutorService over Thread

```java
// GOOD - Managed thread pool
ExecutorService executor = Executors.newFixedThreadPool(10);
executor.submit(() -> processTask());
executor.shutdown();

// BAD - Raw thread creation
new Thread(() -> processTask()).start();
```

### Use CompletableFuture for Async

```java
// GOOD - Modern async programming
public CompletableFuture<User> fetchUserAsync(String id) {
  return CompletableFuture.supplyAsync(() -> {
    return userRepository.findById(id);
  }, executor);
}
```

## Security (Layered Approach)

### SQL Injection Prevention

```java
// GOOD - PreparedStatement with parameters
String sql = "SELECT * FROM users WHERE email = ?";
PreparedStatement stmt = connection.prepareStatement(sql);
stmt.setString(1, email);
ResultSet rs = stmt.executeQuery();

// BAD - String concatenation
String sql = "SELECT * FROM users WHERE email = '" + email + "'";  // SQL injection!
```

### No Hardcoded Credentials

```java
// GOOD - Environment variables or configuration
String apiKey = System.getenv("API_KEY");
String dbPassword = config.getProperty("db.password");

// BAD - Hardcoded secrets
String apiKey = "sk-abc123def456";  // Security risk!
```

### Input Validation

```java
// GOOD - Validate all user inputs
public void updateUserAge(int age) {
  if (age < 0 || age > 150) {
    throw new IllegalArgumentException("Invalid age: " + age);
  }
  // Process
}

// GOOD - Email validation
private static final Pattern EMAIL_PATTERN =
    Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

public boolean isValidEmail(String email) {
  return email != null && EMAIL_PATTERN.matcher(email).matches();
}
```

### Secure Random

```java
// GOOD - Cryptographically secure random
SecureRandom random = new SecureRandom();
byte[] token = new byte[32];
random.nextBytes(token);

// BAD - Predictable random (not for security)
Random random = new Random();  // Don't use for tokens/passwords
```

## Best Practices

### Try-With-Resources (Critical)

Always use try-with-resources for `AutoCloseable` resources:

```java
// GOOD - Automatic resource management
try (Connection conn = dataSource.getConnection();
     PreparedStatement stmt = conn.prepareStatement(sql)) {
  ResultSet rs = stmt.executeQuery();
  // Process results
}  // Resources closed automatically

// BAD - Manual resource management (error-prone)
Connection conn = null;
try {
  conn = dataSource.getConnection();
  // Use connection
} finally {
  if (conn != null) {
    conn.close();  // May throw exception
  }
}
```

### Immutability

Prefer immutable objects:

```java
// GOOD - Immutable class
public final class User {
  private final String id;
  private final String email;
  private final LocalDate createdAt;

  public User(String id, String email, LocalDate createdAt) {
    this.id = id;
    this.email = email;
    this.createdAt = createdAt;
  }

  // Only getters, no setters
  public String getId() { return id; }
  public String getEmail() { return email; }
  public LocalDate getCreatedAt() { return createdAt; }

  // Return new instance for modifications
  public User withEmail(String newEmail) {
    return new User(this.id, newEmail, this.createdAt);
  }
}
```

### Builder Pattern

For classes with many parameters:

```java
// GOOD - Builder pattern
public class Report {
  private final String title;
  private final String author;
  private final LocalDate date;
  private final List<String> sections;

  private Report(Builder builder) {
    this.title = builder.title;
    this.author = builder.author;
    this.date = builder.date;
    this.sections = builder.sections;
  }

  public static class Builder {
    private String title;
    private String author;
    private LocalDate date = LocalDate.now();
    private List<String> sections = new ArrayList<>();

    public Builder title(String title) {
      this.title = title;
      return this;
    }

    public Builder author(String author) {
      this.author = author;
      return this;
    }

    public Builder date(LocalDate date) {
      this.date = date;
      return this;
    }

    public Builder addSection(String section) {
      this.sections.add(section);
      return this;
    }

    public Report build() {
      Objects.requireNonNull(title, "Title is required");
      Objects.requireNonNull(author, "Author is required");
      return new Report(this);
    }
  }
}

// Usage
Report report = new Report.Builder()
    .title("Q4 Results")
    .author("John Doe")
    .addSection("Introduction")
    .addSection("Results")
    .build();
```

### Streams Over Loops

Use Stream API for collection operations:

```java
// GOOD - Streams (functional)
List<String> activeUserNames = users.stream()
    .filter(User::isActive)
    .map(User::getName)
    .sorted()
    .collect(Collectors.toList());

// ACCEPTABLE - Traditional loop (simpler cases)
List<String> activeUserNames = new ArrayList<>();
for (User user : users) {
  if (user.isActive()) {
    activeUserNames.add(user.getName());
  }
}
```

### Proper Exception Handling

```java
// GOOD - Specific exception with context
public User findUser(String id) throws UserNotFoundException {
  User user = repository.findById(id);
  if (user == null) {
    throw new UserNotFoundException("User not found: " + id);
  }
  return user;
}

// BAD - Swallowing exceptions
try {
  riskyOperation();
} catch (Exception e) {
  // Silent failure - very bad!
}

// BAD - Generic exception
public void doSomething() throws Exception {  // Too generic
  // ...
}
```

### Equals and HashCode

Always override both together:

```java
// GOOD - Proper implementation
@Override
public boolean equals(Object o) {
  if (this == o) return true;
  if (o == null || getClass() != o.getClass()) return false;
  User user = (User) o;
  return Objects.equals(id, user.id);
}

@Override
public int hashCode() {
  return Objects.hash(id);
}
```

### Use Enums for Constants

```java
// GOOD - Type-safe enum
public enum OrderStatus {
  PENDING,
  PROCESSING,
  SHIPPED,
  DELIVERED,
  CANCELLED;

  public boolean isTerminal() {
    return this == DELIVERED || this == CANCELLED;
  }
}

// BAD - String constants
public static final String STATUS_PENDING = "pending";
public static final String STATUS_PROCESSING = "processing";
// ...
```

## Javadoc Requirements

### Public APIs Must Have Javadoc

```java
/**
 * Calculates the total price of an order including tax and shipping.
 *
 * @param order the order to calculate total for
 * @param taxRate the applicable tax rate (e.g., 0.08 for 8%)
 * @return the total price including tax and shipping
 * @throws IllegalArgumentException if order is null or taxRate is negative
 */
public BigDecimal calculateTotal(Order order, double taxRate) {
  // Implementation
}
```

### Package-Private and Private Can Skip Javadoc

Implementation details don't require Javadoc:

```java
// OK - Private helper method
private void validateInput(String input) {
  // Validation logic
}
```

## Testing Guidelines

### Test Naming

```java
// GOOD - Descriptive test names
@Test
void shouldReturnUserWhenIdExists() { }

@Test
void shouldThrowExceptionWhenEmailIsInvalid() { }

@Test
void shouldCalculateCorrectTotalWithTax() { }
```

### Use AssertJ for Fluent Assertions

```java
// GOOD - Fluent and readable
assertThat(user.getEmail())
    .isNotNull()
    .endsWith("@example.com");

assertThat(orders)
    .hasSize(3)
    .extracting(Order::getStatus)
    .containsOnly(OrderStatus.PENDING);
```

## Tooling

### Formatter
- **google-java-format**: Enforces Google Style automatically
- Run on save or via pre-commit hook

### Static Analysis
- **SpotBugs + FindSecurityBugs**: Security vulnerability detection
- **PMD**: Code quality and maintainability
- **Checkstyle**: Style enforcement

### Build Configuration

```xml
<!-- Maven: pom.xml -->
<plugin>
  <groupId>com.github.spotbugs</groupId>
  <artifactId>spotbugs-maven-plugin</artifactId>
  <version>4.8.3.0</version>
  <configuration>
    <effort>Max</effort>
    <threshold>Low</threshold>
    <plugins>
      <plugin>
        <groupId>com.h3xstream.findsecbugs</groupId>
        <artifactId>findsecbugs-plugin</artifactId>
        <version>1.12.0</version>
      </plugin>
    </plugins>
  </configuration>
</plugin>
```

## Summary Checklist

Before committing Java code:
- [ ] Formatted with google-java-format
- [ ] No wildcard imports
- [ ] Proper null handling (Optional, @NonNull/@Nullable)
- [ ] Thread safety considered
- [ ] No SQL injection or security vulnerabilities
- [ ] Try-with-resources for all AutoCloseable
- [ ] Javadoc on public APIs
- [ ] Tests written and passing
- [ ] SpotBugs, PMD, Checkstyle pass
