---
name: maven-patterns
description: Maven build configuration patterns for Java/Kotlin projects. Use when writing or reviewing pom.xml files, configuring multi-module Maven projects, managing dependencies and BOMs, setting up Maven plugins, troubleshooting Maven build errors, or asking about Maven lifecycle and best practices. Consult before making any POM changes.
user-invocable: false
---

# Maven Patterns & Best Practices

Comprehensive patterns and examples for Apache Maven build configurations.

## Parent POM Pattern

- Use `<packaging>pom</packaging>` and declare all child modules in the parent POM.
- Centralise all dependency and plugin versions in `<properties>` at the parent level.
- Use `<dependencyManagement>` and `<pluginManagement>` in the parent; child POMs inherit without specifying versions.

See [references/parent-pom.md](references/parent-pom.md)

## Multi-Module Project Structure

- Place each module in its own subdirectory with its own `pom.xml` referencing the parent via `<relativePath>`.
- Internal module dependencies use `${project.version}` — never hardcode the version.
- Separate integration test sources into a dedicated `integration-test/java/` source tree.

See [references/parent-pom.md](references/parent-pom.md)

## Dependency Management Patterns

- Import framework BOMs (Spring Boot, Jackson) via `<scope>import</scope>` in `<dependencyManagement>` — never pin transitive versions manually.
- Use `<exclusions>` to resolve transitive conflicts (e.g., replace `spring-boot-starter-logging` with `log4j2`).
- Apply the correct dependency scope: `compile` (default), `provided`, `runtime`, or `test`.

See [references/dependency-management.md](references/dependency-management.md)

## Common Plugin Configurations

- **Compiler**: set `<source>`, `<target>`, and `-parameters` flag for Java 17+.
- **Surefire / Failsafe**: Surefire runs `*Test.java` unit tests; Failsafe runs `*IT.java` integration tests and must be bound to `integration-test` + `verify` goals.
- **JaCoCo**: attach `prepare-agent` before tests and enforce 80% line coverage via the `check` goal.
- **Enforcer**: mandate minimum Maven and Java versions; ban duplicate versions and problematic dependencies.
- **Versions plugin**: use `versions:display-dependency-updates` to surface stale dependencies without modifying the POM.

See [references/plugin-configurations.md](references/plugin-configurations.md)

## Maven Wrapper Setup

- Always commit the Maven wrapper (`mvnw`, `mvnw.cmd`, `.mvn/wrapper/`) — ensures all developers and CI use the same Maven version.
- Pin the exact Maven version in `maven-wrapper.properties`.
- Use `./mvnw` exclusively; never rely on the system `mvn` binary.

See [references/maven-wrapper.md](references/maven-wrapper.md)

## Lifecycle & Build Commands

- Prefer `./mvnw clean verify` for local development — faster than `install` and does not pollute the local repository.
- Use `./mvnw clean install` only when a sibling project depends on the local snapshot.
- Enable parallel builds with `-T 1C` for multi-module projects.

See [references/lifecycle-commands.md](references/lifecycle-commands.md)

## Spring Boot Integration

- Inherit from `spring-boot-starter-parent` only when no custom parent exists.
- For multi-module projects with a custom parent, import `spring-boot-dependencies` as a BOM instead.
- Always declare the `spring-boot-maven-plugin` with the `repackage` goal to produce an executable JAR.

See [references/spring-boot-integration.md](references/spring-boot-integration.md)

## Security Scanning

- Add the OWASP `dependency-check-maven` plugin and fail the build at CVSS score >= 7.
- Skip `provided`-scope dependencies (container-supplied) to reduce false positives.
- Maintain a `owasp-suppressions.xml` for confirmed false positives with documented rationale.

See [references/security-scanning.md](references/security-scanning.md)

## Profile Configuration

- Use profiles for environment-specific settings (`dev`, `prod`, `ci`) rather than hardcoding values.
- Activate `dev` by default; activate `prod` and `ci` explicitly via `-P`.
- Scope heavy plugins (frontend build, coverage reporting) to the profiles that need them.

See [references/profile-configuration.md](references/profile-configuration.md)

## Best Practices Summary

### DO
- Use Maven wrapper (`./mvnw`) for reproducibility
- Use `<dependencyManagement>` in parent POM for version control
- Use version properties for consistency
- Import framework BOMs (Spring Boot, Jackson, etc.)
- Run `./mvnw verify` for local development (faster than `install`)
- Enable parallel builds (`-T 1C`) for faster builds
- Pin plugin versions in `<pluginManagement>`
- Separate unit tests (`*Test.java`) from integration tests (`*IT.java`)
- Use Maven Enforcer plugin for version requirements
- Run OWASP dependency-check for security scanning

### DON'T
- Don't use global `mvn` command (use `./mvnw` wrapper)
- Don't hardcode versions in child POMs (use parent `<dependencyManagement>`)
- Don't use `mvn install` for every build (use `mvn verify` instead)
- Don't skip tests without good reason (`-DskipTests`)
- Don't commit the `target/` directory to git
- Don't mix compile and test dependencies (use correct scopes)
- Don't forget to exclude transitive dependencies causing conflicts

---

## Reference Files

| File | Contents |
|------|----------|
| [references/parent-pom.md](references/parent-pom.md) | Full parent POM XML, directory layout, child module POM |
| [references/dependency-management.md](references/dependency-management.md) | BOM imports, exclusions, all dependency scopes |
| [references/plugin-configurations.md](references/plugin-configurations.md) | Compiler, Surefire, Failsafe, JaCoCo, Enforcer, Versions plugins |
| [references/maven-wrapper.md](references/maven-wrapper.md) | Wrapper installation, properties file, usage rules |
| [references/lifecycle-commands.md](references/lifecycle-commands.md) | Lifecycle phases, common build commands, quick-start archetype |
| [references/spring-boot-integration.md](references/spring-boot-integration.md) | Spring Boot parent POM vs BOM import, maven plugin config |
| [references/security-scanning.md](references/security-scanning.md) | OWASP dependency-check plugin configuration and usage |
| [references/profile-configuration.md](references/profile-configuration.md) | Dev, prod, and CI profile examples with activation commands |
