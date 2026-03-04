# Python Utilities: File Handling, Error Handling, and Logging

## File and Path Handling with pathlib

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

## Custom Exceptions

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

## Error Context and Chaining

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

## Modern Logging Setup

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
