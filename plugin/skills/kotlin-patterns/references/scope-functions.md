# Scope Functions

Choose the right scope function for the task.

## Quick Reference

| Function | Context | Returns | Use case |
|----------|---------|---------|----------|
| `let` | `it` | Lambda result | Null safety, transformation |
| `apply` | `this` | Object itself | Object configuration |
| `also` | `it` | Object itself | Side effects |
| `run` | `this` | Lambda result | Compute result on object |
| `with` | `this` | Lambda result | Multiple operations on object |

## `let` — Null Safety and Transformation

```kotlin
// Execute block if not null
user?.let { u ->
  println("User: ${u.name}")
  sendEmail(u.email)
}

// Transform value
val length = name?.let { it.length } ?: 0

// Scoped variable
val result = getData()?.let { data ->
  process(data)
  format(data)
}
```

## `apply` — Object Configuration

```kotlin
// Configure object (returns the object)
val user = User().apply {
  name = "John"
  email = "john@example.com"
  age = 30
}

// Builder-style
val request = Request.Builder()
  .apply {
    url("https://api.example.com")
    header("Authorization", "Bearer $token")
    method("POST")
  }
  .build()
```

## `also` — Side Effects

```kotlin
// Perform side effects (returns the object)
val user = createUser("john@example.com").also { user ->
  logger.info("Created user: ${user.id}")
  sendWelcomeEmail(user.email)
}

// Logging in chains
val result = data
  .filter { it.isValid }
  .also { println("After filter: ${it.size} items") }
  .map { it.process() }
  .also { println("After map: ${it.size} items") }
```

## `run` — Execute Block and Return Result

```kotlin
// Compute result
val result = run {
  val x = computeX()
  val y = computeY()
  x + y
}

// Extension function
val greeting = "John".run {
  "Hello, $this!"
}
```

## `with` — Operate on Object

```kotlin
// Multiple operations on object
val message = with(user) {
  "Name: $name\n" +
  "Email: $email\n" +
  "Age: $age"
}
```
