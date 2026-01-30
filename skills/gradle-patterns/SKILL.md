---
name: gradle-patterns
description: Gradle Kotlin DSL patterns, version catalogs, multi-project builds, configuration cache, dependency locking, and Gradle 9+ best practices for modern JVM projects.
user-invocable: false
---

# Gradle Patterns & Best Practices

Comprehensive patterns and examples for modern Gradle builds using Kotlin DSL and Gradle 9+ features.

## Version Catalogs (libs.versions.toml)

Version catalogs provide centralized, type-safe dependency management for Gradle projects.

### Setup Version Catalog

**File**: `gradle/libs.versions.toml`

```toml
[versions]
# Kotlin
kotlin = "1.9.22"
coroutines = "1.7.3"

# Spring
spring-boot = "3.2.0"
spring-dependency-management = "1.1.4"

# Testing
junit = "5.10.1"
mockito = "5.8.0"
assertj = "3.25.1"

# Utilities
jackson = "2.15.3"
lombok = "1.18.30"

# Plugins
detekt = "1.23.4"
spotless = "6.23.3"
versions-plugin = "0.50.0"

[libraries]
# Kotlin
kotlin-stdlib = { module = "org.jetbrains.kotlin:kotlin-stdlib", version.ref = "kotlin" }
kotlin-reflect = { module = "org.jetbrains.kotlin:kotlin-reflect", version.ref = "kotlin" }
kotlinx-coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "coroutines" }
kotlinx-coroutines-reactor = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-reactor", version.ref = "coroutines" }

# Spring Boot
spring-boot-starter = { module = "org.springframework.boot:spring-boot-starter", version.ref = "spring-boot" }
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web", version.ref = "spring-boot" }
spring-boot-starter-webflux = { module = "org.springframework.boot:spring-boot-starter-webflux", version.ref = "spring-boot" }
spring-boot-starter-data-jpa = { module = "org.springframework.boot:spring-boot-starter-data-jpa", version.ref = "spring-boot" }
spring-boot-starter-test = { module = "org.springframework.boot:spring-boot-starter-test", version.ref = "spring-boot" }

# Jackson
jackson-databind = { module = "com.fasterxml.jackson.core:jackson-databind", version.ref = "jackson" }
jackson-kotlin = { module = "com.fasterxml.jackson.module:jackson-module-kotlin", version.ref = "jackson" }
jackson-jsr310 = { module = "com.fasterxml.jackson.datatype:jackson-datatype-jsr310", version.ref = "jackson" }

# Testing
junit-jupiter = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit" }
junit-jupiter-api = { module = "org.junit.jupiter:junit-jupiter-api", version.ref = "junit" }
junit-jupiter-engine = { module = "org.junit.jupiter:junit-jupiter-engine", version.ref = "junit" }
mockito-core = { module = "org.mockito:mockito-core", version.ref = "mockito" }
mockito-kotlin = { module = "org.mockito.kotlin:mockito-kotlin", version = "5.2.1" }
assertj-core = { module = "org.assertj:assertj-core", version.ref = "assertj" }

# Utilities
lombok = { module = "org.projectlombok:lombok", version.ref = "lombok" }

[bundles]
kotlin = ["kotlin-stdlib", "kotlin-reflect"]
coroutines = ["kotlinx-coroutines-core", "kotlinx-coroutines-reactor"]
spring-web = ["spring-boot-starter-web", "spring-boot-starter-webflux"]
jackson = ["jackson-databind", "jackson-kotlin", "jackson-jsr310"]
junit = ["junit-jupiter-api", "junit-jupiter-engine"]
testing = ["junit-jupiter-api", "mockito-core", "assertj-core"]

[plugins]
# Kotlin
kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
kotlin-spring = { id = "org.jetbrains.kotlin.plugin.spring", version.ref = "kotlin" }
kotlin-jpa = { id = "org.jetbrains.kotlin.plugin.jpa", version.ref = "kotlin" }

# Spring
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
spring-dependency-management = { id = "io.spring.dependency-management", version.ref = "spring-dependency-management" }

# Code Quality
detekt = { id = "io.gitlab.arturbosch.detekt", version.ref = "detekt" }
spotless = { id = "com.diffplug.spotless", version.ref = "spotless" }

# Build Tools
versions = { id = "com.github.ben-manes.versions", version.ref = "versions-plugin" }
```

