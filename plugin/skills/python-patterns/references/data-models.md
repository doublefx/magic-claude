# Python Data Models: dataclasses and Pydantic

## dataclasses (Standard Library)

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

## Pydantic (Validation + Serialization)

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
