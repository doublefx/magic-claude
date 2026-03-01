# Python Style Guide (2026)

Modern Python style guide emphasizing readability, type safety, and security.

## PEP 8 Fundamentals

### Naming Conventions

```python
# ✅ CORRECT
class UserAccount:          # PascalCase for classes
    pass

def calculate_total():      # snake_case for functions
    pass

MAXIMUM_RETRIES = 3        # UPPER_CASE for constants
user_count = 0             # snake_case for variables
_internal_cache = {}       # Leading underscore for private

# ❌ WRONG
class user_account:        # Should be PascalCase
    pass

def CalculateTotal():      # Should be snake_case
    pass

maxRetries = 3            # Should be UPPER_CASE
```

### Line Length and Formatting

```python
# ✅ Line length: 88-100 characters (configurable)
def process_user_data(
    user_id: int,
    include_metadata: bool = False,
    max_results: int = 100,
) -> list[dict]:
    """Process user data with optional metadata."""
    pass

# ✅ Break long lines logically
result = some_function(
    first_argument,
    second_argument,
    third_argument,
)

# ✅ Blank lines
# 2 blank lines before top-level functions/classes
# 1 blank line between methods in a class


class MyClass:
    def method_one(self):
        pass

    def method_two(self):
        pass
```

### Imports

```python
# ✅ CORRECT: Organized imports
# Standard library
import os
import sys
from pathlib import Path

# Third-party
import requests
from fastapi import FastAPI

# Local
from my_project.core import models
from my_project.utils import helpers

# ❌ WRONG: Star imports
from module import *  # Never do this

# ❌ WRONG: Multiple imports per line
import os, sys  # Split into separate lines
```

## Type Hints (CRITICAL)

### Always Add Type Hints

```python
# ✅ CORRECT: Full type hints
def calculate_statistics(
    data: list[float],
    percentiles: list[int] = [25, 50, 75],
) -> dict[str, float]:
    """Calculate statistics for dataset."""
    return {
        "mean": sum(data) / len(data),
        "median": sorted(data)[len(data) // 2],
    }

# ✅ CORRECT: Optional types
from typing import Optional

def find_user(user_id: int) -> Optional[User]:
    """Find user by ID, returns None if not found."""
    return db.query(User).filter(User.id == user_id).first()

# ✅ CORRECT: Union types (Python 3.10+)
def parse_value(value: str | int | float) -> float:
    """Parse value to float."""
    return float(value)

# ❌ WRONG: No type hints
def calculate_statistics(data, percentiles=[25, 50, 75]):
    pass
```

### Type Hints for Classes

```python
# ✅ CORRECT: Class with type hints
from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str
    email: str
    age: int | None = None

    def get_display_name(self) -> str:
        """Get formatted display name."""
        return f"{self.name} ({self.email})"

# ✅ CORRECT: Generic types
from typing import TypeVar, Generic

T = TypeVar("T")

class Repository(Generic[T]):
    def find_by_id(self, id: int) -> T | None:
        pass
```

## Docstrings (Google Style)

### Function Docstrings

```python
def calculate_compound_interest(
    principal: float,
    rate: float,
    years: int,
    compounds_per_year: int = 12,
) -> float:
    """Calculate compound interest.

    Args:
        principal: Initial investment amount in dollars.
        rate: Annual interest rate as decimal (e.g., 0.05 for 5%).
        years: Number of years to compound.
        compounds_per_year: Number of times interest compounds per year.
            Defaults to 12 (monthly).

    Returns:
        Final amount after compound interest.

    Raises:
        ValueError: If principal, rate, or years is negative.

    Example:
        >>> calculate_compound_interest(1000, 0.05, 10)
        1647.01
    """
    if principal < 0 or rate < 0 or years < 0:
        raise ValueError("Values must be non-negative")

    return principal * (1 + rate / compounds_per_year) ** (compounds_per_year * years)
```

### Class Docstrings

```python
class UserRepository:
    """Repository for user database operations.

    This class handles all database operations related to users,
    including CRUD operations and queries.

    Attributes:
        connection: Database connection instance.
        cache_enabled: Whether to use caching for queries.

    Example:
        >>> repo = UserRepository(db_connection)
        >>> user = repo.find_by_email("user@example.com")
    """

    def __init__(self, connection: Connection, cache_enabled: bool = True):
        """Initialize repository.

        Args:
            connection: Active database connection.
            cache_enabled: Enable query caching. Defaults to True.
        """
        self.connection = connection
        self.cache_enabled = cache_enabled
```

### Module Docstrings

