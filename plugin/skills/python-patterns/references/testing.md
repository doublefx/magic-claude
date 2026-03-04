# Python Testing with Pytest

## Basic Test Structure

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

## Async Tests

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

## Mocking and Patching

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

## conftest.py Shared Fixtures

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
