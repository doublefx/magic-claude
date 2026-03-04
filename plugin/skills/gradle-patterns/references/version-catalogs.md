# Version Catalogs (libs.versions.toml)

Version catalogs provide centralized, type-safe dependency management for Gradle projects.

## Setup Version Catalog

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

## Using Version Catalogs

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
