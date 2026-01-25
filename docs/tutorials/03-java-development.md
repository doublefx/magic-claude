# Tutorial 3: Java Development Workflow

**Duration**: 30 minutes
**Prerequisites**: Tutorial 01 completed, JDK 11+
**Learning Goals**: Maven/Gradle setup, Java code review, auto-formatting, Spring Boot patterns

---

## Overview

This tutorial covers Java development with Maven and Gradle:
- Project setup (Maven or Gradle)
- Auto-formatting with google-java-format
- Security scanning with SpotBugs
- Java code review with Spring Boot patterns
- Build optimization

---

## Part A: Maven Project (15 minutes)

### Step 1: Create Maven Project

```bash
# Create project with Maven
mvn archetype:generate \
  -DgroupId=com.example \
  -DartifactId=java-api-demo \
  -DarchetypeArtifactId=maven-archetype-quickstart \
  -DarchetypeVersion=1.4 \
  -DinteractiveMode=false

cd java-api-demo
```

### Step 2: Update pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>java-api-demo</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <spring-boot.version>3.2.1</spring-boot.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring-boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <version>${spring-boot.version}</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.2.5</version>
            </plugin>
        </plugins>
    </build>
</project>
```

### Step 3: Create Spring Boot Application

```java
// src/main/java/com/example/Application.java
package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

// src/main/java/com/example/controller/HealthController.java
package com.example.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("healthy", "1.0.0");
    }

    record HealthResponse(String status, String version) {}
}
```

### Step 4: Use Maven Expert

Start Claude Code and ask:

```
/maven-expert
```

**Output**:
```
Maven Optimization Report

1. Add Maven Wrapper
   Command: mvn wrapper:wrapper
   Benefit: Consistent Maven version across team

2. Enable Parallel Builds
   Command: mvn -T 4 verify
   Benefit: ~50% faster builds

3. Use BOM for Dependencies
   ✅ Already using Spring Boot BOM

4. Optimize Plugin Versions
   Recommendation: Use latest maven-surefire-plugin (3.2.5)
   ✅ Already configured

5. Use verify instead of install
   For local testing: mvn verify
   For publishing: mvn clean install
```

### Step 5: Java Code Review

Ask Claude:

```
/java-reviewer
```

**Output**:
```
Java Code Review

✅ Strengths:
- Uses Spring Boot 3.x
- Java 17 features (records)
- Clean controller structure

⚠️  Suggestions:
1. Use constructor injection instead of field injection
2. Add @Slf4j for logging
3. Add validation with @Valid
4. Consider using ResponseEntity for better control
5. Add API versioning (/api/v1/health)

🔒 Security:
- Add Spring Security for authentication
- Enable CORS configuration
- Add rate limiting

📝 Recommendations:
- Add integration tests with @SpringBootTest
- Use @RestControllerAdvice for error handling
- Add OpenAPI documentation with Springdoc
```

### Step 6: Maven Commands

```bash
# Install dependencies
./mvnw clean install

# Run tests
./mvnw test

# Package application
./mvnw package

# Run application
./mvnw spring-boot:run

# Skip tests (for faster builds)
./mvnw package -DskipTests

# Verify (better than install for local testing)
./mvnw verify
```

---

## Part B: Gradle Project (15 minutes)

### Step 1: Create Gradle Project (Kotlin DSL)

```bash
# Create project directory
mkdir gradle-api-demo
cd gradle-api-demo

# Initialize Gradle project
gradle init --type java-application --dsl kotlin --test-framework junit-jupiter
```

### Step 2: Update build.gradle.kts

```kotlin
plugins {
    id("java")
    id("org.springframework.boot") version "3.2.1"
    id("io.spring.dependency-management") version "1.1.4"
}

group = "com.example"
version = "1.0.0"

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

### Step 3: Configure gradle.properties

```properties
# Build performance
org.gradle.caching=true
org.gradle.parallel=true
org.gradle.daemon=true

# JVM optimization
org.gradle.jvmargs=-Xmx2g -XX:MaxMetaspaceSize=512m
```

### Step 4: Use Gradle Expert

Ask Claude:

```
/gradle-expert
```

