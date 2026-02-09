---
name: python-coding-standards
description: Python coding standards and best practices. Covers PEP 8, type hints, modern Python patterns (3.12+), Pydantic, dataclasses, and security-aware coding.
context: fork
agent: general-purpose
---

# Python Coding Standards

Universal coding standards and best practices for modern Python development (3.12+).

## When to Activate

- Writing new Python code
- Reviewing Python code quality
- Enforcing consistent coding style
- Setting up new Python projects

## Naming Conventions (PEP 8)

- Modules/packages: `lower_snake_case` (e.g., `order_service.py`)
- Classes: `UpperCamelCase` (e.g., `OrderService`)
- Functions/variables: `lower_snake_case` (e.g., `calculate_total`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`)
- Private: prefix with `_` (e.g., `_internal_helper`)

## Type Hints (Mandatory)

```python
# All public functions must have type hints
def calculate_total(items: list[OrderItem], tax_rate: Decimal) -> Decimal:
    ...

# Use modern syntax (Python 3.10+)
def process(value: str | None) -> list[str]:  # Not Optional[str], Union[...]
    ...

# Use TypeAlias for complex types
type UserId = int
type OrderMap = dict[UserId, list[Order]]
```

## Immutability

```python
# PREFER: Frozen dataclasses
@dataclass(frozen=True)
class OrderItem:
    name: str
    quantity: int
    price: Decimal

# PREFER: Pydantic models (immutable by default in v2)
class User(BaseModel):
    model_config = ConfigDict(frozen=True)
    name: str
    email: EmailStr

# PREFER: Tuples over lists for fixed collections
ALLOWED_STATUSES = ("active", "pending", "closed")
```

## Error Handling

```python
# Specific exceptions, not generic
class OrderNotFoundError(Exception):
    def __init__(self, order_id: int) -> None:
        super().__init__(f"Order {order_id} not found")

# Context managers for resources
with open(path) as f:
    data = f.read()

# Don't catch and ignore
# WRONG: except Exception: pass
# CORRECT: except Exception: logger.exception("Failed"); raise
```

## Modern Python Patterns

### Structural Pattern Matching (3.10+)
```python
match command:
    case {"action": "create", "data": data}:
        create_order(data)
    case {"action": "delete", "id": id_}:
        delete_order(id_)
    case _:
        raise ValueError(f"Unknown command: {command}")
```

### Dataclasses
```python
@dataclass(frozen=True, slots=True)
class Order:
    items: list[OrderItem]
    subtotal: Decimal
    tax: Decimal
    total: Decimal
```

### Pydantic v2
```python
from pydantic import BaseModel, Field, field_validator

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

## Project Structure

```
project/
├── pyproject.toml          # Project config (PEP 621)
├── src/
│   └── mypackage/
│       ├── __init__.py
│       ├── models.py
│       ├── services/
│       │   ├── __init__.py
│       │   └── order_service.py
│       └── api/
│           ├── __init__.py
│           └── routes.py
└── tests/
    ├── conftest.py
    └── test_order_service.py
```

## Tooling

```toml
# pyproject.toml
[tool.ruff]
target-version = "py312"
line-length = 88
select = ["E", "F", "I", "N", "UP", "B", "SIM", "RUF"]

[tool.ruff.format]
quote-style = "double"

[tool.pyright]
pythonVersion = "3.12"
typeCheckingMode = "strict"
```

## General Principles

### Decimal for Money
```python
from decimal import Decimal, ROUND_HALF_UP
# NEVER use float for money
price = Decimal("9.99")  # String constructor!
total = price * quantity
```

### Testing
- pytest (not unittest directly)
- Fixtures in conftest.py
- Parametrize for data-driven tests
- hypothesis for property-based tests
- 80%+ coverage (pytest-cov)

## Resources
- [PEP 8](https://peps.python.org/pep-0008/)
- [PEP 621](https://peps.python.org/pep-0621/) (pyproject.toml)
- [Pydantic v2 Docs](https://docs.pydantic.dev/)
