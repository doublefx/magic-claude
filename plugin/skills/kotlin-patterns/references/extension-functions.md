# Extension Functions

Add functionality to existing classes without inheritance.

## Simple Extensions

```kotlin
// String extensions
fun String.isEmail(): Boolean {
  return contains("@") && contains(".")
}

fun String.toTitleCase(): String {
  return split(" ").joinToString(" ") { word ->
    word.lowercase().replaceFirstChar { it.uppercase() }
  }
}

// Usage
val email = "john@example.com"
if (email.isEmail()) {
  println("Valid email")
}

val title = "hello world".toTitleCase()  // "Hello World"
```

## Collection Extensions

```kotlin
// Find duplicates
fun <T> List<T>.duplicates(): List<T> {
  return groupingBy { it }
    .eachCount()
    .filter { it.value > 1 }
    .keys
    .toList()
}

// Safe get or null
fun <T> List<T>.getOrNull(index: Int): T? {
  return if (index in indices) this[index] else null
}

// Usage
val numbers = listOf(1, 2, 3, 2, 4, 3)
println(numbers.duplicates())  // [2, 3]
```

## Nullable Extensions

```kotlin
// Extension on nullable type
fun String?.orDefault(default: String): String {
  return this ?: default
}

// Usage
val name: String? = null
println(name.orDefault("Anonymous"))  // "Anonymous"
```
