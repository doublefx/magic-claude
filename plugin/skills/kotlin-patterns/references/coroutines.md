# Coroutines (Async/Concurrency)

Kotlin's approach to asynchronous programming.

## Suspend Functions

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

## Structured Concurrency

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

## Exception Handling in Coroutines

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

## Flow (Reactive Streams)

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

## Dispatchers

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
