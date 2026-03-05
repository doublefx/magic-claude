# Python — Coding Standards

**Style guides:** PEP 8, PEP 621; tools: Ruff, Pyright

## Naming Conventions (PEP 8)

- Modules/packages: `lower_snake_case` (`order_service.py`)
- Classes: `UpperCamelCase` (`OrderService`)
- Functions/variables: `lower_snake_case` (`calculate_total`)
- Constants: `UPPER_SNAKE_CASE` (`MAX_RETRY_COUNT`)
- Private: prefix `_` (`_internal_helper`)

## Type Hints (Mandatory)

```python
# All public functions must have type hints
def calculate_total(items: list[OrderItem], tax_rate: Decimal) -> Decimal:
    ...

# Modern union syntax (Python 3.10+)
def process(value: str | None) -> list[str]: ...

# TypeAlias for complex types
type UserId = int
type OrderMap = dict[UserId, list[Order]]
```

## Immutability

```python
# Frozen dataclasses
@dataclass(frozen=True, slots=True)
class OrderItem:
    name: str
    quantity: int
    price: Decimal

# Frozen Pydantic v2 models
class User(BaseModel):
    model_config = ConfigDict(frozen=True)
    name: str
    email: EmailStr

# Tuples over lists for fixed collections
ALLOWED_STATUSES = ("active", "pending", "closed")
```

## Error Handling

```python
# Specific exceptions
class OrderNotFoundError(Exception):
    def __init__(self, order_id: int) -> None:
        super().__init__(f"Order {order_id} not found")

# Context managers for resources
with open(path) as f:
    data = f.read()

# WRONG: except Exception: pass
# CORRECT: except Exception: logger.exception("Failed"); raise
```

## Modern Python Patterns

```python
# Structural pattern matching (3.10+)
match command:
    case {"action": "create", "data": data}:
        create_order(data)
    case {"action": "delete", "id": id_}:
        delete_order(id_)
    case _:
        raise ValueError(f"Unknown command: {command}")
```

```python
# Pydantic v2 validation
class CreateOrderRequest(BaseModel):
    items: list[OrderItem] = Field(min_length=1)
    notes: str = Field(default="", max_length=500)

    @field_validator("items")
    @classmethod
    def items_must_have_positive_quantity(cls, v):
        for item in v:
            if item.quantity <= 0:
                raise ValueError("Quantity must be positive")
        return v
```

## SOLID (Python Examples)

**S — Single Responsibility:**
```python
# order_service.py — business logic
# order_repository.py — data access
# order_schema.py — validation/serialization
```

**O — Open/Closed (Protocol-based):**
```python
from typing import Protocol

class Formatter(Protocol):
    def format(self, data: dict) -> str: ...

class JsonFormatter:
    def format(self, data: dict) -> str: return json.dumps(data)
# Add new formats without modifying existing code
```

**I — Interface Segregation:**
```python
class Readable(Protocol):
    def read(self, key: str) -> bytes: ...

class Writable(Protocol):
    def write(self, key: str, data: bytes) -> None: ...

def process(source: Readable) -> None: ...  # doesn't need write
```

**D — Dependency Inversion:**
```python
class OrderService:
    def __init__(self, repo: OrderRepository) -> None:  # Protocol, not SqlAlchemyRepo
        self._repo = repo
```

## Money: Always Decimal

```python
from decimal import Decimal, ROUND_HALF_UP
# NEVER use float for money
price = Decimal("9.99")  # String constructor!
total = price * quantity
```

## Project Structure

```
project/
├── pyproject.toml
├── src/
│   └── mypackage/
│       ├── __init__.py
│       ├── models.py
│       ├── services/order_service.py
│       └── api/routes.py
└── tests/
    ├── conftest.py
    └── test_order_service.py
```

## Tooling (pyproject.toml)

```toml
[tool.ruff]
target-version = "py312"
line-length = 88
select = ["E", "F", "I", "N", "UP", "B", "SIM", "RUF"]

[tool.pyright]
pythonVersion = "3.12"
typeCheckingMode = "strict"
```

## Testing

- pytest, fixtures in `conftest.py`
- `@pytest.mark.parametrize` for data-driven tests
- hypothesis for property-based tests
- 80%+ coverage (pytest-cov)

## Common Mistakes

| Wrong | Correct |
|-------|---------|
| `float` for money | `Decimal("9.99")` |
| `def f(items=[])` | `def f(items=None)` then `items = items or []` |
| `except Exception: pass` | `logger.exception("..."); raise` |
| `yaml.load(data)` | `yaml.safe_load(data)` |
| `Optional[str]` (old) | `str \| None` (Python 3.10+) |
