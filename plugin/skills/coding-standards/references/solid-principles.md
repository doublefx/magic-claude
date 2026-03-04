# SOLID Principles

## S — Single Responsibility

```typescript
// GOOD: Each module has one purpose
// userService.ts — user business logic
// userRepository.ts — user data access
// userValidator.ts — user input validation

// BAD: One file doing everything
// user.ts — validation + business logic + data access + formatting
```

## O — Open/Closed

```typescript
// GOOD: Extend via composition, not modification
type Formatter = (data: unknown) => string;
const formatters: Record<string, Formatter> = { json: JSON.stringify, csv: toCsv };
// Add new formats by adding to the map, not modifying existing code

// BAD: Switch statement that grows with every new format
```

## I — Interface Segregation

```typescript
// GOOD: Focused interfaces
interface Readable { read(): Promise<Buffer> }
interface Writable { write(data: Buffer): Promise<void> }

// BAD: Fat interface forcing unused implementations
interface Storage { read(): Promise<Buffer>; write(data: Buffer): Promise<void>; delete(): void; list(): string[] }
```

## D — Dependency Inversion

```typescript
// GOOD: Depend on abstractions
function processOrders(repo: OrderRepository) { ... }

// BAD: Depend on concrete implementation
function processOrders(db: PostgresClient) { ... }
```
