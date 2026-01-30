---
name: kotlin-patterns
description: Kotlin patterns and idioms. Covers coroutines, null safety, extension functions, data classes, sealed classes, and Java interop.
user-invocable: false
---

# Kotlin Patterns and Idioms

Modern Kotlin best practices for clean, safe, and idiomatic code.

## Null Safety (Kotlin's Killer Feature)

Kotlin's type system eliminates null pointer exceptions at compile time.

### Non-Nullable vs Nullable Types

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

### Safe Call Operator (`?.`)

```kotlin
// BAD - Explicit null check
val length: Int? = if (name != null) name.length else null

// GOOD - Safe call
val length: Int? = name?.length

// Chaining safe calls
val city: String? = user?.address?.city
```

### Elvis Operator (`?:`)

```kotlin
// Provide default value if null
val length: Int = name?.length ?: 0

// Early return if null
val user = findUser(id) ?: return

// Throw exception if null
val user = findUser(id) ?: throw UserNotFoundException("User $id not found")
```

### Avoid `!!` (Double Bang) Operator

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

### `let` for Null-Safe Operations

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

## Data Classes

Perfect for DTOs, models, and value objects.

### Basic Data Class

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

### Nested Data Classes

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

### Data Classes with Validation

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

## Sealed Classes and Interfaces

Type-safe hierarchies for finite sets of types.

### Sealed Class for State

```kotlin
// Sealed class - all subclasses must be in same file/package
sealed class Result<out T> {
  data class Success<T>(val data: T) : Result<T>()
  data class Error(val message: String, val cause: Throwable? = null) : Result<Nothing>()
  object Loading : Result<Nothing>()
}

// Usage with when (exhaustive)
fun <T> handleResult(result: Result<T>) {
  when (result) {
    is Result.Success -> println("Data: ${result.data}")
    is Result.Error -> println("Error: ${result.message}")
    Result.Loading -> println("Loading...")
  }
  // No else needed - compiler knows all cases are covered
}
```

### Sealed Interface (Kotlin 1.5+)

```kotlin
sealed interface UserEvent {
  data class Login(val userId: String, val timestamp: Long) : UserEvent
  data class Logout(val userId: String) : UserEvent
  data class ProfileUpdate(val userId: String, val field: String, val value: String) : UserEvent
}

fun processEvent(event: UserEvent) {
  when (event) {
    is UserEvent.Login -> handleLogin(event.userId)
    is UserEvent.Logout -> handleLogout(event.userId)
    is UserEvent.ProfileUpdate -> updateProfile(event)
  }
}
```

### Sealed Class for API Responses

```kotlin
sealed class ApiResponse<out T> {
  data class Success<T>(
    val data: T,
    val statusCode: Int = 200
  ) : ApiResponse<T>()

  data class Error(
    val statusCode: Int,
    val message: String,
    val errors: List<String> = emptyList()
  ) : ApiResponse<Nothing>()

  data class NetworkError(
    val exception: Throwable
  ) : ApiResponse<Nothing>()
}

// Extension function for mapping
fun <T, R> ApiResponse<T>.map(transform: (T) -> R): ApiResponse<R> {
  return when (this) {
    is ApiResponse.Success -> ApiResponse.Success(transform(data), statusCode)
    is ApiResponse.Error -> this
    is ApiResponse.NetworkError -> this
  }
}
```

## Extension Functions

Add functionality to existing classes without inheritance.

### Simple Extensions

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

### Collection Extensions

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

### Nullable Extensions

```kotlin
// Extension on nullable type
fun String?.orDefault(default: String): String {
  return this ?: default
}

// Usage
val name: String? = null
println(name.orDefault("Anonymous"))  // "Anonymous"
```

## Coroutines (Async/Concurrency)

Kotlin's approach to asynchronous programming.

### Suspend Functions

