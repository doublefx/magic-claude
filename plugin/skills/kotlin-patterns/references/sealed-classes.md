# Sealed Classes and Interfaces

Type-safe hierarchies for finite sets of types.

## Sealed Class for State

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

## Sealed Interface (Kotlin 1.5+)

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

## Sealed Class for API Responses

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
