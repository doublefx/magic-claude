# Common Patterns

## TypeScript/JavaScript Patterns

### API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}
```

### Custom Hooks Pattern

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

### Repository Pattern (TypeScript)

```typescript
interface Repository<T> {
  findAll(filters?: Filters): Promise<T[]>
  findById(id: string): Promise<T | null>
  create(data: CreateDto): Promise<T>
  update(id: string, data: UpdateDto): Promise<T>
  delete(id: string): Promise<void>
}
```

## JVM Patterns (Java/Kotlin)

### Repository Pattern (Spring Data JPA)

```java
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT o FROM Order o WHERE o.status = :status")
    List<Order> findByStatus(@Param("status") OrderStatus status);

    @Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);
}
```

### DTO Records Pattern

```java
public record CreateOrderRequest(
    @NotNull @Size(min = 1) List<OrderItemRequest> items,
    @Size(max = 500) String notes
) {
    public Order toDomain() {
        return new Order(items.stream().map(OrderItemRequest::toDomain).toList());
    }
}

public record OrderResponse(Long id, BigDecimal total, String status) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(order.getId(), order.getTotal(), order.getStatus().name());
    }
}
```

### Service Layer Pattern

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {
    private final OrderRepository orderRepository;

    public Optional<Order> findById(Long id) {
        return orderRepository.findById(id);
    }

    @Transactional
    public Order create(Order order) {
        return orderRepository.save(order);
    }
}
```

## Python Patterns

### Repository Pattern (SQLAlchemy)

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

### Pydantic Models Pattern

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

### FastAPI Dependency Injection

```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

def get_order_service(db: AsyncSession = Depends(get_db)) -> OrderService:
    return OrderService(OrderRepository(db))
```

## Skeleton Projects

When implementing new functionality:
1. Search for battle-tested skeleton projects
2. Use parallel agents to evaluate options:
   - Security assessment
   - Extensibility analysis
   - Relevance scoring
   - Implementation planning
3. Clone best match as foundation
4. Iterate within proven structure
