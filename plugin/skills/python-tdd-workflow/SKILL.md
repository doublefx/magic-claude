---
name: python-tdd-workflow
description: Use this skill when writing new Python features, fixing bugs, or refactoring code. Enforces test-driven development with 80%+ coverage using pytest, unittest.mock, pytest-cov, and hypothesis.
context: fork
agent: general-purpose
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(pytest *), Bash(python -m pytest *), Bash(python -m coverage *), Bash(coverage *)
---

# Python Test-Driven Development Workflow

This skill ensures all Python code development follows TDD principles with comprehensive test coverage.

## When to Activate

- Writing new Python features or functionality
- Fixing bugs in Python code
- Refactoring existing Python code
- Adding API endpoints (Django/FastAPI)
- Creating new services or data models

## Core Principles

### 1. Tests BEFORE Code
ALWAYS write tests first, then implement code to make tests pass.

### 2. Coverage Requirements
- Minimum 80% coverage (unit + integration)
- All edge cases covered
- Error scenarios tested
- Boundary conditions verified

### 3. Test Types

#### Unit Tests (pytest + unittest.mock)
- Individual functions and classes
- Mock external dependencies
- Fast execution (<50ms each)

#### Integration Tests
- Django: @pytest.mark.django_db
- FastAPI: TestClient
- Database interactions
- External API calls

#### Property-Based Tests (hypothesis)
- Generate random test inputs
- Find edge cases automatically
- Verify invariants

## TDD Workflow Steps

### Step 1: Define Interface (SCAFFOLD)
```python
from dataclasses import dataclass
from decimal import Decimal

@dataclass(frozen=True)
class OrderItem:
    name: str
    quantity: int
    price: Decimal

@dataclass(frozen=True)
class Order:
    items: list[OrderItem]
    subtotal: Decimal
    tax: Decimal
    total: Decimal

class OrderService:
    def place_order(self, items: list[OrderItem]) -> Order:
        raise NotImplementedError
```

### Step 2: Write Failing Test (RED)
```python
import pytest
from decimal import Decimal

class TestPlaceOrder:
    def test_calculates_total_with_tax(self, order_service):
        items = [OrderItem("Widget", 2, Decimal("9.99"))]
        order = order_service.place_order(items)
        assert order.total == Decimal("21.58")

    def test_rejects_empty_order(self, order_service):
        with pytest.raises(ValueError, match="at least one item"):
            order_service.place_order([])
```

### Step 3: Run Test (MUST FAIL)
```bash
pytest tests/test_order_service.py -v
# Tests should FAIL
```

### Step 4: Implement Minimal Code (GREEN)
Write just enough code to make the test pass.

### Step 5: Run Test (MUST PASS)
```bash
pytest tests/test_order_service.py -v
```

### Step 6: Refactor (IMPROVE)
- Extract constants
- Improve naming
- Remove duplication
- Keep tests passing!

### Step 7: Verify Coverage
```bash
pytest --cov=src --cov-report=term-missing --cov-fail-under=80
```

## Testing Patterns

### Fixtures (conftest.py)
```python
# conftest.py
import pytest
from decimal import Decimal

@pytest.fixture
def order_service():
    return OrderService(tax_rate=Decimal("0.08"))

@pytest.fixture
def sample_items():
    return [
        OrderItem("Widget", 2, Decimal("9.99")),
        OrderItem("Gadget", 1, Decimal("24.99")),
    ]

@pytest.fixture(scope="session")
def db():
    """Session-scoped database for integration tests."""
    engine = create_test_engine()
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
```

### Mocking
```python
from unittest.mock import Mock, patch, AsyncMock

class TestUserService:
    def test_sends_welcome_email(self):
        repo = Mock(spec=UserRepository)
        email = Mock(spec=EmailService)
        repo.save.return_value = User(id=1, name="Alice")
        service = UserService(repo, email)

        service.create_user("Alice", "alice@example.com")

        email.send_welcome.assert_called_once_with("alice@example.com")

    @patch("services.user_service.external_api")
    def test_handles_api_failure(self, mock_api):
        mock_api.validate.side_effect = ConnectionError("timeout")
        service = UserService(Mock(), Mock())

        with pytest.raises(ServiceUnavailableError):
            service.create_user("Alice", "alice@example.com")
```

