# JVM (Java / Kotlin / Groovy) — TDD Patterns

**Tools:** JUnit 5 + Mockito (Java) or MockK (Kotlin), AssertJ, JaCoCo, TestContainers

## TDD Cycle Commands

```bash
# Run tests
./gradlew test --tests "*OrderServiceTest"
./mvnw test -Dtest=OrderServiceTest

# Coverage
./gradlew jacocoTestReport
./mvnw jacoco:report
```

## Step 1: Define Interface (SCAFFOLD)

```java
public interface OrderService {
    Order placeOrder(List<OrderItem> items);
    Optional<Order> findById(Long id);
}
```

## Unit Test — Mockito (Java)

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock private OrderRepository repository;
    @InjectMocks private OrderServiceImpl service;

    @Test
    @DisplayName("should calculate total with tax")
    void shouldCalculateTotalWithTax() {
        var items = List.of(new OrderItem("Widget", 2, BigDecimal.valueOf(9.99)));
        var order = service.placeOrder(items);
        assertThat(order.getTotal()).isEqualByComparingTo("21.58");
        verify(repository).save(any(Order.class));
    }
}
```

## Unit Test — MockK (Kotlin)

```kotlin
class ServiceTest {
    private val repo = mockk<Repository>()
    private val service = MyService(repo)

    @Test
    fun `should process entity correctly`() {
        every { repo.findById(1L) } returns Optional.of(entity)
        val result = service.process(1L)
        assertThat(result).isNotNull
        verify(exactly = 1) { repo.findById(1L) }
    }
}
```

## Spring Boot Integration Test

```java
@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean OrderService service;

    @Test
    void shouldReturnOrder() throws Exception {
        when(service.findById(1L)).thenReturn(Optional.of(order));
        mockMvc.perform(get("/api/orders/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(21.58));
    }
}
```

## TestContainers

```java
@Testcontainers
@SpringBootTest
class RepositoryIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

## JaCoCo Config (Gradle)

```kotlin
// build.gradle.kts
tasks.jacocoTestCoverageVerification {
    violationRules {
        rule { limit { minimum = "0.80".toBigDecimal() } }
    }
}
```

## JaCoCo Config (Maven)

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <executions>
        <execution>
            <id>check</id>
            <goals><goal>check</goal></goals>
            <configuration>
                <rules>
                    <rule>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

## File Organization

```
src/
├── main/java/com/example/
│   ├── service/OrderService.java
│   └── controller/OrderController.java
└── test/java/com/example/
    ├── service/OrderServiceTest.java
    ├── repository/OrderRepositoryIT.java
    └── controller/OrderControllerTest.java
```

## Common Mistakes

| Wrong | Correct |
|-------|---------|
| `assertEquals(expected, actual)` | `assertThat(actual).isEqualTo(expected)` (AssertJ) |
| `@Disabled` | Fix or delete the test |
| Raw `new Thread()` in tests | Use `@Async` + `CompletableFuture` or Awaitility |
| String concatenation in JPQL | Parameterized queries only |
