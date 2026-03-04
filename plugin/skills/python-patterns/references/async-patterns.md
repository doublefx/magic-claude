# Python Async/Await Patterns

## Basic Async Operations

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

## Async Context Managers

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

## Async Iteration

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

## Task Management

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