### Using Version Catalogs

**File**: `build.gradle.kts`

```kotlin
plugins {
    // Type-safe plugin references
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)

    // Code quality
    alias(libs.plugins.detekt)
    alias(libs.plugins.spotless)
}

dependencies {
    // Single libraries
    implementation(libs.kotlin.stdlib)
    implementation(libs.kotlin.reflect)

    // Bundles (multiple related libraries)
    implementation(libs.bundles.spring.web)
    implementation(libs.bundles.jackson)
    implementation(libs.bundles.coroutines)

    // Testing bundles
    testImplementation(libs.bundles.testing)
    testImplementation(libs.spring.boot.starter.test)
}
```

## Kotlin DSL Build Scripts

### Root Project (build.gradle.kts)

```kotlin
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    kotlin("jvm") version "1.9.22" apply false
    kotlin("plugin.spring") version "1.9.22" apply false
    id("org.springframework.boot") version "3.2.0" apply false
    id("io.spring.dependency-management") version "1.1.4" apply false
}

allprojects {
    group = "com.example"
    version = "1.0.0-SNAPSHOT"

    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "org.jetbrains.kotlin.jvm")

    dependencies {
        // Common dependencies for all subprojects
        implementation(kotlin("stdlib"))
        implementation(kotlin("reflect"))

        testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    }

    tasks.withType<KotlinCompile> {
        kotlinOptions {
            freeCompilerArgs += "-Xjsr305=strict"
            jvmTarget = "17"
        }
    }

    tasks.withType<Test> {
        useJUnitPlatform()
    }
}
```

### Application Module (app/build.gradle.kts)

```kotlin
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
    application
}

group = "com.example"
version = "1.0.0-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

dependencies {
    // Internal module dependencies
    implementation(project(":common"))
    implementation(project(":api"))

    // External dependencies using version catalog
    implementation(libs.bundles.kotlin)
    implementation(libs.bundles.spring.web)
    implementation(libs.bundles.jackson)

    // Runtime dependencies
    runtimeOnly("com.h2database:h2")

    // Development tools
    developmentOnly("org.springframework.boot:spring-boot-devtools")

    // Annotation processors
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")

    // Testing
    testImplementation(libs.bundles.testing)
    testImplementation(libs.spring.boot.starter.test)
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs += listOf(
            "-Xjsr305=strict",
            "-Xopt-in=kotlin.RequiresOptIn"
        )
        jvmTarget = "17"
    }
}

tasks.withType<Test> {
    useJUnitPlatform()

    // JVM args for testing
    jvmArgs("-XX:+EnableDynamicAgentLoading")

    // Test execution settings
    maxParallelForks = Runtime.getRuntime().availableProcessors() / 2

    testLogging {
        events("passed", "skipped", "failed")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
}

application {
    mainClass.set("com.example.ApplicationKt")
}

// Spring Boot configuration
springBoot {
    buildInfo()
}
```

## Multi-Project Build

### Project Structure

```
root-project/
├── build.gradle.kts          # Root build configuration
├── settings.gradle.kts       # Multi-project settings
├── gradle.properties         # Build properties
├── gradle/
│   ├── libs.versions.toml    # Version catalog
│   └── wrapper/
├── common/
│   └── build.gradle.kts      # Common module
├── api/
│   └── build.gradle.kts      # API module
├── service/
│   └── build.gradle.kts      # Service module
└── web/
    └── build.gradle.kts      # Web module
```

### settings.gradle.kts

