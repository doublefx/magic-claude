# Type-Safe Builders (DSL) and Delegation

## Type-Safe Builders

Kotlin DSL pattern for configuration.

```kotlin
// Define builder
class HtmlBuilder {
  private val elements = mutableListOf<String>()

  fun head(init: HeadBuilder.() -> Unit) {
    val head = HeadBuilder().apply(init)
    elements.add(head.build())
  }

  fun body(init: BodyBuilder.() -> Unit) {
    val body = BodyBuilder().apply(init)
    elements.add(body.build())
  }

  fun build(): String = elements.joinToString("\n")
}

class HeadBuilder {
  private var title: String = ""

  fun title(value: String) {
    title = value
  }

  fun build(): String = "<head><title>$title</title></head>"
}

class BodyBuilder {
  private val content = mutableListOf<String>()

  fun h1(text: String) {
    content.add("<h1>$text</h1>")
  }

  fun p(text: String) {
    content.add("<p>$text</p>")
  }

  fun build(): String = "<body>${content.joinToString("\n")}</body>"
}

// Usage - Type-safe DSL
fun html(init: HtmlBuilder.() -> Unit): String {
  return HtmlBuilder().apply(init).build()
}

val page = html {
  head {
    title("My Page")
  }
  body {
    h1("Welcome")
    p("This is a paragraph")
  }
}
```

## Property Delegation

```kotlin
// Lazy initialization
val heavyObject: HeavyObject by lazy {
  println("Computing...")
  HeavyObject()
}
// Only computed on first access

// Observable properties
var name: String by Delegates.observable("initial") { prop, old, new ->
  println("$old -> $new")
}

// Veto changes
var age: Int by Delegates.vetoable(0) { prop, old, new ->
  new >= 0  // Only allow non-negative values
}

// Map delegation
class User(map: Map<String, Any?>) {
  val name: String by map
  val age: Int by map
}

val user = User(mapOf("name" to "John", "age" to 30))
println(user.name)  // "John"
```

## Class Delegation

```kotlin
interface Repository {
  fun save(entity: Entity)
  fun findById(id: String): Entity?
}

class DatabaseRepository : Repository {
  override fun save(entity: Entity) { /* DB logic */ }
  override fun findById(id: String): Entity? { /* DB logic */ }
}

// Delegate to database repository but add caching
class CachedRepository(
  private val delegate: Repository
) : Repository by delegate {
  private val cache = mutableMapOf<String, Entity>()

  override fun findById(id: String): Entity? {
    return cache.getOrPut(id) {
      delegate.findById(id) ?: return null
    }
  }
}
```

## Inline Functions and Reified Types

```kotlin
// Inline function with reified type parameter
inline fun <reified T> parseJson(json: String): T {
  return Json.decodeFromString<T>(json)
}

// Usage - type is known at compile time
val user: User = parseJson(jsonString)

// Without reified, you'd need: parseJson(jsonString, User::class.java)
```
