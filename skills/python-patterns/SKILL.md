---
name: python-patterns
description: Python project structure, modern packaging (uv, poetry, pyproject.toml), virtual environments, async patterns, type hints, and testing with pytest. Modern Python 2026 best practices.
user-invocable: false
---

# Python Project Patterns (2026)

Modern Python development patterns emphasizing type safety, performance, and developer experience with cutting-edge tooling.

## When to Activate

- Setting up Python projects (pyproject.toml, uv, poetry)
- Writing async Python code or type-annotated modules
- Configuring virtual environments and packaging
- Testing with pytest and modern Python tooling

## Project Structure

### Standard Python Package Layout

```
my_project/
├── src/
│   └── my_project/
│       ├── __init__.py
│       ├── main.py
│       ├── core/
│       │   ├── __init__.py
│       │   └── models.py
│       └── utils/
│           ├── __init__.py
│           └── helpers.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_main.py
│   └── test_utils.py
├── docs/
│   └── index.md
├── pyproject.toml
├── README.md
├── .gitignore
└── .python-version
```

**Key Principles:**
- **src-layout**: Place code in `src/` to avoid import confusion during testing
- **Package naming**: Use underscores, not hyphens (`my_project` not `my-project`)
- **Init files**: `__init__.py` marks directories as packages
- **Tests mirror structure**: `tests/` structure matches `src/` structure

### pyproject.toml Configuration

Modern Python uses `pyproject.toml` for **all** configuration (not setup.py).

```toml
[project]
name = "my-project"
version = "0.1.0"
description = "A modern Python project"
readme = "README.md"
requires-python = ">=3.11"
authors = [
    {name = "Your Name", email = "you@example.com"}
]
dependencies = [
    "requests>=2.31.0",
    "pydantic>=2.5.0",
    "fastapi>=0.104.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "ruff>=0.1.0",
    "pyright>=1.1.0",
]

[project.scripts]
my-cli = "my_project.main:cli"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

# Ruff configuration (linter + formatter)
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "F",   # pyflakes
    "I",   # isort
    "N",   # pep8-naming
    "UP",  # pyupgrade
    "B",   # flake8-bugbear
    "C90", # mccabe complexity
    "S",   # bandit security
]
ignore = [
    "E501",  # Line too long (handled by formatter)
]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"

# Pyright configuration (type checker)
[tool.pyright]
typeCheckingMode = "strict"
reportMissingTypeStubs = false
pythonVersion = "3.11"

# Pytest configuration
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
addopts = [
    "--strict-markers",
    "--cov=my_project",
    "--cov-report=term-missing",
    "--cov-report=html",
]

# Coverage configuration
[tool.coverage.run]
source = ["src"]
omit = ["*/tests/*", "*/test_*.py"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
    "if TYPE_CHECKING:",
]
```

## Modern Package Management (2026)

### uv - Recommended (10-100x faster than pip)

**Why uv?**
- Written in Rust, extremely fast
- Drop-in replacement for pip
- Handles virtual environments automatically
- Resolves dependencies in parallel

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create project
uv init my-project
cd my-project

# Create virtual environment (automatic)
uv venv

# Install dependencies
uv pip install -r requirements.txt

# Add dependency (updates pyproject.toml)
uv pip install requests

# Install dev dependencies
uv pip install -e ".[dev]"

# Run script with uv (auto-activates venv)
uv run python src/main.py

# Run tests
uv run pytest

# Run with specific Python version
uv run --python 3.11 python src/main.py
```

### poetry - Alternative (Feature-Rich)

```bash
# Install poetry
curl -sSL https://install.python-poetry.org | python3 -

# Create project
poetry new my-project
cd my-project

# Add dependency
poetry add requests

# Add dev dependency
poetry add --group dev pytest

# Install dependencies
poetry install

# Run script
poetry run python src/main.py

# Run tests
poetry run pytest

# Update dependencies
poetry update

# Show dependency tree
poetry show --tree
```

### pip + venv - Traditional (Still Valid)

```bash
# Create virtual environment
python -m venv .venv

# Activate (Linux/Mac)
source .venv/bin/activate

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install in editable mode
pip install -e ".[dev]"

# Freeze dependencies
pip freeze > requirements.txt

# Deactivate
deactivate
```

## Type Hints Best Practices

### Modern Type Syntax (Python 3.9+)

```python
from typing import Optional, TypedDict, Protocol, TypeVar, Generic
from collections.abc import Sequence, Mapping, Callable

