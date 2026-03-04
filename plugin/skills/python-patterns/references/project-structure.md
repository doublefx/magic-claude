# Python Project Structure

## Standard Python Package Layout

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

## pyproject.toml Configuration

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
