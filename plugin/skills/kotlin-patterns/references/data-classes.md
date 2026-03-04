# Data Classes

Perfect for DTOs, models, and value objects.

## Basic Data Class

```kotlin
// Automatically generates: equals(), hashCode(), toString(), copy()
data class User(
  val id: String,
  val name: String,
  val email: String,
  val createdAt: LocalDate = LocalDate.now()
)

// Usage
val user = User(
  id = "123",
  name = "John Doe",
  email = "john@example.com"
)

// Copy with modifications
val updatedUser = user.copy(email = "newemail@example.com")

// Destructuring
val (id, name, email) = user
println("User $id: $name")
```

## Nested Data Classes

```kotlin
data class Address(
  val street: String,
  val city: String,
  val zipCode: String
)

data class User(
  val name: String,
  val address: Address
)

// Deep copy
val user = User("John", Address("123 Main St", "NYC", "10001"))
val movedUser = user.copy(
  address = user.address.copy(city = "LA")
)
```

## Data Classes with Validation

```kotlin
data class Email(val value: String) {
  init {
    require(value.contains("@")) { "Invalid email: $value" }
  }
}

data class Age(val value: Int) {
  init {
    require(value in 0..150) { "Invalid age: $value" }
  }
}

data class User(
  val name: String,
  val email: Email,
  val age: Age
)
```
