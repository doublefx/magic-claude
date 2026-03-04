# Java Interop Annotations

Make Kotlin code Java-friendly.

## `@JvmStatic` — Static Methods

```kotlin
class UserService {
  companion object {
    // Without @JvmStatic: UserService.Companion.getInstance()
    // With @JvmStatic: UserService.getInstance()
    @JvmStatic
    fun getInstance(): UserService {
      return instance
    }

    private val instance = UserService()
  }
}
```

## `@JvmOverloads` — Default Parameters

```kotlin
// Generates overloaded methods for Java
class User @JvmOverloads constructor(
  val name: String,
  val email: String,
  val age: Int = 0  // Java gets version without age parameter
)

// Java can call:
// new User("John", "john@example.com")
// new User("John", "john@example.com", 30)
```

## `@Throws` — Checked Exceptions

```kotlin
// Kotlin doesn't have checked exceptions, but Java does
@Throws(IOException::class, SQLException::class)
fun saveData(data: Data) {
  // May throw IOException or SQLException
}

// Java must handle:
// try {
//   saveData(data);
// } catch (IOException | SQLException e) {
//   // Handle
// }
```

## `@JvmField` — Exposed Field

```kotlin
class Config {
  // Without @JvmField: getApiUrl() setter
  // With @JvmField: apiUrl field
  @JvmField
  var apiUrl: String = "https://api.example.com"
}

// Java can access:
// config.apiUrl (not config.getApiUrl())
```

## `@JvmName` — Custom JVM Name

```kotlin
// Avoid name clashes or provide better Java names
@file:JvmName("StringUtils")
package com.example.utils

fun String.reverse(): String {
  return reversed()
}

// Java calls:
// StringUtils.reverse(string);
```