# ✅ Use built-in types (Python 3.9+)
def process_items(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

# ✅ Use Optional for nullable values
def find_user(user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

# ✅ Use union types (Python 3.10+)
def parse_value(value: str | int | float) -> float:
    return float(value)

# ❌ Old style (avoid)
def process_items(items: List[str]) -> Dict[str, int]:  # Deprecated
    pass
```

### TypedDict for Structured Dictionaries

```python
from typing import TypedDict, NotRequired

class UserData(TypedDict):
    id: int
    name: str
    email: str
    age: NotRequired[int]  # Optional field (Python 3.11+)

def create_user(data: UserData) -> User:
    # Type checker knows all required fields
    user = User(
        id=data["id"],
        name=data["name"],
        email=data["email"],
    )
    return user
```

### Protocols for Structural Subtyping

```python
from typing import Protocol

class Drawable(Protocol):
    """Any object with a draw method."""
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print("Drawing circle")

class Square:
    def draw(self) -> None:
        print("Drawing square")

# Both Circle and Square satisfy Drawable protocol
def render(shape: Drawable) -> None:
    shape.draw()

render(Circle())  # ✅ Works
render(Square())  # ✅ Works
```

### Generics for Reusable Code

```python
from typing import TypeVar, Generic

T = TypeVar("T")

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

# Type checker knows these are different types
int_stack = Stack[int]()
str_stack = Stack[str]()

int_stack.push(42)      # ✅ OK
int_stack.push("text")  # ❌ Type error
```

## Async/Await Patterns

### Basic Async Operations

```python
import asyncio
import aiohttp
from typing import Sequence

async def fetch_url(session: aiohttp.ClientSession, url: str) -> dict:
    """Fetch data from a single URL."""
    async with session.get(url) as response:
        return await response.json()

async def fetch_multiple(urls: Sequence[str]) -> list[dict]:
    """Fetch data from multiple URLs concurrently."""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
        return results

# Run async code
urls = ["https://api.example.com/1", "https://api.example.com/2"]
results = asyncio.run(fetch_multiple(urls))
```

### Async Context Managers

```python
from contextlib import asynccontextmanager
from typing import AsyncIterator

@asynccontextmanager
async def get_database_connection() -> AsyncIterator[Connection]:
    """Async context manager for database connection."""
    conn = await create_connection()
    try:
        yield conn
    finally:
        await conn.close()

# Usage
async def query_user(user_id: int) -> User:
    async with get_database_connection() as conn:
        result = await conn.execute("SELECT * FROM users WHERE id = $1", user_id)
        return User.from_row(result)
```

### Async Iteration

```python
from typing import AsyncIterator

async def fetch_paginated_data(api_url: str) -> AsyncIterator[dict]:
    """Async generator for paginated API results."""
    page = 1
    async with aiohttp.ClientSession() as session:
        while True:
            async with session.get(f"{api_url}?page={page}") as response:
                data = await response.json()
                if not data:
                    break
                for item in data:
                    yield item
                page += 1

# Usage
async def process_all_data():
    async for item in fetch_paginated_data("https://api.example.com/data"):
        await process_item(item)
```

### Task Management

```python
import asyncio
from typing import Coroutine, Any

async def process_with_timeout(coro: Coroutine[Any, Any, T], timeout: float) -> T:
    """Run coroutine with timeout."""
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except asyncio.TimeoutError:
        print(f"Operation timed out after {timeout}s")
        raise

async def process_with_retries(coro: Coroutine[Any, Any, T], max_retries: int = 3) -> T:
    """Run coroutine with retry logic."""
    for attempt in range(max_retries):
        try:
            return await coro
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)  # Exponential backoff
```

## Dataclasses and Pydantic

### dataclasses (Standard Library)

```python
from dataclasses import dataclass, field
from typing import ClassVar

@dataclass
class Point:
    """A point in 2D space."""
    x: float
    y: float

@dataclass
class Circle:
    """A circle with center and radius."""
    center: Point
    radius: float
    _id_counter: ClassVar[int] = 0  # Class variable
    id: int = field(init=False)  # Set in __post_init__

    def __post_init__(self):
        Circle._id_counter += 1
        self.id = Circle._id_counter

    def area(self) -> float:
        from math import pi
        return pi * self.radius ** 2

# Usage
p = Point(1.0, 2.0)
c = Circle(center=p, radius=5.0)
print(c.area())  # 78.53981633974483
```

### Pydantic (Validation + Serialization)

```python
from pydantic import BaseModel, Field, EmailStr, HttpUrl, field_validator
from datetime import datetime

class User(BaseModel):
    """User model with validation."""
    id: int
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    age: int = Field(ge=0, le=150)
    website: HttpUrl | None = None
    created_at: datetime = Field(default_factory=datetime.now)

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

# Usage (automatic validation)
try:
    user = User(
        id=1,
        name="John Doe",
        email="john@example.com",
        age=30,
    )
    print(user.model_dump())  # Convert to dict
    print(user.model_dump_json())  # Convert to JSON
except ValidationError as e:
    print(e.json())
```

## Testing with Pytest

### Basic Test Structure

```python
import pytest
from my_project.calculator import Calculator

# Fixtures
@pytest.fixture
def calculator():
    """Provide a Calculator instance for tests."""
    return Calculator()

@pytest.fixture
def sample_data():
    """Provide sample data."""
    return [1, 2, 3, 4, 5]

# Tests
def test_add(calculator):
    """Test addition."""
    result = calculator.add(2, 3)
    assert result == 5

def test_divide_by_zero(calculator):
    """Test division by zero raises exception."""
    with pytest.raises(ZeroDivisionError):
        calculator.divide(10, 0)

def test_process_data(sample_data):
    """Test data processing."""
    result = sum(sample_data)
    assert result == 15

# Parametrized tests
@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (0, 0, 0),
    (-1, 1, 0),
    (100, 200, 300),
])
def test_add_parametrized(calculator, a, b, expected):
    """Test addition with multiple inputs."""
    assert calculator.add(a, b) == expected
