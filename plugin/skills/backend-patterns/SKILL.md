---
name: backend-patterns
description: Backend architecture and API design patterns for Node.js, Express, and Next.js. Use when designing REST or GraphQL endpoints, implementing middleware or authentication, structuring backend services, optimizing database queries and caching, or building any server-side feature. Consult before designing any new API surface or backend module.
user-invocable: false
context: fork
agent: architect
---

# Backend Development Patterns

Backend architecture patterns and best practices for scalable server-side applications.

## When to Activate

- Designing API endpoints (REST, GraphQL)
- Optimizing database queries and caching
- Structuring backend services with Node.js, Express, or Next.js
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

**Remember**: Choose patterns that fit your complexity level. Start simple and introduce layers only when they solve a real problem.
