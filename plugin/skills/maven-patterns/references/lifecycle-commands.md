# Maven Lifecycle & Build Commands

## Maven Lifecycle Phases

```
validate → compile → test → package → verify → install → deploy
```

## Common Build Commands

```bash
# Fast verification (recommended for local development)
./mvnw clean verify

# Install to local repository (when needed by other projects)
./mvnw clean install

# Skip tests (use sparingly)
./mvnw clean package -DskipTests

# Run tests only
./mvnw test

# Run integration tests
./mvnw verify

# Parallel builds (faster)
./mvnw -T 1C clean verify

# Offline mode (use cached dependencies)
./mvnw -o clean verify

# Debug mode
./mvnw -X clean verify
```

## Quick Start

```bash
# Setup new Maven project with wrapper
mvn archetype:generate \
  -DarchetypeGroupId=org.apache.maven.archetypes \
  -DarchetypeArtifactId=maven-archetype-quickstart \
  -DarchetypeVersion=1.4 && \
mvn wrapper:wrapper -Dmaven=3.9.6
```