### Parametrized Tests
```python
@pytest.mark.parametrize(
    "amount, expected_tax, expected_total",
    [
        (Decimal("100"), Decimal("8.00"), Decimal("108.00")),
        (Decimal("0"), Decimal("0.00"), Decimal("0.00")),
        (Decimal("999.99"), Decimal("80.00"), Decimal("1079.99")),
    ],
    ids=["standard", "zero", "large"],
)
def test_tax_calculation(amount, expected_tax, expected_total):
    result = calculate_tax(amount, Decimal("0.08"))
    assert result.tax == expected_tax
    assert result.total == expected_total
```

### Property-Based Tests
```python
from hypothesis import given, strategies as st

@given(
    price=st.decimals(min_value=0, max_value=10000, places=2),
    quantity=st.integers(min_value=1, max_value=1000),
)
def test_total_always_non_negative(price, quantity):
    item = OrderItem("Test", quantity, price)
    service = OrderService(tax_rate=Decimal("0.08"))
    order = service.place_order([item])
    assert order.total >= 0
```

### Django Integration
```python
import pytest

@pytest.mark.django_db
class TestOrderAPI:
    def test_create_order(self, client):
        response = client.post(
            "/api/orders/",
            data={"items": [{"name": "Widget", "quantity": 2}]},
            content_type="application/json",
        )
        assert response.status_code == 201

    def test_list_orders_requires_auth(self, client):
        response = client.get("/api/orders/")
        assert response.status_code == 401
```

### FastAPI Integration
```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_order():
    response = client.post("/api/orders", json={"items": [{"name": "Widget"}]})
    assert response.status_code == 201

def test_validation_error():
    response = client.post("/api/orders", json={"items": []})
    assert response.status_code == 422
```

### Async Tests
```python
import pytest

@pytest.mark.asyncio
async def test_async_fetch():
    service = AsyncService()
    result = await service.fetch_data(1)
    assert result is not None
```

## Test File Organization

```
project/
├── src/
│   ├── services/
│   │   ├── __init__.py
│   │   ├── order_service.py
│   │   └── user_service.py
│   └── models/
│       └── order.py
├── tests/
│   ├── conftest.py                # Shared fixtures
│   ├── unit/
│   │   ├── conftest.py
│   │   ├── test_order_service.py
│   │   └── test_user_service.py
│   ├── integration/
│   │   ├── conftest.py
│   │   └── test_order_api.py
│   └── property/
│       └── test_order_properties.py
└── pyproject.toml
```

## pyproject.toml Configuration

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short --strict-markers"
markers = [
    "slow: slow-running tests",
    "integration: integration tests",
]

[tool.coverage.run]
source = ["src"]
branch = true

[tool.coverage.report]
fail_under = 80
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
]
```

## Best Practices

1. **Write Tests First** - Always TDD
2. **Use pytest** - Not unittest directly
3. **Fixtures** - conftest.py for shared setup
4. **Parametrize** - Data-driven tests
5. **hypothesis** - Property-based testing for edge cases
6. **Mock External Dependencies** - unittest.mock
7. **Test Edge Cases** - None, empty, boundary values
8. **Keep Tests Fast** - Unit tests < 50ms each
9. **Verify Coverage** - pytest-cov with --cov-fail-under=80
10. **No skip** - Fix or delete, don't skip

## Success Metrics

- 80%+ code coverage (pytest-cov)
- All tests passing (green)
- No skipped or disabled tests
- Fast test execution (< 30s for unit suite)
- Property-based tests for core logic
- Tests catch bugs before production

---

**Remember**: Tests are not optional. They are the safety net that enables confident refactoring, rapid development, and production reliability. Always use pytest, fixtures for setup, and parametrize for data-driven tests.
