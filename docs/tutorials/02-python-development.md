# Tutorial 2: Python Development Workflow

**Duration**: 30 minutes
**Prerequisites**: Tutorial 01 completed, Python 3.10+
**Learning Goals**: Set up modern Python tooling, use Python-specific features, auto-formatting, security scanning

---

## Overview

This tutorial covers the complete Python development workflow with v2.0:
- Modern 2026 tooling (Ruff, uv, Pyright, Semgrep)
- Auto-formatting and linting
- Security scanning
- Python code review
- CI/CD pipeline generation

---

## Step 1: Install Python Tooling (5 minutes)

### Install Modern Python Tools

```bash
# Option 1: Using pip
pip install ruff pyright semgrep pytest pytest-cov

# Option 2: Using uv (recommended - 30x faster)
curl -LsSf https://astral.sh/uv/install.sh | sh
uv pip install ruff pyright semgrep pytest pytest-cov

# Verify installation
ruff --version
pyright --version
semgrep --version
```

### Why These Tools?

| Tool | Purpose | Speed vs 2024 |
|------|---------|--------------|
| **Ruff** | Formatter + Linter | 100x faster than black/flake8 |
| **uv** | Package manager | 30x faster than pip |
| **Pyright** | Type checker | 3x faster than mypy |
| **Semgrep** | Security scanner | 3.5x faster than bandit |

---

## Step 2: Create a Python Project (5 minutes)

### Initialize Project

```bash
# Create project directory
mkdir python-api-demo
cd python-api-demo

# Create pyproject.toml
cat > pyproject.toml << 'EOF'
[project]
name = "python-api-demo"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.109.0",
    "uvicorn>=0.27.0",
    "pydantic>=2.5.0",
]

[project.optional-dependencies]
dev = [
    "ruff>=0.1.0",
    "pyright>=1.1.0",
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
]

[tool.ruff]
line-length = 100
target-version = "py310"

[tool.pyright]
pythonVersion = "3.10"
typeCheckingMode = "basic"
EOF

# Install dependencies
uv pip install -e ".[dev]"
```

### Create Basic FastAPI App

```bash
# Create source directory
mkdir -p src/api

# Create main.py
cat > src/api/main.py << 'EOF'
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Python API Demo")

class HealthResponse(BaseModel):
    status: str
    version: str

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(status="healthy", version="0.1.0")

@app.get("/users/{user_id}")
def get_user(user_id: int):
    # TODO: Implement user lookup
    return {"id": user_id, "name": "John Doe"}
EOF

# Create __init__.py
touch src/api/__init__.py
```

---

## Step 3: Test Auto-Formatting (5 minutes)

### Edit a File with Claude

Start Claude Code:

```bash
cd python-api-demo
claude
```

**Ask Claude**:
```
"Add a POST endpoint to create users in src/api/main.py"
```

**Claude will**:
1. Edit the file
2. **Auto-format with Ruff** (happens automatically!)
3. Return formatted code

### Verify Formatting

```bash
# Check the file
cat src/api/main.py

# You should see:
# - Proper indentation
# - Sorted imports
# - Consistent formatting
# - PEP 8 compliance
```

### Manual Formatting

You can also format manually:

```bash
# Format all Python files
ruff format .

# Check linting
ruff check .

# Fix auto-fixable issues
ruff check --fix .
```

---

## Step 4: Python Code Review (5 minutes)

### Use the Python Reviewer Agent

**Ask Claude**:
```
/python-reviewer
```

**The agent will check**:
- PEP 8 compliance
- Type hints present
- Security issues (SQL injection, XSS)
- Modern Python idioms (f-strings, dataclasses)
- Error handling
- Documentation

### Example Review Output

```
Python Code Review: src/api/main.py

✅ Strengths:
- Uses Pydantic models for validation
- Type hints present
- FastAPI best practices followed

⚠️  Suggestions:
1. Add docstrings to functions (line 12, 17)
2. Use async endpoints for better performance
3. Add error handling for user_id validation
4. Consider using dependency injection for database

🔒 Security:
- No critical issues found
- Consider adding rate limiting
- Add authentication for user endpoints

📝 Recommendations:
1. Add pytest tests
2. Use async/await for I/O operations
3. Add logging
```

---

## Step 5: Apply Python Patterns (5 minutes)

### Use Python Patterns Skill

**Ask Claude**:
```
"Apply python-patterns skill to improve the user endpoint"
```

