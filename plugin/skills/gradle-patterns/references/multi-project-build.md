# Multi-Project Build

## Project Structure

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

## settings.gradle.kts

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

## Module Dependencies with Type-Safe Accessors

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