```kotlin
rootProject.name = "my-project"

// Include modules
include(
    "common",
    "api",
    "service",
    "web"
)

// Enable version catalogs
enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")

// Configure plugin management
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

// Dependency resolution strategy
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenCentral()
    }
}
```

### Module Dependencies with Type-Safe Accessors

```kotlin
// In service/build.gradle.kts
dependencies {
    // Type-safe project dependencies
    implementation(projects.common)
    implementation(projects.api)

    // External dependencies
    implementation(libs.bundles.spring.web)
}
```

## Configuration Cache (Gradle 9+)

Configuration cache speeds up builds by caching the result of the configuration phase.

### Enable Configuration Cache

**File**: `gradle.properties`

```properties
# Enable configuration cache (Gradle 9+ recommended)
org.gradle.configuration-cache=true

# Warn on configuration cache problems (don't fail)
org.gradle.configuration-cache.problems=warn

# Maximum number of configuration cache problems to report
org.gradle.configuration-cache.max-problems=100
```

### Configuration Cache Compatible Tasks

```kotlin
// ✅ GOOD: Task configuration avoidance (lazy)
tasks.register<Jar>("customJar") {
    // Configuration block only runs when task is executed
    archiveBaseName.set("my-app")
    archiveVersion.set(project.version.toString())

    from(sourceSets.main.get().output)
}

// ❌ BAD: Eager task configuration
tasks.create<Jar>("customJar") {
    // Always runs, even if task not needed
    archiveBaseName.set("my-app")
}

// ✅ GOOD: Use providers for lazy evaluation
val buildTimestamp = providers.provider {
    System.currentTimeMillis()
}

tasks.register("printTimestamp") {
    doLast {
        println("Build time: ${buildTimestamp.get()}")
    }
}

// ❌ BAD: Eager evaluation
val buildTimestamp = System.currentTimeMillis()  // Runs at configuration time
```

### Configuration Cache Rules

1. **No configuration-time side effects** - Move logic to task actions
2. **Use task inputs/outputs** - Don't access files during configuration
3. **Avoid `project` in task actions** - Use providers instead
4. **Use lazy properties** - Use `.set()` and `.get()` for providers

## Dependency Locking

Dependency locking ensures reproducible builds by pinning transitive dependencies.

### Enable Dependency Locking

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

### Generate and Update Lock Files

```bash
# Generate lock files for all configurations
./gradlew dependencies --write-locks

# Update specific dependency
./gradlew dependencies --update-locks com.google.guava:guava

# Update all lock files (check for newer versions)
./gradlew dependencies --write-locks --refresh-dependencies
```

### Lock Files Location

```
gradle/
  dependency-locks/
    compileClasspath.lockfile
    runtimeClasspath.lockfile
    testCompileClasspath.lockfile
    testRuntimeClasspath.lockfile
```

**Commit lock files** to version control!

## Build Performance Optimization

### gradle.properties (Optimized)

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

### Build Cache Configuration

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

### Performance Tips

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

## Custom Tasks

### Simple Custom Task

```kotlin
tasks.register("hello") {
    group = "custom"
    description = "Prints a greeting"

    doLast {
        println("Hello from Gradle!")
    }
}
```

### Typed Custom Task

```kotlin
abstract class GenerateVersionTask : DefaultTask() {
    @get:Input
    abstract val version: Property<String>

    @get:OutputFile
    abstract val outputFile: RegularFileProperty

    @TaskAction
    fun generate() {
        outputFile.get().asFile.writeText(
            "const val VERSION = \"${version.get()}\""
        )
    }
}

tasks.register<GenerateVersionTask>("generateVersion") {
    version.set(project.version.toString())
    outputFile.set(layout.buildDirectory.file("generated/Version.kt"))
}
```

### Task Dependencies

```kotlin
tasks.register("taskA") {
    doLast { println("Task A") }
}

tasks.register("taskB") {
    doLast { println("Task B") }
}

tasks.register("taskC") {
    dependsOn("taskA", "taskB")
    doLast { println("Task C") }
}

// Task execution order: taskA, taskB, then taskC
```

