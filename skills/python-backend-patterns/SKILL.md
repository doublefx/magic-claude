---
name: python-backend-patterns
description: Python backend architecture patterns for FastAPI, Django, SQLAlchemy, and Pydantic. Covers repository pattern, dependency injection, async patterns, and API design.
context: fork
agent: general-purpose
---

# Python Backend Patterns

Backend architecture patterns and best practices for FastAPI, Django, SQLAlchemy, and modern Python API development.

## When to Activate

- Designing FastAPI or Django REST APIs
- Working with SQLAlchemy models and queries
- Implementing service layer patterns
- Configuring authentication and authorization
- Managing database sessions and transactions

## FastAPI Patterns

### Application Structure
```python
# app/main.py
from fastapi import FastAPI
from app.api import orders, users
from app.core.config import settings

app = FastAPI(title=settings.app_name)
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
```

### Route Handlers
```python
# app/api/orders.py
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter()

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    service: OrderService = Depends(get_order_service),
):
    order = await service.find_by_id(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/", response_model=OrderResponse, status_code=201)
async def create_order(
    request: CreateOrderRequest,
    service: OrderService = Depends(get_order_service),
    user: User = Depends(get_current_user),
):
    return await service.create(request, user_id=user.id)
```

### Dependency Injection
```python
# app/dependencies.py
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

def get_order_service(db: AsyncSession = Depends(get_db)) -> OrderService:
    return OrderService(OrderRepository(db))
```

### Pydantic Models
```python
from pydantic import BaseModel, Field, ConfigDict

class CreateOrderRequest(BaseModel):
    items: list[OrderItemRequest] = Field(min_length=1)
    notes: str = Field(default="", max_length=500)

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    total: Decimal
    status: str
    items: list[OrderItemResponse]
```

## Django Patterns

### Models
```python
from django.db import models

class Order(models.Model):
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
```

### Views (DRF)
```python
from rest_framework import viewsets, permissions

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).select_related("user")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
```

## SQLAlchemy 2.0 Patterns

### Models
```python
from sqlalchemy.orm import Mapped, mapped_column, relationship, DeclarativeBase

class Base(DeclarativeBase):
    pass

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    status: Mapped[str] = mapped_column(String(20))
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")
```

### Repository Pattern
```python
class OrderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_id(self, order_id: int) -> Order | None:
        stmt = select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def save(self, order: Order) -> Order:
        self._session.add(order)
        await self._session.flush()
        return order
```

## Authentication (FastAPI + JWT)

```python
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)
    user = await user_repo.find_by_id(int(user_id))
    if user is None:
        raise HTTPException(status_code=401)
    return user
```

## Error Handling

```python
# FastAPI exception handlers
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(OrderNotFoundError)
async def order_not_found_handler(request: Request, exc: OrderNotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})

@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})
```

## Key Principles

- Pydantic for all request/response validation
- Dependency injection via FastAPI `Depends()`
- `from_attributes=True` for ORM model serialization
- Async everywhere (FastAPI + SQLAlchemy async)
- Repository pattern for data access
- N+1 prevention with `selectinload`/`joinedload`
- Pagination for list endpoints
- Type hints on all functions