```kotlin
// Suspend function - can be paused and resumed
suspend fun fetchUser(id: String): User {
  // Simulate network call
  delay(1000)  // Non-blocking delay
  return User(id, "John Doe", "john@example.com")
}

// Call from another suspend function
suspend fun getUserData(id: String): UserData {
  val user = fetchUser(id)  // Suspends here
  val orders = fetchOrders(user.id)  // Suspends here
  return UserData(user, orders)
}
```

### Structured Concurrency

```kotlin
// Run multiple operations in parallel
suspend fun fetchUserData(userId: String): UserData = coroutineScope {
  // Both fetch operations run concurrently
  val userDeferred = async { fetchUser(userId) }
  val ordersDeferred = async { fetchOrders(userId) }

  // Await both results
  UserData(
    user = userDeferred.await(),
    orders = ordersDeferred.await()
  )
}

// If one fails, all are cancelled
```

### Exception Handling in Coroutines

```kotlin
suspend fun fetchDataSafely(id: String): Result<Data> {
  return try {
    val data = fetchData(id)
    Result.Success(data)
  } catch (e: Exception) {
    Result.Error("Failed to fetch data: ${e.message}", e)
  }
}

// Using supervisorScope for independent failures
suspend fun fetchMultiple(): List<User> = supervisorScope {
  val users = listOf("1", "2", "3").map { id ->
    async {
      try {
        fetchUser(id)
      } catch (e: Exception) {
        null  // Don't propagate failure to other tasks
      }
    }
  }
  users.awaitAll().filterNotNull()
}
```

### Flow (Reactive Streams)

```kotlin
// Cold stream - only emits when collected
fun getUsers(): Flow<User> = flow {
  val userIds = listOf("1", "2", "3")
  for (id in userIds) {
    val user = fetchUser(id)
    emit(user)  // Emit each user as it's fetched
  }
}

// Collect flow
suspend fun processUsers() {
  getUsers()
    .filter { it.isActive }
    .map { it.name }
    .collect { name ->
      println("Active user: $name")
    }
}

// Transform flows
fun getActiveUserNames(): Flow<String> {
  return getUsers()
    .filter { it.isActive }
    .map { it.name }
}
```

### Dispatchers

```kotlin
// Dispatchers.Main - UI thread (Android)
launch(Dispatchers.Main) {
  updateUI()
}

// Dispatchers.IO - I/O operations (network, database)
launch(Dispatchers.IO) {
  val data = fetchFromNetwork()
}

// Dispatchers.Default - CPU-intensive work
launch(Dispatchers.Default) {
  val result = complexCalculation()
}

// Switch dispatchers
suspend fun loadData(): Data {
  // Fetch on IO dispatcher
  val rawData = withContext(Dispatchers.IO) {
    database.query()
  }

  // Process on Default dispatcher
  return withContext(Dispatchers.Default) {
    processData(rawData)
  }
}
```

## Scope Functions

Choose the right scope function for the task.

### `let` - Null Safety and Transformation

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

### `apply` - Object Configuration

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

### `also` - Side Effects

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

### `run` - Execute Block and Return Result

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

### `with` - Operate on Object

```kotlin
// Multiple operations on object
val message = with(user) {
  "Name: $name\n" +
  "Email: $email\n" +
  "Age: $age"
}
```

## Java Interop Annotations

Make Kotlin code Java-friendly.

### `@JvmStatic` - Static Methods

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

### `@JvmOverloads` - Default Parameters

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

### `@Throws` - Checked Exceptions

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

### `@JvmField` - Exposed Field

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

### `@JvmName` - Custom JVM Name

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

## Delegation

### Property Delegation

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

### Class Delegation

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

## Summary

**Key Kotlin Patterns**:
- Null safety with `?`, `?.`, `?:`, and avoid `!!`
- Data classes for models
- Sealed classes for type-safe hierarchies
- Extension functions over utility classes
- Coroutines for async operations
- Scope functions (`let`, `apply`, `also`, `run`, `with`)
- Java interop annotations
- Type-safe builders for DSLs

**Remember**: Kotlin's power comes from its safety features and expressiveness. Use them to write clear, concise, safe code.