**Output**:
```
Gradle Optimization Report

1. Migrate to Kotlin DSL
   ✅ Already using build.gradle.kts

2. Enable Build Caching
   ✅ Already enabled in gradle.properties

3. Use Version Catalogs
   Create: gradle/libs.versions.toml
   Benefits: Centralized dependency versions

Example libs.versions.toml:
[versions]
spring-boot = "3.2.1"
junit = "5.10.1"

[libraries]
spring-boot-web = { module = "org.springframework.boot:spring-boot-starter-web", version.ref = "spring-boot" }
junit-jupiter = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit" }

Usage in build.gradle.kts:
dependencies {
    implementation(libs.spring.boot.web)
    testImplementation(libs.junit.jupiter)
}

4. Use Configuration Cache
   Add: org.gradle.configuration-cache=true
   Benefit: Up to 90% faster repeated builds

5. Optimize Dependency Resolution
   Order repositories by frequency:
   repositories {
       mavenCentral()  // Most common
       gradlePluginPortal()
   }
```

### Step 5: Gradle Commands

```bash
# Build project
./gradlew build

# Run tests
./gradlew test

# Run application
./gradlew bootRun

# Clean and build
./gradlew clean build

# Build with cache
./gradlew build --build-cache

# Parallel builds (multi-project)
./gradlew build --parallel

# Skip tests
./gradlew build -x test

# Check for dependency updates
./gradlew dependencyUpdates
```

---

## Auto-Formatting (Works for Both Maven and Gradle)

### Install google-java-format

```bash
# macOS
brew install google-java-format

# Linux
wget https://github.com/google/google-java-format/releases/download/v1.19.2/google-java-format-1.19.2-all-deps.jar
alias google-java-format='java -jar ~/google-java-format-1.19.2-all-deps.jar'

# Verify
google-java-format --version
```

### Auto-Format on Save

Edit a Java file with Claude:

```
"Add a POST endpoint to create users in UserController.java"
```

The file will be **automatically formatted** when Claude edits it (if google-java-format is installed).

### Manual Formatting

```bash
# Format a file
google-java-format -i src/main/java/com/example/Application.java

# Format all Java files
find src -name "*.java" -exec google-java-format -i {} \;
```

---

## Security Scanning with SpotBugs

### Add SpotBugs to Maven

```xml
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
    <version>4.8.3.0</version>
    <configuration>
        <effort>Max</effort>
        <threshold>Low</threshold>
        <xmlOutput>true</xmlOutput>
    </configuration>
    <executions>
        <execution>
            <goals>
                <goal>check</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

### Add SpotBugs to Gradle

```kotlin
plugins {
    id("com.github.spotbugs") version "6.0.7"
}

spotbugs {
    effort = com.github.spotbugs.snom.Effort.MAX
    reportLevel = com.github.spotbugs.snom.Confidence.LOW
}
```

### Run SpotBugs

```bash
# Maven
./mvnw spotbugs:check

# Gradle
./gradlew spotbugsMain
```

---

## Generate CI/CD Pipeline

### For Maven

```
/ci-cd github-actions java-maven
```

**Generated**: `.github/workflows/ci.yml`

### For Gradle

```
/ci-cd github-actions java-gradle
```

---

## Complete Java Workflow

```bash
# 1. Create/edit Java code
# (Auto-formatting via hook)

# 2. Review code
/java-reviewer

# 3. Get build optimization tips
/maven-expert   # or /gradle-expert

# 4. Run tests
./mvnw test     # or ./gradlew test

# 5. Security scan
./mvnw spotbugs:check  # or ./gradlew spotbugsMain

# 6. Package
./mvnw package  # or ./gradlew build

# 7. Generate CI/CD
/ci-cd github-actions java-maven

# 8. Commit and push
git add .
git commit -m "feat: add user endpoints"
git push
```

---

## Best Practices Checklist

- [ ] Use Maven wrapper (mvnw) or Gradle wrapper (gradlew)
- [ ] Use constructor injection (not field injection)
- [ ] Add @Slf4j for logging
- [ ] Use records for DTOs (Java 17+)
- [ ] Add validation with @Valid
- [ ] Use BOM for dependency management (Maven)
- [ ] Use Version Catalogs (Gradle)
- [ ] Enable build caching
- [ ] Run SpotBugs for security
- [ ] Write integration tests with @SpringBootTest
- [ ] Use @RestControllerAdvice for error handling
- [ ] Add OpenAPI documentation
- [ ] Enable parallel builds

---

## Next Steps

- **Tutorial 04**: [CI/CD Generation](04-cicd-generation.md)
- **Tutorial 05**: [Advanced Features](05-advanced-features.md)

---

**Congratulations!** You now have a complete Java development workflow with Maven and Gradle.
