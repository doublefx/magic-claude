# JVM (Spring Boot / JPA) — Backend Patterns

**Stack:** Spring Boot 3.x, Spring Data JPA, Spring Security, Hibernate

## Layered Architecture

```
Controller → Service → Repository → Database
    ↓           ↓          ↓
   DTO      Domain     Entity
```

## Controller Layer

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

## Service Layer

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)  // Read-only by default
public class OrderService {

    private final OrderRepository orderRepository;

    public Optional<Order> findById(Long id) {
        return orderRepository.findById(id);
    }

    @Transactional  // Override to writable
    public Order create(Order order) {
        return orderRepository.save(order);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void auditLog(AuditEvent event) { ... }
}
```

## Repository Layer (Spring Data JPA)

```java
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o FROM Order o WHERE o.status = :status")
    List<Order> findByStatus(@Param("status") OrderStatus status);

    // JOIN FETCH prevents N+1
    @Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    // Pagination for list endpoints
    Page<Order> findByUserId(Long userId, Pageable pageable);
}
```

## DTO Pattern (Records)

```java
// Request DTO — validates + converts to domain
public record CreateOrderRequest(
    @NotNull @Size(min = 1) List<OrderItemRequest> items,
    @Size(max = 500) String notes
) {
    public Order toDomain() {
        return new Order(items.stream().map(OrderItemRequest::toDomain).toList());
    }
}

// Response DTO — converts from domain
public record OrderResponse(Long id, BigDecimal total, String status) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(order.getId(), order.getTotal(), order.getStatus().name());
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

## Global Error Handling

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
- `@Transactional(readOnly = true)` by default on services
- `@Valid` on all controller inputs
- `Optional` for nullable returns — never `null`
- `JOIN FETCH` to prevent N+1
- `Pageable` for all list endpoints
