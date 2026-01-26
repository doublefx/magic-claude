# Build Tools Guide

This guide explains how to use the Maven and Gradle expert agents, when to choose each build tool, and best practices for enterprise Java/Kotlin projects.

## Table of Contents

1. [Overview](#overview)
2. [Maven Expert Agent](#maven-expert-agent)
3. [Gradle Expert Agent](#gradle-expert-agent)
4. [Maven vs Gradle Comparison](#maven-vs-gradle-comparison)
5. [When to Use Which Tool](#when-to-use-which-tool)
6. [Common Workflows](#common-workflows)
7. [Troubleshooting](#troubleshooting)

## Overview

The Enterprise Stack Extension provides two specialized agents for Java/Kotlin build tools:

- **maven-expert** - Maven build tool specialist
- **gradle-expert** - Gradle build tool specialist (Gradle 9+ focus)

Additionally, the `maven-advisor` hook provides automatic recommendations when running Maven or Gradle commands.

### Quick Start

```bash
# Use Maven expert for Maven projects
/agent maven-expert

# Use Gradle expert for Gradle projects
/agent gradle-expert

# Maven advisor hook runs automatically on Bash commands
./mvnw install  # Hook suggests using ./mvnw verify instead
```

## Maven Expert Agent

The Maven expert agent specializes in:

- Dependency management and conflict resolution
- Multi-module project architecture
- Maven lifecycle best practices
- Maven wrapper enforcement
- OWASP dependency security scanning
- Build performance optimization

### How to Use

**Invoke the agent:**
```bash
/agent maven-expert
```

**Example prompts:**

1. **Review Maven configuration:**
   ```
   Review the Maven POM and suggest improvements
   ```

2. **Resolve dependency conflicts:**
   ```
   I'm seeing dependency conflicts with jackson-databind. Help me resolve them.
   ```

3. **Setup multi-module project:**
   ```
   Help me set up a multi-module Maven project with modules: common, api, service, web
   ```

4. **Add security scanning:**
   ```
   Add OWASP dependency-check plugin to scan for vulnerabilities
   ```

5. **Optimize build performance:**
   ```
   My Maven build is slow. How can I speed it up?
   ```

### What the Agent Reviews

When invoked, the maven-expert agent will:

1. **Check for critical issues:**
   - Missing Maven wrapper (mvnw)
   - Dependency conflicts (multiple versions of same library)
   - Hardcoded versions in child POMs
   - Global `mvn` usage instead of wrapper
   - Vulnerable dependencies

2. **Provide recommendations:**
   - Use `<dependencyManagement>` for version control
   - Import framework BOMs (Spring Boot, Jackson, etc.)
   - Enable parallel builds (-T 1C)
   - Pin plugin versions
   - Add Maven Enforcer plugin for version requirements

3. **Suggest commands to run:**
   - Dependency conflict analysis: `./mvnw dependency:tree`
   - Security scanning: `./mvnw org.owasp:dependency-check-maven:check`
   - Update checks: `./mvnw versions:display-dependency-updates`

### Example Agent Output

```markdown
## Maven Configuration Review

### Critical
- ❌ Missing Maven wrapper (mvnw) - Add for reproducible builds
- ❌ Dependency conflict: jackson-databind has 2 versions (2.13.0, 2.15.3)

### Recommendations
- Use `<dependencyManagement>` in parent POM for version control
- Consider BOM import for Spring dependencies: spring-boot-dependencies
- Enable parallel builds with `-T 1C` for 40% faster builds
- Pin plugin versions in `<pluginManagement>` section

### Commands to Run
\`\`\`bash
# Check dependency conflicts
./mvnw dependency:tree

# Check for security vulnerabilities
./mvnw org.owasp:dependency-check-maven:check

# Check for dependency updates
./mvnw versions:display-dependency-updates
\`\`\`
```

## Gradle Expert Agent

The Gradle expert agent specializes in:

- Gradle 9+ modern features (configuration cache, version catalogs)
- Kotlin DSL patterns and best practices
- Build performance optimization
- Dependency locking for reproducible builds
- Multi-project build architecture
- Code quality plugins (Detekt, Spotless, JaCoCo)

### How to Use

**Invoke the agent:**
```bash
/agent gradle-expert
```

**Example prompts:**

1. **Migrate to version catalogs:**
   ```
   Help me migrate my Gradle project to use version catalogs (libs.versions.toml)
   ```

2. **Enable Gradle 9 features:**
   ```
   I want to enable configuration cache and optimize my Gradle build for Gradle 9
   ```

3. **Setup multi-project build:**
   ```
   Set up a multi-project Gradle build with modules: common, api, service, web
   ```

4. **Add dependency locking:**
   ```
   Add dependency locking to ensure reproducible builds
   ```

5. **Optimize build performance:**
   ```
   My Gradle build is slow. What can I do to speed it up?
   ```

### What the Agent Reviews

When invoked, the gradle-expert agent will:

1. **Check for critical issues:**
   - Missing Gradle wrapper (gradlew)
   - Global `gradle` usage instead of wrapper
   - Eager task configuration (use `register` instead of `create`)
   - No dependency locking
   - Vulnerable dependencies

2. **Check for Gradle 9+ features:**
   - Version catalogs (gradle/libs.versions.toml)
   - Configuration cache enabled
   - Build cache enabled
   - Kotlin DSL usage
   - Dependency locking

3. **Check performance optimizations:**
   - Parallel execution enabled
   - Build cache enabled
   - Configuration cache enabled (Gradle 9+)
   - Daemon enabled
   - Appropriate JVM heap size

### Example Agent Output

```markdown
## Gradle Configuration Review

### Critical
- ❌ Missing Gradle wrapper (gradlew) - Add for reproducible builds
- ❌ Using eager task configuration - Switch to `tasks.register`

### Gradle 9+ Recommendations
- Add version catalogs (gradle/libs.versions.toml) for centralized dependency management
- Enable configuration cache: `org.gradle.configuration-cache=true`
- Use dependency locking for reproducible builds

### Performance Optimizations
- Enable build cache: `org.gradle.caching=true`
- Enable parallel execution: `org.gradle.parallel=true`
- Expected speedup: ~40-60% for incremental builds

### Commands to Run
\`\`\`bash
# Check for dependency updates
./gradlew dependencyUpdates

# Generate dependency locks
./gradlew dependencies --write-locks

# Enable configuration cache
echo "org.gradle.configuration-cache=true" >> gradle.properties

# Build with cache
./gradlew build --build-cache --configuration-cache
\`\`\`
```

## Maven vs Gradle Comparison

| Feature | Maven | Gradle |
|---------|-------|--------|
| **Build Speed** | Slower | Faster (incremental builds, build cache) |
| **Configuration** | XML (verbose) | Kotlin/Groovy DSL (concise) |
| **Flexibility** | Convention-based | Highly flexible |
| **Learning Curve** | Easier | Steeper |
| **Multi-project** | Good | Excellent |
| **Dependency Management** | dependencyManagement | Version catalogs |
| **Build Cache** | No | Yes |
| **Configuration Cache** | No | Yes (Gradle 9+) |
| **IDE Support** | Excellent | Excellent |
| **Community Size** | Larger | Large |
| **Best For** | Java enterprise, simple projects | Kotlin, Android, complex builds |

### Key Differences

**Maven Strengths:**
- Simpler, more straightforward
- Convention over configuration
- XML is familiar to many Java developers
- Larger ecosystem of plugins
- Easier to understand for beginners

**Gradle Strengths:**
- Much faster builds (incremental compilation, build cache)
- More flexible and powerful
- Better for complex builds
- Native Kotlin support (Kotlin DSL)
- Modern features (configuration cache, version catalogs)
- Better for Android development

## When to Use Which Tool

### Choose Maven When:

1. **Simple Java project** - Straightforward web app or library
2. **Team prefers XML** - Developers comfortable with XML configuration
3. **Enterprise Java** - Traditional Spring Boot applications
4. **Convention over configuration** - Want standardized project structure
5. **Legacy projects** - Existing Maven projects
6. **Learning Java builds** - Maven is easier to learn initially

**Example: Traditional Spring Boot REST API**
```xml
<project>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>
</project>
```

### Choose Gradle When:

1. **Kotlin projects** - Any project using Kotlin
2. **Complex builds** - Custom build logic, multiple build types
3. **Performance critical** - Large projects where build speed matters
4. **Multi-project builds** - Projects with many submodules
5. **Modern features** - Want version catalogs, configuration cache, etc.
6. **Android development** - Gradle is the standard for Android

**Example: Kotlin Multi-Module Project**
```kotlin
// build.gradle.kts
plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.spring.boot)
}

dependencies {
    implementation(libs.bundles.spring.web)
    implementation(libs.bundles.kotlin)
}
```

### Can I Use Both?

**Yes, in a monorepo!** Some organizations use:
- Gradle for Kotlin/Android modules
- Maven for Java/Spring modules

However, this adds complexity. It's usually better to standardize on one.

## Common Workflows

### Maven Workflows

**Local development:**
```bash
# Fast verification (recommended)
./mvnw clean verify

# Install to local repo (when needed by other projects)
./mvnw clean install

# Parallel build (faster)
./mvnw -T 1C clean verify
```

**Dependency management:**
```bash
# Check for dependency conflicts
./mvnw dependency:tree

# Check for updates
./mvnw versions:display-dependency-updates

# Security scan
./mvnw org.owasp:dependency-check-maven:check
```

**Multi-module builds:**
```bash
# Build all modules
./mvnw clean verify

# Build specific modules
./mvnw clean verify -pl service,web

# Build module and dependencies
./mvnw clean verify -pl web -am
```

### Gradle Workflows

**Local development:**
```bash
# Build project
./gradlew build

# Build with cache and configuration cache
./gradlew build --build-cache --configuration-cache

# Run tests only
./gradlew test
```

**Dependency management:**
```bash
# Show dependency tree
./gradlew dependencies

# Check for updates
./gradlew dependencyUpdates

# Generate dependency locks
./gradlew dependencies --write-locks
```

**Multi-project builds:**
```bash
# Build all projects
./gradlew build

# Build specific project
./gradlew :service:build

# Build project and dependencies
./gradlew :web:build
```

**Code quality:**
```bash
# Run all quality checks
./gradlew detekt spotlessCheck

# Format code
./gradlew spotlessApply

# Generate test coverage
./gradlew test jacocoTestReport
```

## Maven Advisor Hook

The `maven-advisor` hook automatically provides recommendations when running Maven or Gradle commands.

### What It Does

**Automatically advises on:**

1. **Use `mvn verify` instead of `mvn install`:**
   ```bash
   $ ./mvnw install
   [Hook] Consider: mvn verify (faster than install for local builds)
   [Hook] Use "mvn clean install" only when you need to publish to local repo
   ```

2. **Use wrapper instead of global command:**
   ```bash
   $ gradle build
   [Hook] Consider: Use ./gradlew instead of gradle for wrapper consistency
   ```

### When It Runs

The hook runs automatically on:
- Bash tool invocations
- Only in Maven or Gradle projects (detected by pom.xml, build.gradle, etc.)
- Doesn't block commands, just provides advice

### Disable Hook (if needed)

If you want to disable the hook advice, you can modify `hooks/hooks.json`:

```json
{
  "matcher": "tool == \"Bash\"",
  "hooks": [{
    "type": "command",
    "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/maven-advisor.cjs\"",
    "enabled": false  // Add this
  }]
}
```

## Related Skills

Access comprehensive patterns and examples with these skills:

### Maven Patterns Skill

**Invoke:**
```bash
/skill maven-patterns
```

**Provides:**
- Parent POM patterns
- Multi-module project structure
- Dependency management examples
- Common plugin configurations
- Maven wrapper setup
- Security scanning setup

### Gradle Patterns Skill

**Invoke:**
```bash
/skill gradle-patterns
```

**Provides:**
- Version catalogs examples (libs.versions.toml)
- Kotlin DSL patterns
- Multi-project build structure
- Configuration cache setup
- Dependency locking
- Code quality plugin configurations

## Troubleshooting

### Maven Issues

**Problem: Dependency conflicts**
```bash
# Solution: Analyze dependency tree
./mvnw dependency:tree

# Find conflicting versions
./mvnw dependency:tree | grep -A 5 "jackson-databind"

# Fix with exclusions in pom.xml
```

**Problem: Build is slow**
```bash
# Solution: Enable parallel builds
./mvnw -T 1C clean verify

# Check build time
time ./mvnw clean verify
```

**Problem: Maven wrapper not working**
```bash
# Solution: Reinstall wrapper
mvn wrapper:wrapper -Dmaven=3.9.6

# Make executable (Unix/Linux/Mac)
chmod +x mvnw
```

### Gradle Issues

**Problem: Build is slow**
```bash
# Solution: Enable modern features
echo "org.gradle.caching=true" >> gradle.properties
echo "org.gradle.configuration-cache=true" >> gradle.properties
echo "org.gradle.parallel=true" >> gradle.properties

# Use build scan to analyze
./gradlew build --scan
```

**Problem: Configuration cache issues**
```bash
# Solution: Fix configuration cache problems
./gradlew build --configuration-cache

# View problems
./gradlew build --configuration-cache --configuration-cache-problems=warn
```

**Problem: Dependency conflicts**
```bash
# Solution: Analyze dependencies
./gradlew dependencies --configuration runtimeClasspath

# Check specific dependency
./gradlew dependencyInsight --dependency jackson-databind
```

## Best Practices Summary

### Maven Best Practices

✅ **DO:**
- Use Maven wrapper (`./mvnw`) for reproducibility
- Use `<dependencyManagement>` in parent POM
- Run `mvn verify` for local development (faster than install)
- Use version properties for consistency
- Import framework BOMs (Spring Boot, Jackson)
- Enable parallel builds (`-T 1C`)
- Run OWASP dependency-check for security

❌ **DON'T:**
- Don't use global `mvn` command
- Don't hardcode versions in child POMs
- Don't use `mvn install` for every build
- Don't skip tests without good reason
- Don't commit `target/` directory

### Gradle Best Practices

✅ **DO:**
- Use Gradle wrapper (`./gradlew`) for reproducibility
- Use version catalogs (libs.versions.toml)
- Enable configuration cache (Gradle 9+)
- Use dependency locking for reproducibility
- Use Kotlin DSL for type safety
- Enable build cache and parallel execution
- Use task configuration avoidance

❌ **DON'T:**
- Don't use global `gradle` command
- Don't use eager task configuration
- Don't hardcode dependency versions
- Don't skip configuration cache for Gradle 9+
- Don't commit `build/` or `.gradle/` directories

## Quick Reference

### Maven Commands
```bash
./mvnw clean verify              # Local development
./mvnw clean install             # Install to local repo
./mvnw -T 1C clean verify        # Parallel build
./mvnw dependency:tree           # Dependency tree
./mvnw versions:display-dependency-updates  # Check updates
./mvnw org.owasp:dependency-check-maven:check  # Security scan
```

### Gradle Commands
```bash
./gradlew build                  # Build project
./gradlew build --build-cache --configuration-cache  # Optimized build
./gradlew test                   # Run tests
./gradlew dependencies           # Dependency tree
./gradlew dependencyUpdates      # Check updates
./gradlew dependencies --write-locks  # Lock dependencies
```

---

## Getting Help

**For Maven questions:**
```bash
/agent maven-expert
```

**For Gradle questions:**
```bash
/agent gradle-expert
```

**For detailed patterns:**
```bash
/skill maven-patterns   # Maven examples
/skill gradle-patterns  # Gradle examples
```

**For automatic advice:**
The `maven-advisor` hook runs automatically on Bash commands in Maven/Gradle projects.

---

**Last Updated:** 2026-01-25
**Version:** 1.0.0
