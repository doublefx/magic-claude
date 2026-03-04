# Null Safety

Kotlin's type system eliminates null pointer exceptions at compile time.

## Non-Nullable vs Nullable Types

```kotlin
// Non-nullable (default)
var name: String = "John"
name = null  // Compile error!

// Nullable (explicit with ?)
var name: String? = "John"
name = null  // OK

// Platform types from Java (nullability unknown)
val javaString: String! = javaMethod()  // May or may not be null
```

## Safe Call Operator (`?.`)

```kotlin
// BAD - Explicit null check
val length: Int? = if (name != null) name.length else null

// GOOD - Safe call
val length: Int? = name?.length

// Chaining safe calls
val city: String? = user?.address?.city
```

## Elvis Operator (`?:`)

```kotlin
// Provide default value if null
val length: Int = name?.length ?: 0

// Early return if null
val user = findUser(id) ?: return

// Throw exception if null
val user = findUser(id) ?: throw UserNotFoundException("User $id not found")
```

## Avoid `!!` (Double Bang) Operator

```kotlin
// BAD - Can cause NullPointerException
val length = name!!.length  // If name is null, crashes!

// GOOD - Use Elvis with exception
val length = requireNotNull(name) { "Name cannot be null" }.length

// GOOD - Safe call with default
val length = name?.length ?: 0

// GOOD - Let with safe call
name?.let { n ->
  println("Name length: ${n.length}")
}
```

## `let` for Null-Safe Operations

```kotlin
// Execute block only if non-null
user?.let { u ->
  println("User: ${u.name}")
  sendEmail(u.email)
}

// Transform and use
val uppercaseName = name?.let { it.uppercase() }

// Multiple safe calls
user?.email?.let { email ->
  if (email.contains("@")) {
    sendVerificationEmail(email)
  }
}
```
