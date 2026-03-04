# Python Design Patterns and Performance Tips

## Performance Tips

### Use generators for large datasets

```python
def read_large_file(file_path: Path):
    with file_path.open() as f:
        for line in f:
            yield process_line(line)
```

### Use `set()` for membership testing

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

### Use list comprehensions

```python
# ✅ Fast
squares = [x**2 for x in range(1000)]

# ❌ Slower
squares = []
for x in range(1000):
    squares.append(x**2)
```

### Profile before optimizing

```bash
# Profile with cProfile
python -m cProfile -o profile.stats my_script.py

# Analyze with snakeviz
pip install snakeviz
snakeviz profile.stats
```

## Singleton Pattern

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

## Factory Pattern

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

## Dependency Injection

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