## Code Quality Plugins

### Detekt (Kotlin Linting)

```kotlin
plugins {
    id("io.gitlab.arturbosch.detekt") version "1.23.4"
}

detekt {
    buildUponDefaultConfig = true
    allRules = false
    config.setFrom("$projectDir/config/detekt.yml")
    baseline = file("$projectDir/config/detekt-baseline.xml")
}

tasks.withType<io.gitlab.arturbosch.detekt.Detekt>().configureEach {
    reports {
        html.required.set(true)
        xml.required.set(true)
        txt.required.set(false)
        sarif.required.set(true)
    }

    jvmTarget = "17"
}

dependencies {
    detektPlugins("io.gitlab.arturbosch.detekt:detekt-formatting:1.23.4")
}
```

### Spotless (Code Formatting)

```kotlin
plugins {
    id("com.diffplug.spotless") version "6.23.3"
}

spotless {
    kotlin {
        target("**/*.kt")
        targetExclude("**/build/**")

        ktlint("1.0.1")
            .editorConfigOverride(
                mapOf(
                    "indent_size" to "4",
                    "max_line_length" to "120"
                )
            )
    }

    kotlinGradle {
        target("**/*.gradle.kts")
        ktlint()
    }
}
```

### JaCoCo (Code Coverage)

```kotlin
plugins {
    jacoco
}

jacoco {
    toolVersion = "0.8.11"
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)

    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(false)
    }

    classDirectories.setFrom(
        files(classDirectories.files.map {
            fileTree(it) {
                exclude(
                    "**/config/**",
                    "**/dto/**",
                    "**/entity/**"
                )
            }
        })
    )
}

tasks.jacocoTestCoverageVerification {
    dependsOn(tasks.jacocoTestReport)

    violationRules {
        rule {
            limit {
                minimum = "0.80".toBigDecimal()
            }
        }

        rule {
            element = "CLASS"
            limit {
                counter = "BRANCH"
                value = "COVEREDRATIO"
                minimum = "0.70".toBigDecimal()
            }
        }
    }
}

tasks.check {
    dependsOn(tasks.jacocoTestCoverageVerification)
}
```

## Gradle Wrapper

### Install/Update Wrapper

```bash
# Install wrapper (first time)
gradle wrapper --gradle-version 9.0 --distribution-type all

# Update wrapper (from existing project)
./gradlew wrapper --gradle-version 9.0 --distribution-type all
```

### Wrapper Files

```
gradlew              # Unix/Linux/Mac wrapper script
gradlew.bat          # Windows wrapper script
gradle/
  wrapper/
    gradle-wrapper.properties
    gradle-wrapper.jar
```

### gradle-wrapper.properties

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-9.0-all.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

**Always commit wrapper files** to version control!

## Common Commands

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

## Best Practices Summary

### DO ✅
- Use Gradle wrapper (`./gradlew`) for reproducible builds
- Use version catalogs (libs.versions.toml) for centralized dependency management
- Enable configuration cache for Gradle 9+ (faster builds)
- Use dependency locking for reproducible builds
- Use Kotlin DSL (build.gradle.kts) for type-safe builds
- Enable build cache (`org.gradle.caching=true`)
- Use task configuration avoidance (`tasks.register`)
- Use parallel execution (`org.gradle.parallel=true`)
- Use lazy properties (providers) for task inputs
- Pin Gradle version with wrapper
- Commit lock files and wrapper files to version control

### DON'T ❌
- Don't use global `gradle` command (use `./gradlew`)
- Don't use eager task configuration (`tasks.create`)
- Don't access files during configuration phase
- Don't hardcode dependency versions (use version catalogs)
- Don't skip configuration cache for Gradle 9+
- Don't forget to lock dependencies in production builds
- Don't commit `build/` or `.gradle/` directories
- Don't use deprecated APIs (check Gradle release notes)

---

**Quick Start:**
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
