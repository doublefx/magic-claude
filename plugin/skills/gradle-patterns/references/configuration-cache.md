# Configuration Cache (Gradle 9+)

Configuration cache speeds up builds by caching the result of the configuration phase.

## Enable Configuration Cache

**File**: `gradle.properties`

```properties
# Enable configuration cache (Gradle 9+ recommended)
org.gradle.configuration-cache=true

# Warn on configuration cache problems (don't fail)
org.gradle.configuration-cache.problems=warn

# Maximum number of configuration cache problems to report
org.gradle.configuration-cache.max-problems=100
```

## Configuration Cache Compatible Tasks

```kotlin
// GOOD: Task configuration avoidance (lazy)
tasks.register<Jar>("customJar") {
    // Configuration block only runs when task is executed
    archiveBaseName.set("my-app")
    archiveVersion.set(project.version.toString())

    from(sourceSets.main.get().output)
}

// BAD: Eager task configuration
tasks.create<Jar>("customJar") {
    // Always runs, even if task not needed
    archiveBaseName.set("my-app")
}

// GOOD: Use providers for lazy evaluation
val buildTimestamp = providers.provider {
    System.currentTimeMillis()
}

tasks.register("printTimestamp") {
    doLast {
        println("Build time: ${buildTimestamp.get()}")
    }
}

// BAD: Eager evaluation
val buildTimestamp = System.currentTimeMillis()  // Runs at configuration time
```

## Configuration Cache Rules

1. **No configuration-time side effects** - Move logic to task actions
2. **Use task inputs/outputs** - Don't access files during configuration
3. **Avoid `project` in task actions** - Use providers instead
4. **Use lazy properties** - Use `.set()` and `.get()` for providers
