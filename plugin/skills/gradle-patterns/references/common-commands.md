# Common Gradle Commands

```bash
# Build project
./gradlew build

# Clean build
./gradlew clean build

# Run tests only
./gradlew test

# Run tests with coverage
./gradlew test jacocoTestReport

# Check dependency updates
./gradlew dependencyUpdates

# Generate dependency locks
./gradlew dependencies --write-locks

# Format code
./gradlew spotlessApply

# Run code quality checks
./gradlew detekt

# Run application
./gradlew bootRun  # Spring Boot
./gradlew run      # Regular application

# Build with performance profiling
./gradlew build --scan --profile

# Show dependency tree
./gradlew dependencies

# Show task dependencies
./gradlew :app:dependencies --configuration runtimeClasspath
```

## Quick Start

```bash
# Create new Gradle project with Kotlin DSL
gradle init \
  --type kotlin-application \
  --dsl kotlin \
  --test-framework junit-jupiter \
  --java-version 17

# Add wrapper
./gradlew wrapper --gradle-version 9.0 --distribution-type all

# Enable modern features in gradle.properties
echo "org.gradle.caching=true" >> gradle.properties
echo "org.gradle.configuration-cache=true" >> gradle.properties
echo "org.gradle.parallel=true" >> gradle.properties
```