```python
"""User authentication and authorization module.

This module provides functions for user authentication, password hashing,
JWT token generation, and role-based access control.

Typical usage example:
    user = authenticate_user("username", "password")
    token = generate_jwt_token(user)
    if has_permission(user, "admin"):
        # Admin operations
"""
```

## Modern Python Patterns

### Use f-strings

```python
# ✅ CORRECT: f-strings (fastest, most readable)
name = "Alice"
age = 30
message = f"{name} is {age} years old"
formatted_value = f"Value: {value:.2f}"

# ❌ WRONG: Old formatting methods
message = "%s is %d years old" % (name, age)  # Old
message = "{} is {} years old".format(name, age)  # Verbose
```

### Use Pathlib

```python
# ✅ CORRECT: pathlib
from pathlib import Path

config_path = Path(__file__).parent / "config" / "settings.json"
content = config_path.read_text()

for file in Path("data").glob("*.json"):
    print(file.name)

# ❌ WRONG: os.path
import os
config_path = os.path.join(os.path.dirname(__file__), "config", "settings.json")
with open(config_path) as f:
    content = f.read()
```

### Use Dataclasses

```python
# ✅ CORRECT: dataclass
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

    def distance_from_origin(self) -> float:
        return (self.x**2 + self.y**2) ** 0.5

# ❌ WRONG: Manual class with __init__
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def distance_from_origin(self):
        return (self.x**2 + self.y**2) ** 0.5
```

### Use Context Managers

```python
# ✅ CORRECT: Context manager
with open("file.txt") as f:
    content = f.read()

# ✅ CORRECT: Multiple context managers
with open("input.txt") as infile, open("output.txt", "w") as outfile:
    outfile.write(infile.read().upper())

# ❌ WRONG: Manual cleanup
f = open("file.txt")
content = f.read()
f.close()  # Might not execute if exception occurs
```

### List Comprehensions

```python
# ✅ CORRECT: List comprehension
squares = [x**2 for x in range(10)]
even_squares = [x**2 for x in range(10) if x % 2 == 0]

# ✅ CORRECT: Dict comprehension
word_lengths = {word: len(word) for word in words}

# ✅ CORRECT: Set comprehension
unique_lengths = {len(word) for word in words}

# ✅ CORRECT: Generator expression (for large data)
sum_of_squares = sum(x**2 for x in range(1_000_000))

# ❌ WRONG: Manual loops (less Pythonic)
squares = []
for x in range(10):
    squares.append(x**2)
```

## Error Handling

### Specific Exception Handling

```python
# ✅ CORRECT: Specific exceptions
try:
    result = process_data(data)
except ValueError as e:
    logger.error(f"Invalid data: {e}")
    raise
except FileNotFoundError as e:
    logger.error(f"File not found: {e}")
    return default_value
except Exception as e:
    logger.exception("Unexpected error")
    raise RuntimeError("Processing failed") from e

# ❌ WRONG: Bare except
try:
    result = process_data(data)
except:  # Catches everything, including KeyboardInterrupt!
    pass  # And silently ignores it
```

### Exception Chaining

```python
# ✅ CORRECT: Chain exceptions with 'from'
def load_config(path: Path) -> dict:
    try:
        content = path.read_text()
        return json.loads(content)
    except FileNotFoundError as e:
        raise ConfigError(f"Config file not found: {path}") from e
    except json.JSONDecodeError as e:
        raise ConfigError(f"Invalid JSON in config: {path}") from e

# This preserves the original exception in __cause__
```

## Security Best Practices

### No Hardcoded Secrets

```python
# ✅ CORRECT: Environment variables
import os

API_KEY = os.environ.get("API_KEY")
if not API_KEY:
    raise ValueError("API_KEY environment variable not set")

# ✅ CORRECT: Config file (not in git)
from pathlib import Path
import json

config_path = Path.home() / ".config" / "app" / "secrets.json"
secrets = json.loads(config_path.read_text())

# ❌ WRONG: Hardcoded secrets
API_KEY = "sk-proj-abc123"  # NEVER DO THIS
```

### SQL Injection Prevention

```python
# ✅ CORRECT: Parameterized queries
cursor.execute(
    "SELECT * FROM users WHERE email = %s AND active = %s",
    (email, True)
)

# ✅ CORRECT: ORM (SQLAlchemy)
user = session.query(User).filter(
    User.email == email,
    User.active == True
).first()

# ❌ WRONG: String formatting
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")  # SQL INJECTION!
```

### Input Validation

