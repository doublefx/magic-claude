# Dependency Locking

Dependency locking ensures reproducible builds by pinning transitive dependencies.

## Enable Dependency Locking

**File**: `build.gradle.kts`

```kotlin
dependencyLocking {
    // Lock all configurations
    lockAllConfigurations()

    // Or lock specific configurations
    // lockMode.set(LockMode.STRICT)
}

configurations.all {
    resolutionStrategy {
        // Force specific versions when needed
        force("com.google.guava:guava:32.1.3-jre")

        // Fail on version conflict
        failOnVersionConflict()

        // Prefer project modules over external
        preferProjectModules()
    }
}
```

## Generate and Update Lock Files

```bash
# Generate lock files for all configurations
./gradlew dependencies --write-locks

# Update specific dependency
./gradlew dependencies --update-locks com.google.guava:guava

# Update all lock files (check for newer versions)
./gradlew dependencies --write-locks --refresh-dependencies
```

## Lock Files Location

```
gradle/
  dependency-locks/
    compileClasspath.lockfile
    runtimeClasspath.lockfile
    testCompileClasspath.lockfile
    testRuntimeClasspath.lockfile
```

**Commit lock files** to version control!
