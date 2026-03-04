---
name: kotlin-patterns
description: Kotlin-specific patterns and idiomatic code. Use whenever writing or reviewing Kotlin code — coroutines, null safety, data classes, sealed classes, extension functions, Flow, or Java interop. Also triggers when converting Java to Kotlin, setting up a Kotlin project, or asking about Kotlin best practices. Consult before writing any non-trivial Kotlin.
user-invocable: false
---

# Kotlin Patterns and Idioms

Modern Kotlin best practices for clean, safe, and idiomatic code.

## Null Safety (Kotlin's Killer Feature)

- Kotlin's type system distinguishes nullable (`String?`) from non-nullable (`String`) at compile time.
- Use safe call (`?.`), Elvis (`?:`), and `let` to handle nulls idiomatically.
- Avoid `!!` (double bang) — replace with `requireNotNull`, Elvis with a thrown exception, or `?.let`.

See [references/null-safety.md](references/null-safety.md)

## Data Classes

- Auto-generate `equals()`, `hashCode()`, `toString()`, and `copy()` for free.
- Use `copy()` for immutable modifications; destructuring for unpacking.
- Add `init` blocks with `require()` for inline validation of value objects.

See [references/data-classes.md](references/data-classes.md)

## Sealed Classes and Interfaces

- Sealed hierarchies model finite state machines and discriminated unions exhaustively.
- `when` expressions on sealed types are checked by the compiler — no `else` needed.
- Use sealed interfaces (Kotlin 1.5+) when subclasses can span multiple files.

See [references/sealed-classes.md](references/sealed-classes.md)

## Extension Functions

- Add behaviour to existing types without inheritance or wrapper classes.
- Prefer extension functions over utility classes for cohesion with the receiver type.
- Extensions on nullable types (`fun String?.orDefault(...)`) keep null-handling at the call site.

See [references/extension-functions.md](references/extension-functions.md)

## Coroutines (Async/Concurrency)

- `suspend` functions are non-blocking and composable without callback pyramids.
- Use `coroutineScope` + `async`/`await` for structured parallel execution; failures cancel siblings.
- Use `supervisorScope` for independent parallel tasks where one failure must not cancel others.
- `Flow` is a cold reactive stream; compose with `filter`, `map`, `collect`.
- Use `withContext(Dispatchers.IO/Default)` to switch threads within a suspend function.

See [references/coroutines.md](references/coroutines.md)

## Scope Functions

- `let` — null-safe operations and transformations; context object as `it`.
- `apply` — object configuration; returns the object; context object as `this`.
- `also` — side effects (logging, metrics) in a chain; returns the object; context object as `it`.
- `run` / `with` — compute a result from an object's members; context object as `this`.

See [references/scope-functions.md](references/scope-functions.md)

## Java Interop Annotations

- `@JvmStatic` — expose companion object members as Java static methods.
- `@JvmOverloads` — generate Java overloads for functions with default parameters.
- `@Throws` — declare checked exceptions so Java callers are forced to handle them.
- `@JvmField` / `@JvmName` — expose fields directly and control JVM-level naming.

See [references/java-interop.md](references/java-interop.md)

## Type-Safe Builders (DSL) and Delegation

- Build Kotlin DSLs with lambda receivers (`init: Builder.() -> Unit`) and `apply`.
- `by lazy` defers expensive initialisation to first access.
- `Delegates.observable` / `vetoable` react to or gate property changes.
- Class delegation (`class Foo(...) : Bar by delegate`) forwards interface methods with selective overrides.
- `inline fun <reified T>` captures generic type information at the call site — no `Class<T>` argument needed.

See [references/dsl-and-delegation.md](references/dsl-and-delegation.md)

## Summary

**Core principles:**
- Null safety with `?`, `?.`, `?:` — avoid `!!`
- Data classes for models; sealed classes for type-safe hierarchies
- Extension functions over utility classes
- Coroutines + Flow for async; scope functions for object-scoped operations
- Java interop annotations for mixed-language projects
- Type-safe builders and delegation for expressive, composable APIs

**Remember**: Kotlin's power comes from its safety features and expressiveness. Use them to write clear, concise, safe code.

## Reference Files

| File | Contents |
|------|----------|
| [references/null-safety.md](references/null-safety.md) | `?.`, `?:`, `!!` avoidance, `let` for null-safe blocks |
| [references/data-classes.md](references/data-classes.md) | Basic, nested, and validated data classes |
| [references/sealed-classes.md](references/sealed-classes.md) | Sealed classes, sealed interfaces, API response pattern |
| [references/extension-functions.md](references/extension-functions.md) | String, collection, and nullable extensions |
| [references/coroutines.md](references/coroutines.md) | Suspend functions, structured concurrency, Flow, Dispatchers |
| [references/scope-functions.md](references/scope-functions.md) | `let`, `apply`, `also`, `run`, `with` with examples |
| [references/java-interop.md](references/java-interop.md) | `@JvmStatic`, `@JvmOverloads`, `@Throws`, `@JvmField`, `@JvmName` |
| [references/dsl-and-delegation.md](references/dsl-and-delegation.md) | Type-safe builders, property delegation, class delegation, reified types |
