---
name: gradle-patterns
description: Gradle Kotlin DSL build patterns for JVM projects. Use when writing or modifying build.gradle.kts files, setting up version catalogs (libs.versions.toml), configuring multi-project Gradle builds, enabling configuration cache, managing dependency locking, or troubleshooting Gradle build issues. Always consult for Gradle 9+ projects before making build changes.
user-invocable: false
---

# Gradle Patterns & Best Practices

Comprehensive patterns and examples for modern Gradle builds using Kotlin DSL and Gradle 9+ features.

## Version Catalogs (libs.versions.toml)

Centralized, type-safe dependency management via `gradle/libs.versions.toml`.

- Define `[versions]`, `[libraries]`, `[bundles]`, and `[plugins]` sections in the catalog
- Reference libraries type-safely in build scripts: `libs.bundles.spring.web`, `libs.plugins.kotlin.jvm`
- Use bundles to group related dependencies (e.g., all Jackson modules) under a single name

See [references/version-catalogs.md](references/version-catalogs.md) for the full catalog template and usage examples.

## Kotlin DSL Build Scripts

Use `build.gradle.kts` (Kotlin DSL) for type-safe, IDE-supported build configuration.

- Root `build.gradle.kts` applies common config to all subprojects via `allprojects` / `subprojects`
- Module scripts use `alias(libs.plugins.*)` and `libs.bundles.*` from the version catalog
- Configure `KotlinCompile` tasks for `jvmTarget`, `freeCompilerArgs`, and test parallelism

See [references/kotlin-dsl-build-scripts.md](references/kotlin-dsl-build-scripts.md) for root and application module examples.

## Multi-Project Build

Structure large projects as Gradle multi-project builds with a shared settings file.

- Declare all subprojects in `settings.gradle.kts` with `include(...)`
- Enable `TYPESAFE_PROJECT_ACCESSORS` to reference modules as `projects.common` instead of `project(":common")`
- Use `dependencyResolutionManagement` with `FAIL_ON_PROJECT_REPOS` to centralize repository declarations

See [references/multi-project-build.md](references/multi-project-build.md) for the project layout and settings template.

## Configuration Cache (Gradle 9+)

Cache the configuration phase result to dramatically speed up incremental builds.

- Enable via `org.gradle.configuration-cache=true` in `gradle.properties`
- Use `tasks.register` (lazy) instead of `tasks.create` (eager) to be cache-compatible
- Replace direct `project` access in task actions with `providers` for lazy evaluation

See [references/configuration-cache.md](references/configuration-cache.md) for gradle.properties settings, compatible task patterns, and rules to follow.

## Dependency Locking

Pin transitive dependency versions for reproducible builds across environments.

- Enable with `dependencyLocking { lockAllConfigurations() }` in `build.gradle.kts`
- Generate lock files with `./gradlew dependencies --write-locks`
- Lock files live in `gradle/dependency-locks/` and must be committed to version control

See [references/dependency-locking.md](references/dependency-locking.md) for the full configuration and update workflow.

## Build Performance Optimization

Tune `gradle.properties` and build cache settings to minimize build times.

- Enable daemon, parallel execution, build cache, configuration cache, and VFS watching
- Set JVM memory (`-Xmx4g`) and Kotlin incremental compilation flags
- Configure a local (and optionally remote) build cache in `settings.gradle.kts`

See [references/build-performance.md](references/build-performance.md) for the optimized `gradle.properties` template and performance commands.

## Custom Tasks

Extend Gradle with project-specific tasks using the Kotlin DSL task API.

- Register simple tasks with `tasks.register("name") { doLast { ... } }`
- Create typed tasks by extending `DefaultTask` with `@Input`, `@OutputFile`, and `@TaskAction`
- Declare dependencies between tasks with `dependsOn(...)` to control execution order

See [references/custom-tasks.md](references/custom-tasks.md) for simple, typed, and dependency examples.

## Code Quality Plugins

Integrate static analysis and formatting tools directly into the Gradle build.

- **Detekt**: Kotlin linting with configurable rules, baseline, and SARIF report output
- **Spotless**: Enforce code formatting via ktlint for `.kt` and `.gradle.kts` files
- **JaCoCo**: Measure test coverage and enforce minimum thresholds (80% line, 70% branch)

See [references/code-quality-plugins.md](references/code-quality-plugins.md) for full plugin configuration blocks.

## Gradle Wrapper

Always use the Gradle wrapper (`./gradlew`) for reproducible, version-pinned builds.

- Generate or update the wrapper with `gradle wrapper --gradle-version 9.0 --distribution-type all`
- Commit `gradlew`, `gradlew.bat`, and `gradle/wrapper/` files to version control
- Set `validateDistributionUrl=true` in `gradle-wrapper.properties` for security

See [references/gradle-wrapper.md](references/gradle-wrapper.md) for wrapper properties and update commands.

## Common Commands

Frequently used Gradle commands for building, testing, formatting, and profiling.

- Run `./gradlew build` for a full build, `./gradlew test jacocoTestReport` for coverage
- Use `./gradlew spotlessApply` and `./gradlew detekt` for code quality enforcement
- Profile slow builds with `./gradlew build --scan --profile`

See [references/common-commands.md](references/common-commands.md) for the full command reference and quick-start script.

## Reference Files

| File | Content |
|------|---------|
| [references/version-catalogs.md](references/version-catalogs.md) | Full `libs.versions.toml` template with libraries, bundles, plugins |
| [references/kotlin-dsl-build-scripts.md](references/kotlin-dsl-build-scripts.md) | Root and module `build.gradle.kts` examples |
| [references/multi-project-build.md](references/multi-project-build.md) | Project structure and `settings.gradle.kts` |
| [references/configuration-cache.md](references/configuration-cache.md) | Configuration cache setup and compatible task patterns |
| [references/dependency-locking.md](references/dependency-locking.md) | Lock file setup, generation, and update workflow |
| [references/build-performance.md](references/build-performance.md) | Optimized `gradle.properties` and build cache config |
| [references/custom-tasks.md](references/custom-tasks.md) | Simple, typed, and dependent task examples |
| [references/code-quality-plugins.md](references/code-quality-plugins.md) | Detekt, Spotless, and JaCoCo configurations |
| [references/gradle-wrapper.md](references/gradle-wrapper.md) | Wrapper setup and `gradle-wrapper.properties` |
| [references/common-commands.md](references/common-commands.md) | Build, test, format, profile, and quick-start commands |

## Best Practices

**Do:**
- Use Gradle wrapper (`./gradlew`) for reproducible builds
- Use version catalogs (`libs.versions.toml`) for centralized dependency management
- Enable configuration cache (`org.gradle.configuration-cache=true`) for Gradle 9+
- Use dependency locking for reproducible production builds
- Use Kotlin DSL (`build.gradle.kts`) for type-safe builds
- Enable build cache (`org.gradle.caching=true`) and parallel execution
- Use `tasks.register` (lazy) over `tasks.create` (eager)
- Commit lock files and wrapper files to version control

**Don't:**
- Use the global `gradle` command — always use `./gradlew`
- Use eager task configuration (`tasks.create`)
- Access files or do I/O during the configuration phase
- Hardcode dependency versions — use version catalogs
- Commit `build/` or `.gradle/` directories
- Use deprecated APIs (check Gradle release notes)
