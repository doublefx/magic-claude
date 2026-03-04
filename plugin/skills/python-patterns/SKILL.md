---
name: python-patterns
description: Modern Python project structure and packaging patterns (2026). Use when setting up a new Python project (pyproject.toml, uv, poetry), configuring virtual environments, writing async Python code, structuring packages, or asking about Python tooling and best practices. Also triggers when modernizing an existing Python project or configuring pytest. Consult before starting any Python project setup.
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

Standard `src/` layout with `pyproject.toml` as the single configuration file for all tooling (ruff, pyright, pytest, coverage).

- Use `src/<package>/` to avoid import confusion during testing; mirror structure in `tests/`
- Use underscores in package names (`my_project`, not `my-project`); all directories need `__init__.py`
- Configure ruff, pyright, pytest, and coverage all inside `pyproject.toml` — no separate config files

See [references/project-structure.md](references/project-structure.md) for the full directory layout and a complete `pyproject.toml` template.

## Package Management

Three options in 2026, with `uv` strongly preferred for new projects.

- **uv** (recommended): Rust-based, 10-100x faster than pip, handles venvs automatically, supports `uv run` to auto-activate
- **poetry**: Feature-rich alternative with lock files, dependency groups, and `poetry show --tree`
- **pip + venv**: Traditional approach, still valid; use `pip install -e ".[dev]"` for editable installs

See [references/package-management.md](references/package-management.md) for full command references for all three tools.

## Type Hints

Always use type hints. Prefer modern syntax introduced in Python 3.9+ and 3.10+.

- Use built-in generics (`list[str]`, `dict[str, int]`) instead of `typing.List`/`typing.Dict`
- Use `X | Y` union syntax (Python 3.10+) instead of `Union[X, Y]`
- Use `TypedDict` for structured dictionaries, `Protocol` for structural subtyping, `Generic[T]` for reusable containers

See [references/type-hints.md](references/type-hints.md) for syntax examples and patterns.

## Async/Await Patterns

Use `asyncio` with `aiohttp` for concurrent I/O. Always run top-level with `asyncio.run()`.

- Concurrent HTTP: `asyncio.gather(*tasks)` to fan out requests across a shared `ClientSession`
- Resource management: `@asynccontextmanager` for async context managers; use `async with` for connections
- Async generators: `AsyncIterator[T]` return type for `async def` generators (e.g., paginated APIs)
- Task control: `asyncio.wait_for(coro, timeout)` for timeouts; exponential backoff for retries

See [references/async-patterns.md](references/async-patterns.md) for complete code examples.

## Data Models

Prefer `dataclass` for plain data containers; use `pydantic` when validation or serialization is needed.

- `@dataclass`: Standard library, use `field(init=False)` and `__post_init__` for derived fields; use `ClassVar` for class-level state
- `pydantic.BaseModel`: Automatic validation via `Field(ge=0, le=150)`, `EmailStr`, `HttpUrl`; use `@field_validator` for custom rules
- Serialize with `model_dump()` (dict) and `model_dump_json()` (JSON string)

See [references/data-models.md](references/data-models.md) for full examples.

## Testing with Pytest

Structure tests to mirror `src/`, use fixtures in `conftest.py`, and parametrize for coverage breadth.

- Fixtures: scope with `scope="session"` / `scope="function"`; use `autouse=True` for environment resets
- Async: mark with `@pytest.mark.asyncio`; use `AsyncMock` for patching coroutines
- Mocking: `unittest.mock.patch` as context manager; assert with `assert_called_once_with` / `assert_awaited_once`
- Coverage: configure `--cov` and `--cov-report` in `pyproject.toml` `addopts`

See [references/testing.md](references/testing.md) for fixture patterns, async tests, and mock examples.

## File Handling, Error Handling, and Logging

Always use `pathlib.Path` instead of `os.path`. Define a custom exception hierarchy rooted at a base `AppError`.

- Path operations: `Path(__file__).parent`, `/` operator for joining, `.read_text()`, `.write_text()`, `.glob()`
- Exceptions: subclass `AppError` → `ValidationError`, `NotFoundError`, `DatabaseError`; always chain with `raise X from e`
- Logging: call `logging.basicConfig()` once at startup with `StreamHandler` + optional `FileHandler`; use `logger.exception()` to capture tracebacks

See [references/utilities.md](references/utilities.md) for complete patterns.

## Design Patterns and Performance

Apply standard OOP patterns using Python idioms; optimize data structures before algorithms.

- **Singleton**: `__new__` guard with `hasattr(self, "initialized")` check in `__init__`
- **Factory**: return Protocol-typed instances from a dispatch function; raise `ValueError` for unknown types
- **Dependency injection**: accept Protocol-typed collaborators in `__init__`; enables easy mocking in tests
- **Performance**: prefer `set` for O(1) membership tests, list comprehensions over `append` loops, generators for large data; profile with `cProfile` + `snakeviz` before optimizing

See [references/patterns.md](references/patterns.md) for full code examples.

## Reference Files

| File | Contents |
|------|----------|
| [references/project-structure.md](references/project-structure.md) | `src/` layout, full `pyproject.toml` template |
| [references/package-management.md](references/package-management.md) | uv, poetry, pip+venv command references |
| [references/type-hints.md](references/type-hints.md) | Modern syntax, TypedDict, Protocol, Generics |
| [references/async-patterns.md](references/async-patterns.md) | asyncio, aiohttp, async generators, task control |
| [references/data-models.md](references/data-models.md) | dataclasses, Pydantic v2 models |
| [references/testing.md](references/testing.md) | pytest fixtures, async tests, mocking |
| [references/utilities.md](references/utilities.md) | pathlib, custom exceptions, logging setup |
| [references/patterns.md](references/patterns.md) | Singleton, Factory, DI, performance tips |

---

**Remember**: Modern Python (2026) prioritizes developer experience through excellent tooling. Use `uv` for speed, `ruff` for linting/formatting, `pyright` for type checking, and `pytest` for testing. Always add type hints and write tests!
