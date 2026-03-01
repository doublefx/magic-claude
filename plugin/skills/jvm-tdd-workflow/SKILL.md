---
name: jvm-tdd-workflow
description: Use this skill when writing new JVM (Java/Kotlin/Groovy) features, fixing bugs, or refactoring code. Enforces test-driven development with 80%+ coverage using JUnit 5, Mockito, MockK, AssertJ, and JaCoCo.
context: fork
agent: general-purpose
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(./gradlew test *), Bash(./mvnw test *), Bash(./gradlew jacocoTestReport *), Bash(./mvnw jacoco:report *), Bash(mvn test *), Bash(gradle test *)
---

# JVM Test-Driven Development Workflow

This skill ensures all JVM (Java/Kotlin/Groovy) code development follows TDD principles with comprehensive test coverage.

## When to Activate

- Writing new JVM features or functionality
- Fixing bugs in Java/Kotlin/Groovy code
- Refactoring existing JVM code
- Adding REST endpoints (Spring Boot)
- Creating new services or repositories

## Core Principles

### 1. Tests BEFORE Code
ALWAYS write tests first, then implement code to make tests pass.

### 2. Coverage Requirements
- Minimum 80% coverage (unit + integration)
- All edge cases covered
- Error scenarios tested
- Boundary conditions verified

### 3. Test Types

#### Unit Tests (JUnit 5 + Mockito/MockK)
- Individual classes in isolation
- Mock external dependencies
- Fast execution (<50ms each)

#### Integration Tests (Spring Boot Test)
- @SpringBootTest for full context
- @WebMvcTest for controllers
- @DataJpaTest for repositories
- TestContainers for databases

#### Parametrized Tests
- Data-driven tests with @ParameterizedTest
- @CsvSource, @MethodSource, @EnumSource

## TDD Workflow Steps

### Step 1: Define Interface (SCAFFOLD)
```java
public interface OrderService {
    Order placeOrder(List<OrderItem> items);
    Optional<Order> findById(Long id);
}
```

### Step 2: Write Failing Test (RED)
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
    }
}
```

### Step 3: Run Test (MUST FAIL)
```bash
./gradlew test --tests "*OrderServiceImplTest"
# or
./mvnw test -Dtest=OrderServiceImplTest
```

### Step 4: Implement Minimal Code (GREEN)
Write just enough code to make the test pass.

### Step 5: Run Test (MUST PASS)
```bash
./gradlew test --tests "*OrderServiceImplTest"
```

### Step 6: Refactor (IMPROVE)
- Extract constants
- Improve naming
- Remove duplication
- Keep tests passing!

### Step 7: Verify Coverage
```bash
./gradlew jacocoTestReport
# or
./mvnw jacoco:report
```

## Testing Patterns

### Mockito (Java)
```java
@ExtendWith(MockitoExtension.class)
class ServiceTest {
    @Mock Repository repo;
    @Mock ExternalApi api;
    @InjectMocks MyService service;

    @Test
    void shouldCallRepository() {
        when(repo.findById(1L)).thenReturn(Optional.of(entity));

        var result = service.process(1L);

        assertThat(result).isNotNull();
        verify(repo).findById(1L);
        verifyNoMoreInteractions(api);
    }
}
```

### MockK (Kotlin)
```kotlin
class ServiceTest {
    private val repo = mockk<Repository>()
    private val service = MyService(repo)

    @Test
    fun `should process entity`() {
        every { repo.findById(1L) } returns Optional.of(entity)

        val result = service.process(1L)

        assertThat(result).isNotNull
        verify(exactly = 1) { repo.findById(1L) }
    }
}
```

### Spring Boot Integration
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

### TestContainers
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

## Test File Organization

```
src/
├── main/
│   ├── java/com/example/
│   │   ├── service/OrderService.java
│   │   ├── repository/OrderRepository.java
│   │   └── controller/OrderController.java
│   └── kotlin/com/example/
│       └── service/UserService.kt
└── test/
    ├── java/com/example/
    │   ├── service/OrderServiceTest.java
    │   ├── repository/OrderRepositoryIT.java    # Integration
    │   └── controller/OrderControllerTest.java
    └── kotlin/com/example/
        └── service/UserServiceTest.kt
```

## Gradle JaCoCo Configuration

```kotlin
// build.gradle.kts
plugins {
    jacoco
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.80".toBigDecimal()
            }
        }
    }
}
```

## Maven JaCoCo Configuration

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.12</version>
    <executions>
        <execution>
            <goals><goal>prepare-agent</goal></goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals><goal>report</goal></goals>
        </execution>
        <execution>
            <id>check</id>
            <goals><goal>check</goal></goals>
            <configuration>
                <rules>
                    <rule>
                        <element>BUNDLE</element>
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

## Best Practices

1. **Write Tests First** - Always TDD
2. **Use AssertJ** - Fluent assertions over JUnit assertEquals
3. **@DisplayName** - Descriptive test names
4. **@Nested** - Group related tests
5. **Mock External Dependencies** - Mockito for Java, MockK for Kotlin
6. **TestContainers** - Real databases for integration tests
7. **Test Edge Cases** - Null, empty, max values, BigDecimal precision
8. **Keep Tests Fast** - Unit tests < 50ms each
9. **Verify Coverage** - JaCoCo reports after each cycle
10. **No @Disabled** - Fix or delete, don't disable

## Success Metrics

- 80%+ code coverage (JaCoCo)
- All tests passing (green)
- No skipped or disabled tests
- Fast test execution (< 30s for unit suite)
- Integration tests with TestContainers
- Tests catch bugs before production

---

**Remember**: Tests are not optional. They are the safety net that enables confident refactoring, rapid development, and production reliability. Always use JUnit 5, AssertJ, and MockK for Kotlin.
