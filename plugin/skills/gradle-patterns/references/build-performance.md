# Build Performance Optimization

## gradle.properties (Optimized)

```properties
# Gradle Daemon (speeds up builds)
org.gradle.daemon=true

# Parallel execution (use all CPU cores)
org.gradle.parallel=true

# Worker processes (adjust based on CPU cores)
org.gradle.workers.max=4

# Build cache (reuse outputs from previous builds)
org.gradle.caching=true

# Configuration cache (Gradle 9+ - faster configuration)
org.gradle.configuration-cache=true

# JVM memory settings (adjust based on project size)
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError

# Kotlin incremental compilation
kotlin.incremental=true
kotlin.incremental.usePreciseJavaTracking=true

# Kotlin compiler daemon
kotlin.compiler.execution.strategy=daemon

# File system watching (Gradle 7+)
org.gradle.vfs.watch=true
```

## Build Cache Configuration

**File**: `settings.gradle.kts`

```kotlin
buildCache {
    local {
        isEnabled = true
        directory = File(rootDir, ".gradle/build-cache")
        removeUnusedEntriesAfterDays = 7
    }

    // Optional: Remote build cache (for teams)
    // remote<HttpBuildCache> {
    //     url = uri("https://gradle-cache.example.com/cache/")
    //     isPush = System.getenv("CI") != null
    // }
}
```

## Performance Commands

```bash
# Use build cache
./gradlew build --build-cache

# Use configuration cache (Gradle 9+)
./gradlew build --configuration-cache

# Parallel builds
./gradlew build --parallel --max-workers=8

# Profile build performance
./gradlew build --profile --scan

# Dry run (see task execution order)
./gradlew build --dry-run
```
