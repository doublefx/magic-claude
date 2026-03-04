# Python Package Management (2026)

## uv - Recommended (10-100x faster than pip)

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

## poetry - Alternative (Feature-Rich)

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

## pip + venv - Traditional (Still Valid)

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