```

### Async Tests

```python
import pytest
import asyncio

@pytest.fixture
async def async_client():
    """Provide an async HTTP client."""
    async with aiohttp.ClientSession() as session:
        yield session

@pytest.mark.asyncio
async def test_fetch_data(async_client):
    """Test async data fetching."""
    data = await fetch_url(async_client, "https://api.example.com/data")
    assert data is not None
    assert "id" in data
```

### Mocking and Patching

```python
from unittest.mock import Mock, patch, AsyncMock

def test_api_call_with_mock():
    """Test API call with mocked response."""
    with patch("requests.get") as mock_get:
        mock_response = Mock()
        mock_response.json.return_value = {"id": 1, "name": "Test"}
        mock_response.status_code = 200
        mock_get.return_value = mock_response

        result = fetch_user(1)
        assert result["name"] == "Test"
        mock_get.assert_called_once_with("https://api.example.com/users/1")

@pytest.mark.asyncio
async def test_async_function_with_mock():
    """Test async function with AsyncMock."""
    mock_fetch = AsyncMock(return_value={"data": "test"})

    with patch("my_module.fetch_data", mock_fetch):
        result = await process_data()
        assert result == {"data": "test"}
        mock_fetch.assert_awaited_once()
```

### conftest.py Shared Fixtures

```python
# tests/conftest.py
import pytest
from pathlib import Path
from my_project.database import Database

@pytest.fixture(scope="session")
def test_data_dir() -> Path:
    """Provide test data directory."""
    return Path(__file__).parent / "data"

@pytest.fixture(scope="function")
async def db():
    """Provide a test database."""
    database = Database(":memory:")
    await database.connect()
    yield database
    await database.disconnect()

@pytest.fixture(autouse=True)
def reset_environment():
    """Reset environment variables before each test."""
    import os
    original_env = os.environ.copy()
    yield
    os.environ.clear()
    os.environ.update(original_env)
```

## File and Path Handling

### Use pathlib (Not os.path)

```python
from pathlib import Path

# ✅ Modern way
project_root = Path(__file__).parent.parent
config_file = project_root / "config" / "settings.json"
data_dir = project_root / "data"

# Create directory
data_dir.mkdir(parents=True, exist_ok=True)

# Read file
content = config_file.read_text()

# Write file
config_file.write_text('{"key": "value"}')

# Iterate files
for file in data_dir.glob("*.json"):
    print(file.name)

# Check existence
if config_file.exists():
    print("Config found")