```python
# ✅ CORRECT: Pydantic validation
from pydantic import BaseModel, EmailStr, Field

class UserInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    age: int = Field(ge=0, le=150)

def create_user(data: dict) -> User:
    validated = UserInput(**data)  # Raises ValidationError if invalid
    return User(**validated.model_dump())

# ❌ WRONG: No validation
def create_user(data):
    return User(name=data["name"], email=data["email"], age=data["age"])
```

## Performance Considerations

### Use Appropriate Data Structures

```python
# ✅ CORRECT: set for membership testing (O(1))
valid_ids = {1, 2, 3, 4, 5}
if user_id in valid_ids:
    pass

# ✅ CORRECT: dict for lookups (O(1))
user_lookup = {user.id: user for user in users}
user = user_lookup.get(user_id)

# ❌ WRONG: list for membership testing (O(n))
valid_ids = [1, 2, 3, 4, 5]
if user_id in valid_ids:  # Slow for large lists
    pass
```

### Use Generators for Large Data

```python
# ✅ CORRECT: Generator (memory efficient)
def read_large_file(path: Path):
    with path.open() as f:
        for line in f:
            yield process_line(line)

# Process one line at a time
for result in read_large_file(Path("huge.txt")):
    handle_result(result)

# ❌ WRONG: Load everything into memory
def read_large_file(path: Path):
    with path.open() as f:
        return [process_line(line) for line in f]  # OOM for huge files
```

## Code Organization

### One Class Per File (Generally)

```python
# ✅ CORRECT: user.py
"""User domain model."""

from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str
    email: str

# ✅ CORRECT: user_service.py
"""User business logic."""

class UserService:
    def create_user(self, data: dict) -> User:
        pass

# ❌ WRONG: Everything in one file
# models.py with 20 classes (split them up!)
```

### Small Functions

```python
# ✅ CORRECT: Small, focused functions
def calculate_total_price(items: list[Item]) -> float:
    """Calculate total price of items."""
    return sum(calculate_item_price(item) for item in items)

def calculate_item_price(item: Item) -> float:
    """Calculate price for single item including tax."""
    base_price = item.price * item.quantity
    return base_price * (1 + item.tax_rate)

# ❌ WRONG: Giant function (50+ lines)
def process_order(order):
    # 100 lines of mixed logic
    pass
```

## Anti-Patterns to Avoid

### Mutable Default Arguments

```python
# ✅ CORRECT
def add_item(item: str, items: list[str] | None = None) -> list[str]:
    if items is None:
        items = []
    items.append(item)
    return items

# ❌ WRONG: Mutable default (shared across calls!)
def add_item(item: str, items: list[str] = []) -> list[str]:
    items.append(item)  # Mutates shared default!
    return items
```

### Comparing to None

```python
# ✅ CORRECT: Use 'is' for None
if value is None:
    pass

if value is not None:
    pass

# ❌ WRONG: Use '==' for None
if value == None:  # Works but not idiomatic
    pass
```

### Not Using enumerate

```python
# ✅ CORRECT: Use enumerate
for i, item in enumerate(items):
    print(f"{i}: {item}")

# ❌ WRONG: Manual indexing
for i in range(len(items)):
    print(f"{i}: {items[i]}")
```

## Ruff Configuration

Add to `pyproject.toml`:

```toml
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = [
    "E",     # pycodestyle errors
    "F",     # pyflakes
    "I",     # isort
    "N",     # pep8-naming
    "UP",    # pyupgrade
    "B",     # flake8-bugbear
    "C90",   # mccabe complexity
    "S",     # bandit security
    "A",     # flake8-builtins
    "DTZ",   # flake8-datetimez
    "T20",   # flake8-print
]

ignore = [
    "E501",   # Line too long (handled by formatter)
    "S101",   # Use of assert (OK in tests)
]

[tool.ruff.lint.per-file-ignores]
"tests/**/*.py" = [
    "S101",   # Assert allowed in tests
    "S106",   # Hardcoded passwords OK in tests
]
```

## Checklist Before Committing

- [ ] All functions have type hints
- [ ] All public functions have docstrings
- [ ] No hardcoded secrets or credentials
- [ ] Ran `ruff format .`
- [ ] Ran `ruff check .` with no errors
- [ ] Ran `pyright` with no errors
- [ ] Ran `pytest` with all tests passing
- [ ] No `print()` statements (use `logging`)
- [ ] No bare `except:` clauses
- [ ] Used `pathlib` instead of `os.path`
- [ ] Used f-strings instead of `%` or `.format()`

---

**Remember**: Modern Python prioritizes readability, type safety, and explicit error handling. When in doubt, refer to PEP 8 and use automated tools (Ruff, Pyright) to enforce consistency.
