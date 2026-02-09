---
name: jvm-backend-patterns
description: JVM backend architecture patterns for Spring Boot, JPA/Hibernate, Spring Security, and REST API design. Covers repository pattern, DTO mapping, transaction management, and enterprise patterns.
context: fork
agent: general-purpose
---

# JVM Backend Patterns

Backend architecture patterns and best practices for Spring Boot, JPA, and enterprise Java/Kotlin development.

## When to Activate

- Designing Spring Boot REST APIs
- Working with JPA/Hibernate repositories
- Implementing service layer patterns
- Configuring Spring Security
- Managing database transactions

## Layered Architecture

```
Controller → Service → Repository → Database
    ↓           ↓          ↓
   DTO      Domain     Entity
```

### Controller Layer
```java
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long id) {
        return orderService.findById(id)
            .map(OrderResponse::from)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        var order = orderService.create(request.toDomain());
        return ResponseEntity.created(URI.create("/api/orders/" + order.getId()))
            .body(OrderResponse.from(order));
    }
}
```

### Service Layer
```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;

    public Optional<Order> findById(Long id) {
        return orderRepository.findById(id);
    }

    @Transactional
    public Order create(Order order) {
        // Business logic here
        return orderRepository.save(order);
    }
}
```

### Repository Layer (Spring Data JPA)
```java
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o FROM Order o WHERE o.status = :status")
    List<Order> findByStatus(@Param("status") OrderStatus status);

    @Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);
}
```

## DTO Pattern

```java
// Request DTO
public record CreateOrderRequest(
    @NotNull @Size(min = 1) List<OrderItemRequest> items,
    @Size(max = 500) String notes
) {
    public Order toDomain() {
        return new Order(items.stream().map(OrderItemRequest::toDomain).toList());
    }
}

// Response DTO
public record OrderResponse(
    Long id, BigDecimal total, String status, List<OrderItemResponse> items
) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(
            order.getId(), order.getTotal(), order.getStatus().name(),
            order.getItems().stream().map(OrderItemResponse::from).toList()
        );
    }
}
```

## Spring Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.csrfTokenRepository(
                CookieCsrfTokenRepository.withHttpOnlyFalse()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .build();
    }
}
```

## Transaction Management

```java
// Read-only at class level, writable per method
@Service
@Transactional(readOnly = true)
public class OrderService {

    @Transactional  // Writable for mutations
    public Order create(Order order) { ... }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void auditLog(AuditEvent event) { ... }
}
```

## Error Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(404)
            .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        var errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .toList();
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("VALIDATION_ERROR", String.join(", ", errors)));
    }
}
```

## Key Principles

- Records for DTOs (immutable)
- `@Transactional(readOnly = true)` by default
- Bean Validation (`@Valid`) on controller inputs
- Optional for nullable returns
- N+1 prevention with `JOIN FETCH`
- Pagination for list endpoints
