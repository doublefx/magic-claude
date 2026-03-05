---
name: tdd-workflow
description: >
  TDD methodology for TypeScript/JavaScript, JVM (Java/Kotlin/Groovy), and Python. Use when writing
  new features, fixing bugs, or refactoring. Detects ecosystem automatically and provides
  RED → GREEN → REFACTOR workflow with 80%+ coverage enforcement, language-specific tooling
  (Jest/Vitest, JUnit 5/MockK, pytest/hypothesis), and concrete code patterns per ecosystem.
context: fork
agent: general-purpose
allowed-tools: Read, Write, Edit, Grep, Glob,
  Bash(npm test *), Bash(npx vitest *), Bash(npx jest *), Bash(node tests/*),
  Bash(./gradlew test *), Bash(./mvnw test *), Bash(./gradlew jacocoTestReport *), Bash(./mvnw jacoco:report *), Bash(mvn test *), Bash(gradle test *),
  Bash(pytest *), Bash(python -m pytest *), Bash(python -m coverage *), Bash(coverage *)
---

# Test-Driven Development Workflow

## Shared Principles

### Iron Law
**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**

### RED → GREEN → REFACTOR

1. **SCAFFOLD** — Define the interface/signature (types, method signatures, no implementation)
2. **RED** — Write a failing test that describes the expected behavior
3. **Run** — Confirm the test fails (if it passes, the test is wrong)
4. **GREEN** — Write the minimum code to make the test pass
5. **Run** — Confirm the test passes
6. **REFACTOR** — Clean up without changing behavior; keep tests green
7. **Coverage** — Verify 80%+ with the ecosystem tool

### Anti-Rationalization

| Thought | Reality |
|---------|---------|
| "This is too simple for tests" | Simple code is the easiest to test. Write the test. |
| "I'll add tests after" | That's not TDD. Delete the code and write the test first. |
| "Just a refactor, no new tests" | Run existing tests. If none cover it, add them before refactoring. |
| "Let me get the code working first" | Code written without tests tends to stay untested. |

### Coverage Requirements
- Minimum **80%** (branches, functions, lines, statements)
- All edge cases covered
- Error scenarios tested
- Boundary conditions verified

---

## Ecosystem: TypeScript / JavaScript

**Tools:** Jest or Vitest for unit/integration, Playwright for E2E

### TDD Cycle

```bash
# Run tests
npm test
npx vitest run

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage
```

### Unit Test Pattern (Jest/Vitest)
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### API Integration Test Pattern
```typescript
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('GET /api/orders', () => {
  it('returns orders successfully', async () => {
    const request = new NextRequest('http://localhost/api/orders')
    const response = await GET(request)
    expect(response.status).toBe(200)
    expect((await response.json()).success).toBe(true)
  })

  it('validates query parameters', async () => {
    const request = new NextRequest('http://localhost/api/orders?limit=invalid')
    expect((await GET(request)).status).toBe(400)
  })
})
```

### Mocking External Services
```typescript
jest.mock('@/lib/database', () => ({
  db: {
    query: jest.fn(() => Promise.resolve({ rows: [{ id: 1, name: 'Test' }] }))
  }
}))
```

### E2E Test Pattern (Playwright)
```typescript
import { test, expect } from '@playwright/test'

test('user completes checkout flow', async ({ page }) => {
  await page.goto('/cart')
  await page.click('button:has-text("Checkout")')
  await page.fill('input[name="email"]', 'user@example.com')
  await page.click('button[type="submit"]')
  await expect(page.locator('text=Order confirmed')).toBeVisible()
})
```

### Coverage Config (Jest)
```json
{
  "jest": {
    "coverageThresholds": {
      "global": { "branches": 80, "functions": 80, "lines": 80, "statements": 80 }
    }
  }
}
```

### File Organization
```
src/
├── components/Button/
│   ├── Button.tsx
│   └── Button.test.tsx
├── app/api/orders/
│   ├── route.ts
│   └── route.test.ts
└── e2e/checkout.spec.ts
```

---

## Ecosystem: JVM (Java / Kotlin / Groovy)

**Tools:** JUnit 5 + Mockito (Java) or MockK (Kotlin), AssertJ, JaCoCo, TestContainers

### TDD Cycle

```bash
# Run tests
./gradlew test --tests "*OrderServiceTest"
./mvnw test -Dtest=OrderServiceTest

# Coverage
./gradlew jacocoTestReport
./mvnw jacoco:report
```

### Step 1: Define Interface (SCAFFOLD)
```java
public interface OrderService {
    Order placeOrder(List<OrderItem> items);
    Optional<Order> findById(Long id);
}
```

### Unit Test — Mockito (Java)
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

### Unit Test — MockK (Kotlin)
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

### Spring Boot Integration Test
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

### JaCoCo Config (Gradle)
```kotlin
tasks.jacocoTestCoverageVerification {
    violationRules {
        rule { limit { minimum = "0.80".toBigDecimal() } }
    }
}
```

### JaCoCo Config (Maven)
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

### File Organization
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

---

## Ecosystem: Python

**Tools:** pytest, unittest.mock, pytest-cov, hypothesis

### TDD Cycle

```bash
# Run tests
pytest tests/ -v

# Coverage (enforce 80%)
pytest --cov=src --cov-report=term-missing --cov-fail-under=80
```

### Step 1: Define Interface (SCAFFOLD)
```python
from dataclasses import dataclass
from decimal import Decimal

@dataclass(frozen=True)
class OrderItem:
    name: str
    quantity: int
    price: Decimal

class OrderService:
    def place_order(self, items: list[OrderItem]) -> Order:
        raise NotImplementedError
```

### Unit Test (pytest)
```python
class TestPlaceOrder:
    def test_calculates_total_with_tax(self, order_service):
        items = [OrderItem("Widget", 2, Decimal("9.99"))]
        order = order_service.place_order(items)
        assert order.total == Decimal("21.58")

    def test_rejects_empty_order(self, order_service):
        with pytest.raises(ValueError, match="at least one item"):
            order_service.place_order([])
```

### Fixtures (conftest.py)
```python
@pytest.fixture
def order_service():
    return OrderService(tax_rate=Decimal("0.08"))

@pytest.fixture(scope="session")
def db():
    engine = create_test_engine()
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
```

### Mocking
```python
from unittest.mock import Mock, patch

def test_sends_welcome_email():
    repo = Mock(spec=UserRepository)
    email = Mock(spec=EmailService)
    repo.save.return_value = User(id=1, name="Alice")
    service = UserService(repo, email)

    service.create_user("Alice", "alice@example.com")

    email.send_welcome.assert_called_once_with("alice@example.com")
```

### Parametrized Tests
```python
@pytest.mark.parametrize("amount, expected_total", [
    (Decimal("100"), Decimal("108.00")),
    (Decimal("0"), Decimal("0.00")),
    (Decimal("999.99"), Decimal("1079.99")),
])
def test_tax_calculation(amount, expected_total):
    assert calculate_total(amount, Decimal("0.08")) == expected_total
```

### Property-Based Tests (hypothesis)
```python
from hypothesis import given, strategies as st

@given(
    price=st.decimals(min_value=0, max_value=10000, places=2),
    quantity=st.integers(min_value=1, max_value=1000),
)
def test_total_always_non_negative(price, quantity):
    item = OrderItem("Test", quantity, price)
    order = OrderService(tax_rate=Decimal("0.08")).place_order([item])
    assert order.total >= 0
```

### FastAPI / Django Integration
```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_order():
    response = client.post("/api/orders", json={"items": [{"name": "Widget", "quantity": 1}]})
    assert response.status_code == 201

# Django
@pytest.mark.django_db
def test_list_orders_requires_auth(client):
    response = client.get("/api/orders/")
    assert response.status_code == 401
```

### pyproject.toml Config
```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short"

[tool.coverage.report]
fail_under = 80
show_missing = true
```

### File Organization
```
project/
├── src/services/order_service.py
└── tests/
    ├── conftest.py
    ├── unit/test_order_service.py
    ├── integration/test_order_api.py
    └── property/test_order_properties.py
```

---

## Common Mistakes

| Wrong | Correct |
|-------|---------|
| Write code first, add tests later | Write the failing test first |
| Test implementation details (internal state) | Test observable behavior |
| Brittle CSS selectors in E2E | Semantic selectors (`button:has-text(...)`, `data-testid`) |
| Tests that depend on each other | Each test sets up its own data |
| `@Disabled` / `skip` | Fix or delete the test |

## Related

- `magic-claude:proactive-tdd` skill — Auto-invoked TDD for discrete implementations
- `magic-claude:ts-tdd-guide` agent — TypeScript/JavaScript TDD specialist
- `magic-claude:jvm-tdd-guide` agent — JVM TDD specialist
- `magic-claude:python-tdd-guide` agent — Python TDD specialist