# ❌ Old way (avoid)
import os
config_file = os.path.join(os.path.dirname(__file__), "..", "config", "settings.json")
```

## Error Handling

### Custom Exceptions

```python
class AppError(Exception):
    """Base exception for application errors."""
    pass

class ValidationError(AppError):
    """Raised when validation fails."""
    pass

class NotFoundError(AppError):
    """Raised when resource is not found."""
    pass

class DatabaseError(AppError):
    """Raised when database operation fails."""
    pass

# Usage
def get_user(user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError(f"User {user_id} not found")
    return user
```

### Error Context and Chaining

```python
import logging

logger = logging.getLogger(__name__)

def process_data(file_path: Path) -> dict:
    """Process data from file."""
    try:
        content = file_path.read_text()
        return parse_json(content)
    except FileNotFoundError as e:
        logger.error(f"File not found: {file_path}")
        raise ValidationError(f"Cannot process missing file: {file_path}") from e
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {file_path}: {e}")
        raise ValidationError(f"Invalid JSON format in {file_path}") from e
    except Exception as e:
        logger.exception(f"Unexpected error processing {file_path}")
        raise AppError(f"Failed to process {file_path}") from e
```

## Logging

### Modern Logging Setup

```python
import logging
import sys
from pathlib import Path

def setup_logging(log_level: str = "INFO", log_file: Path | None = None):
    """Configure application logging."""
    handlers: list[logging.Handler] = [
        logging.StreamHandler(sys.stdout)
    ]

    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        handlers.append(logging.FileHandler(log_file))

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=handlers,
    )

# Usage in main
logger = logging.getLogger(__name__)

def main():
    setup_logging(log_level="INFO", log_file=Path("logs/app.log"))
    logger.info("Application started")
    try:
        run_app()
    except Exception as e:
        logger.exception("Application crashed")
        raise
```

## Performance Tips

1. **Use generators for large datasets:**
   ```python
   def read_large_file(file_path: Path):
       with file_path.open() as f:
           for line in f:
               yield process_line(line)
   ```

2. **Use `set()` for membership testing:**
   ```python
   # ✅ O(1) lookup
   valid_ids = {1, 2, 3, 4, 5}
   if user_id in valid_ids:
       pass

   # ❌ O(n) lookup
   valid_ids = [1, 2, 3, 4, 5]
   if user_id in valid_ids:
       pass
   ```

3. **Use list comprehensions:**
   ```python
   # ✅ Fast
   squares = [x**2 for x in range(1000)]

   # ❌ Slower
   squares = []
   for x in range(1000):
       squares.append(x**2)
   ```

4. **Profile before optimizing:**
   ```bash
   # Profile with cProfile
   python -m cProfile -o profile.stats my_script.py

   # Analyze with snakeviz
   pip install snakeviz
   snakeviz profile.stats
   ```

## Common Patterns

### Singleton Pattern

```python
class DatabaseConnection:
    _instance: "DatabaseConnection | None" = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, "initialized"):
            self.connection = create_connection()
            self.initialized = True
```

### Factory Pattern

```python
from typing import Protocol

class Parser(Protocol):
    def parse(self, content: str) -> dict: ...

class JSONParser:
    def parse(self, content: str) -> dict:
        import json
        return json.loads(content)

class YAMLParser:
    def parse(self, content: str) -> dict:
        import yaml
        return yaml.safe_load(content)

def create_parser(file_type: str) -> Parser:
    """Factory function for parsers."""
    if file_type == "json":
        return JSONParser()
    elif file_type == "yaml":
        return YAMLParser()
    else:
        raise ValueError(f"Unknown file type: {file_type}")
```

### Dependency Injection

```python
from typing import Protocol

class EmailService(Protocol):
    def send(self, to: str, subject: str, body: str) -> None: ...

class UserService:
    def __init__(self, email_service: EmailService):
        self.email_service = email_service

    def create_user(self, email: str, name: str) -> User:
        user = User(email=email, name=name)
        self.email_service.send(
            to=email,
            subject="Welcome!",
            body=f"Hello {name}!",
        )
        return user

# Usage
email_service = SMTPEmailService()
user_service = UserService(email_service)
```

---

**Remember**: Modern Python (2026) prioritizes developer experience through excellent tooling. Use `uv` for speed, `ruff` for linting/formatting, `pyright` for type checking, and `pytest` for testing. Always add type hints and write tests!