**Claude will suggest**:
```python
from typing import Annotated
from fastapi import Depends, HTTPException, status
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

class User(BaseModel):
    """User model with validation."""
    id: int = Field(..., ge=1, description="User ID must be positive")
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")

async def get_user_from_db(user_id: int) -> User | None:
    """Fetch user from database (async)."""
    # TODO: Implement database lookup
    logger.info(f"Fetching user {user_id}")
    return User(id=user_id, name="John Doe", email="john@example.com")

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int) -> User:
    """Get user by ID."""
    user = await get_user_from_db(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    return user
```

**Improvements**:
- ✅ Async/await for performance
- ✅ Type hints with `|` syntax (Python 3.10+)
- ✅ Pydantic validation
- ✅ Proper error handling
- ✅ Logging
- ✅ Docstrings

---

## Step 6: Security Scanning (3 minutes)

### Automatic Security Scanning

The `python-security.js` hook runs automatically on file save.

**Test it**:

```python
# Add this BAD code to main.py (intentionally vulnerable)
@app.get("/search")
def search_users(query: str):
    # SQL injection vulnerability!
    import sqlite3
    conn = sqlite3.connect("users.db")
    cursor = conn.execute(f"SELECT * FROM users WHERE name = '{query}'")
    return cursor.fetchall()
```

**Save the file** (via Claude or manually).

**Expected Output**:
```
[Hook] Semgrep: Found 1 issue in src/api/main.py

  ❌ SQL injection vulnerability (line 23)
     Detected string concatenation in SQL query. Use parameterized queries.

     cursor.execute(f"SELECT * FROM users WHERE name = '{query}'")
                                                         ^^^^^^^
     Fix: cursor.execute("SELECT * FROM users WHERE name = ?", (query,))

[Hook] Security scan complete
```

### Manual Security Scan

```bash
# Run Semgrep manually
semgrep --config auto src/

# Run with specific rulesets
semgrep --config "p/owasp-top-ten" src/
semgrep --config "p/python" src/
```

---

## Step 7: Add Tests (4 minutes)

### Create Tests

```bash
# Create tests directory
mkdir -p tests

# Create test file
cat > tests/test_main.py << 'EOF'
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "version": "0.1.0"}

def test_get_user():
    response = client.get("/users/1")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["id"] == 1
EOF
```

### Run Tests

```bash
# Run tests
pytest

# With coverage
pytest --cov=src --cov-report=term-missing

# Expected output:
# tests/test_main.py ..                                    [100%]
#
# ----------- coverage: ... -----------
# Name                    Stmts   Miss  Cover   Missing
# -----------------------------------------------------
# src/api/main.py            15      2    87%   18-19
# -----------------------------------------------------
# TOTAL                      15      2    87%
```

---

## Step 8: Generate CI/CD Pipeline (3 minutes)

### Generate GitHub Actions Workflow

**Ask Claude**:
```
/ci-cd github-actions python
```

**Generated File**: `.github/workflows/ci.yml`

```yaml
name: Python CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Install dependencies
        run: uv pip install -e ".[dev]"

      - name: Lint with Ruff
        run: ruff check .

      - name: Type check with Pyright
        run: pyright .

      - name: Test with pytest
        run: pytest --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Semgrep
        run: |
          python3 -m pip install semgrep
          semgrep --config auto .
```

---

## Complete Python Workflow Summary

```bash
# 1. Create/edit Python code
# (Auto-formatting happens automatically via hook)

# 2. Review code
/python-reviewer

# 3. Apply patterns
# Ask: "Apply python-patterns"

# 4. Security check (automatic on save, or manual):
semgrep --config auto src/

# 5. Run tests
pytest --cov=src

# 6. Type check
pyright .

# 7. Lint
ruff check .

# 8. Generate CI/CD
/ci-cd github-actions python

# 9. Commit and push
git add .
git commit -m "feat: add user endpoints"
git push
```

---

## Best Practices Checklist

- [ ] Use `pyproject.toml` for configuration
- [ ] Add type hints to all functions
- [ ] Use Pydantic for validation
- [ ] Use async/await for I/O operations
- [ ] Add docstrings to all public functions
- [ ] Use f-strings (not `%` or `.format()`)
- [ ] Use `|` for union types (Python 3.10+)
- [ ] Add error handling with proper exceptions
- [ ] Use logging (not print statements)
- [ ] Write tests for all endpoints
- [ ] Maintain 80%+ code coverage
- [ ] Run Semgrep for security checks
- [ ] Format with Ruff before committing
- [ ] Use uv for faster package installation

---

## Next Steps

- **Tutorial 03**: [Java Development](03-java-development.md)
- **Tutorial 04**: [CI/CD Generation](04-cicd-generation.md)
- **Tutorial 05**: [Advanced Features](05-advanced-features.md)

---

**Congratulations!** You now have a complete modern Python development workflow with v2.0.
