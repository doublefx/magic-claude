---
name: backend-patterns
description: >
  Backend architecture patterns for Node.js/Next.js, JVM (Spring Boot/JPA), and Python
  (FastAPI/Django/SQLAlchemy). Use when designing REST endpoints, implementing authentication,
  structuring services, optimizing queries, or building any server-side feature. Detects
  ecosystem and loads the matching architecture reference automatically.
user-invocable: false
context: fork
agent: general-purpose
allowed-tools: Read
---

# Backend Development Patterns

## Ecosystem Detection

Detect the project ecosystem, then **immediately read the matching reference**:

| Ecosystem | Indicators | Reference to read |
|-----------|-----------|-------------------|
| TypeScript / JavaScript | `package.json`, `.ts`, `.tsx`, `.js` | Multiple — see Node.js/Next.js sections below |
| JVM (Spring Boot) | `build.gradle`, `pom.xml`, `.java`, `.kt` | [references/jvm-patterns.md](references/jvm-patterns.md) |
| Python (FastAPI/Django) | `pyproject.toml`, `requirements.txt`, `.py` | [references/python-patterns.md](references/python-patterns.md) |

## When to Activate

- Designing API endpoints (REST, GraphQL)
- Optimizing database queries and caching
- Structuring backend services
- Implementing error handling and authentication patterns

## API Design Patterns

- Resource-based URLs with standard HTTP verbs (GET, POST, PUT, PATCH, DELETE)
- Repository pattern to abstract data access behind a typed interface
- Service layer to hold business logic, separate from data access and HTTP routing
- Middleware pattern for cross-cutting concerns: auth, logging, validation

See [references/api-design.md](references/api-design.md)

## Database Patterns

- Select only needed columns — never use `SELECT *` in production queries
- Batch fetch related records to eliminate N+1 query problems
- Wrap multi-step writes in transactions (Supabase RPC or ORM transactions)

See [references/database-patterns.md](references/database-patterns.md)

## Caching Strategies

- Wrap repository with a caching decorator that checks Redis before hitting the DB
- Cache-aside pattern: read from cache, fall back to DB on miss, populate cache on return
- Always set TTL and provide an explicit cache invalidation method

See [references/caching-strategies.md](references/caching-strategies.md)

## Error Handling Patterns

- Centralized `ApiError` class carrying `statusCode` and `isOperational` flag
- Single `errorHandler` function handles `ApiError`, `ZodError`, and unexpected errors
- Retry with exponential backoff (1 s, 2 s, 4 s) for transient failures

See [references/error-handling.md](references/error-handling.md)

## Authentication & Authorization

- Extract and verify JWT via `requireAuth` helper in every protected route
- Role-permission map (`admin | moderator | user` → `Permission[]`) drives RBAC
- Higher-order `requirePermission(permission)` wraps handlers declaratively

See [references/auth-patterns.md](references/auth-patterns.md)

## Rate Limiting

- Sliding-window in-memory limiter keyed by client IP
- Return HTTP 429 with a clear error message when the limit is exceeded
- For production, replace the in-memory store with Redis for multi-instance correctness

See [references/rate-limiting.md](references/rate-limiting.md)

## Background Jobs & Queues

- Simple typed `JobQueue<T>` processes jobs sequentially, non-blocking to callers
- Enqueue on POST and return immediately — do not block the HTTP response
- For production, replace with a durable queue (BullMQ, AWS SQS, etc.)

See [references/background-jobs.md](references/background-jobs.md)

## Logging & Monitoring

- Structured JSON logging with `timestamp`, `level`, `requestId`, and context fields
- Generate a `requestId` per request and thread it through all log entries
- Use `logger.error(message, error, context)` — never `console.error` raw objects

See [references/logging-monitoring.md](references/logging-monitoring.md)

## JVM (Spring Boot / JPA)

See [references/jvm-patterns.md](references/jvm-patterns.md) for the full JVM reference.

Key topics: Controller→Service→Repository layering, DTO records with `toDomain()`/`from()`, `@Transactional(readOnly=true)` by default, `JOIN FETCH` for N+1, `@RestControllerAdvice`, Spring Security 6.x config.

## Python (FastAPI / Django)

See [references/python-patterns.md](references/python-patterns.md) for the full Python reference.

Key topics: FastAPI routers + `Depends()` DI, Pydantic request/response models, SQLAlchemy 2.0 `Mapped[]` models, async repository pattern, `selectinload` for N+1, JWT auth, exception handlers.

---

## Reference Files

| File | Contents |
|------|----------|
| [references/api-design.md](references/api-design.md) | RESTful structure, Repository, Service, Middleware patterns |
| [references/database-patterns.md](references/database-patterns.md) | Query optimization, N+1 prevention, transactions |
| [references/caching-strategies.md](references/caching-strategies.md) | Redis caching layer, cache-aside pattern |
| [references/error-handling.md](references/error-handling.md) | Centralized error handler, retry with backoff |
| [references/auth-patterns.md](references/auth-patterns.md) | JWT validation, role-based access control |
| [references/rate-limiting.md](references/rate-limiting.md) | In-memory sliding-window rate limiter |
| [references/background-jobs.md](references/background-jobs.md) | Simple typed job queue |
| [references/logging-monitoring.md](references/logging-monitoring.md) | Structured JSON logger with context |
| [references/jvm-patterns.md](references/jvm-patterns.md) | Spring Boot layered arch, JPA, Spring Security, DTOs |
| [references/python-patterns.md](references/python-patterns.md) | FastAPI, Django/DRF, SQLAlchemy 2.0, Pydantic v2 |
