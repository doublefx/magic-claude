---
name: coding-standards
description: >
  Coding standards for TypeScript/JavaScript, JVM (Java/Kotlin/Groovy), and Python.
  Use when writing or reviewing code — applies to naming conventions, error handling,
  immutability, file organization, and code quality. Detects ecosystem and loads the
  matching standards reference automatically.
user-invocable: false
context: fork
agent: general-purpose
allowed-tools: Read
---

# Coding Standards & Best Practices

## Ecosystem Detection

Detect the project ecosystem, then **immediately read the matching reference**:

| Ecosystem | Indicators | Reference to read |
|-----------|-----------|-------------------|
| TypeScript / JavaScript | `package.json`, `.ts`, `.tsx`, `.js` | Multiple — see TypeScript/JavaScript section below |
| JVM (Java / Kotlin / Groovy) | `build.gradle`, `pom.xml`, `.java`, `.kt` | [references/jvm-standards.md](references/jvm-standards.md) |
| Python | `pyproject.toml`, `requirements.txt`, `.py` | [references/python-standards.md](references/python-standards.md) |

## When to Activate

- Writing new code in any supported ecosystem
- Reviewing code quality and enforcing consistent style
- Setting up new projects with coding conventions

## Code Quality Principles

### 1. Readability First
- Code is read more than written — prioritize clarity over cleverness
- Use descriptive variable and function names
- Prefer self-documenting code over inline comments

### 2. KISS / DRY / YAGNI
- Simplest solution that works; no premature optimization
- Extract repeated logic into shared functions or components
- Build features only when actually needed; add complexity on demand

### 3. SOLID Principles
- **S** — Single Responsibility: one module, one purpose
- **O** — Open/Closed: extend via composition, not modification
- **I** — Interface Segregation: focused interfaces, no fat contracts
- **D** — Dependency Inversion: depend on abstractions, not concrete types

See [references/solid-principles.md](references/solid-principles.md)

## TypeScript/JavaScript Standards

- `camelCase` variables/functions, `PascalCase` types/interfaces, `UPPER_CASE` constants
- Immutability is critical: always spread (`{ ...obj }`, `[...arr]`) — never mutate in place
- All async code uses `try/catch` with a descriptive re-throw; no silent swallows
- Prefer `Promise.all([...])` for independent async operations over sequential `await`
- Never use `any` — use explicit types, generics, or `unknown` with narrowing

See [references/ts-js-standards.md](references/ts-js-standards.md)

## React Best Practices

- Functional components only with full prop-type interfaces
- Custom hooks (`use*`) encapsulate reusable stateful logic
- Use functional state updates (`setCount(prev => prev + 1)`) to avoid stale closures
- Avoid ternary chains in JSX — use `&&` guards and early returns instead

See [references/react-best-practices.md](references/react-best-practices.md)

## API Design Standards

- Standard REST conventions: resource-based URLs, correct HTTP verbs, query params for filters
- Uniform `ApiResponse<T>` shape: `{ success, data?, error?, meta? }` on every endpoint
- Validate all request bodies with Zod schemas before touching business logic

See [references/api-standards.md](references/api-standards.md)

## File Organization

- Many small, focused files over few large ones (200–400 lines typical, 800 max)
- Organize by feature/domain, not by type (avoid `models/`, `controllers/` at top level)
- File naming: `PascalCase` for components, `camelCase` for utilities and hooks

See [references/file-organization.md](references/file-organization.md)

## Comments & Documentation

- Comment **why**, not **what** — the code already shows what
- JSDoc on all exported public functions: params, returns, throws, and an example
- Remove debug comments before committing

See [references/comments-documentation.md](references/comments-documentation.md)

## Performance Best Practices

- `useMemo` for expensive derived values, `useCallback` for stable function references
- Lazy-load heavy components with `React.lazy` + `Suspense`
- Never `SELECT *` — always project only the columns the caller needs

See [references/performance.md](references/performance.md)

## Testing Standards

- Arrange / Act / Assert structure in every test
- Test names describe behaviour: "returns empty array when no markets match query"
- Minimum 80% coverage; unit + integration + E2E for critical paths

See [references/testing-standards.md](references/testing-standards.md)

## Code Smell Detection

- Functions longer than ~50 lines: extract sub-functions
- Nesting deeper than 4 levels: use early returns / guard clauses
- Unexplained literals: name every magic number and string as a constant

See [references/code-smells.md](references/code-smells.md)

---

## JVM (Java / Kotlin / Groovy)

See [references/jvm-standards.md](references/jvm-standards.md) for the full JVM standards reference.

Key topics: Google Java Style naming, immutable records, `Optional` / null safety, Kotlin idioms, coroutines, SOLID examples, `BigDecimal` for money, JUnit 5 + MockK/Mockito.

## Python

See [references/python-standards.md](references/python-standards.md) for the full Python standards reference.

Key topics: PEP 8 naming, mandatory type hints, frozen dataclasses/Pydantic, structural pattern matching, SOLID via Protocols, `Decimal` for money, Ruff/Pyright config.

## Reference Files

| File | Contents |
|------|----------|
| [references/solid-principles.md](references/solid-principles.md) | SOLID principle examples (S, O, I, D) |
| [references/ts-js-standards.md](references/ts-js-standards.md) | Naming, immutability, error handling, async, types |
| [references/react-best-practices.md](references/react-best-practices.md) | Components, hooks, state, conditional rendering |
| [references/api-standards.md](references/api-standards.md) | REST conventions, response format, Zod validation |
| [references/file-organization.md](references/file-organization.md) | Project structure and file naming conventions |
| [references/comments-documentation.md](references/comments-documentation.md) | When to comment, JSDoc format |
| [references/performance.md](references/performance.md) | Memoization, lazy loading, query optimization |
| [references/testing-standards.md](references/testing-standards.md) | AAA pattern, test naming |
| [references/code-smells.md](references/code-smells.md) | Long functions, deep nesting, magic numbers |
| [references/jvm-standards.md](references/jvm-standards.md) | Java/Kotlin naming, null safety, immutability, SOLID |
| [references/python-standards.md](references/python-standards.md) | PEP 8, type hints, dataclasses, Pydantic, Ruff |
