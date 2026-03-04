# Python Type Hints Best Practices

## Modern Type Syntax (Python 3.9+)

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

## TypedDict for Structured Dictionaries

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

## Protocols for Structural Subtyping

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

## Generics for Reusable Code

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
