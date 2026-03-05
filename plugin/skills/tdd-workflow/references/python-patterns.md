# Python — TDD Patterns

**Tools:** pytest, unittest.mock, pytest-cov, hypothesis

## TDD Cycle Commands

```bash
# Run tests
pytest tests/ -v

# Coverage (enforce 80%)
pytest --cov=src --cov-report=term-missing --cov-fail-under=80

# Watch mode
pytest-watch
```

## Step 1: Define Interface (SCAFFOLD)

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

## Unit Test (pytest)

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

## Fixtures (conftest.py)

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

## Mocking

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

## Parametrized Tests

```python
@pytest.mark.parametrize("amount, expected_total", [
    (Decimal("100"), Decimal("108.00")),
    (Decimal("0"), Decimal("0.00")),
    (Decimal("999.99"), Decimal("1079.99")),
])
def test_tax_calculation(amount, expected_total):
    assert calculate_total(amount, Decimal("0.08")) == expected_total
```

## Property-Based Tests (hypothesis)

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

## FastAPI / Django Integration

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_order():
    response = client.post("/api/orders", json={"items": [{"name": "Widget", "quantity": 1}]})
    assert response.status_code == 201

def test_validation_error():
    response = client.post("/api/orders", json={"items": []})
    assert response.status_code == 422

# Django
@pytest.mark.django_db
def test_list_orders_requires_auth(client):
    response = client.get("/api/orders/")
    assert response.status_code == 401
```

## pyproject.toml Config

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short"

[tool.coverage.report]
fail_under = 80
show_missing = true
exclude_lines = ["pragma: no cover", "if TYPE_CHECKING:"]
```

## File Organization

```
project/
├── src/services/order_service.py
└── tests/
    ├── conftest.py
    ├── unit/test_order_service.py
    ├── integration/test_order_api.py
    └── property/test_order_properties.py
```

## Common Mistakes

| Wrong | Correct |
|-------|---------|
| `except Exception: pass` | `except Exception: logger.exception("..."); raise` |
| `pytest.skip` | Fix or delete the test |
| Mutable default args in fixtures | Use `None` default + create inside fixture |
| `assert` without message for complex conditions | `assert result == expected, f"Got {result}"` |
