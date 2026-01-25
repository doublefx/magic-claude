---
name: maven-patterns
description: Maven POM patterns, multi-module project structures, dependency management, lifecycle best practices, and common plugin configurations for enterprise Java projects.
---

# Maven Patterns & Best Practices

Comprehensive patterns and examples for Apache Maven build configurations.

## Parent POM Pattern

### Basic Parent POM Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>parent-project</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>

    <name>Parent Project</name>
    <description>Parent POM for multi-module project</description>

    <modules>
        <module>common</module>
        <module>api</module>
        <module>service</module>
        <module>web</module>
    </modules>

    <properties>
        <!-- Java Version -->
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>

        <!-- Dependency Versions -->
        <spring-boot.version>3.2.0</spring-boot.version>
        <junit.version>5.10.1</junit.version>
        <mockito.version>5.8.0</mockito.version>
        <assertj.version>3.25.1</assertj.version>
        <lombok.version>1.18.30</lombok.version>

        <!-- Plugin Versions -->
        <maven-compiler-plugin.version>3.11.0</maven-compiler-plugin.version>
        <maven-surefire-plugin.version>3.2.2</maven-surefire-plugin.version>
        <maven-failsafe-plugin.version>3.2.2</maven-failsafe-plugin.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <!-- Spring Boot BOM -->
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring-boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- Testing -->
            <dependency>
                <groupId>org.junit.jupiter</groupId>
                <artifactId>junit-jupiter</artifactId>
                <version>${junit.version}</version>
                <scope>test</scope>
            </dependency>
            <dependency>
                <groupId>org.mockito</groupId>
                <artifactId>mockito-core</artifactId>
                <version>${mockito.version}</version>
                <scope>test</scope>
            </dependency>
            <dependency>
                <groupId>org.assertj</groupId>
                <artifactId>assertj-core</artifactId>
                <version>${assertj.version}</version>
                <scope>test</scope>
            </dependency>

            <!-- Utilities -->
            <dependency>
                <groupId>org.projectlombok</groupId>
                <artifactId>lombok</artifactId>
                <version>${lombok.version}</version>
                <scope>provided</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <version>${maven-compiler-plugin.version}</version>
                    <configuration>
                        <source>${maven.compiler.source}</source>
                        <target>${maven.compiler.target}</target>
                        <encoding>${project.build.sourceEncoding}</encoding>
                    </configuration>
                </plugin>

                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-surefire-plugin</artifactId>
                    <version>${maven-surefire-plugin.version}</version>
                </plugin>

                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-failsafe-plugin</artifactId>
                    <version>${maven-failsafe-plugin.version}</version>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

## Multi-Module Project Structure

### Recommended Directory Layout

```
parent-project/
├── pom.xml                    # Parent POM
├── mvnw                       # Maven wrapper (Unix)
├── mvnw.cmd                   # Maven wrapper (Windows)
├── .mvn/
│   └── wrapper/
│       ├── maven-wrapper.properties
│       └── maven-wrapper.jar
├── common/
│   ├── pom.xml
│   └── src/
│       ├── main/java/
│       └── test/java/
├── api/
│   ├── pom.xml
│   └── src/
│       ├── main/java/
│       └── test/java/
├── service/
│   ├── pom.xml
│   └── src/
│       ├── main/java/
│       ├── test/java/
│       └── integration-test/java/
└── web/
    ├── pom.xml
    └── src/
        ├── main/
        │   ├── java/
        │   └── resources/
        └── test/java/
```

### Child Module POM (api/pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.example</groupId>
        <artifactId>parent-project</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>

    <artifactId>api</artifactId>
    <packaging>jar</packaging>

    <name>API Module</name>
    <description>API definitions and DTOs</description>

    <dependencies>
        <!-- Internal dependency -->
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>common</artifactId>
            <version>${project.version}</version>
        </dependency>

        <!-- External dependencies (versions from parent) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
        </dependency>
    </dependencies>
</project>
```

## Dependency Management Patterns

### BOM (Bill of Materials) Import

```xml
<dependencyManagement>
    <dependencies>
        <!-- Import Spring Boot BOM -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.2.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>

        <!-- Import Jackson BOM -->
        <dependency>
            <groupId>com.fasterxml.jackson</groupId>
            <artifactId>jackson-bom</artifactId>
            <version>2.15.3</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### Dependency Exclusions (Avoid Conflicts)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <!-- Exclude default logging, use Log4j2 instead -->
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<!-- Use Log4j2 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-log4j2</artifactId>
</dependency>
```

### Dependency Scopes

```xml
<dependencies>
    <!-- compile (default) - available at compile and runtime -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- provided - available at compile time, provided by container at runtime -->
    <dependency>
        <groupId>javax.servlet</groupId>
        <artifactId>javax.servlet-api</artifactId>
        <scope>provided</scope>
    </dependency>

    <!-- runtime - not needed for compilation, needed at runtime -->
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- test - only for testing -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

## Common Plugin Configurations

### Compiler Plugin (Java 17+)

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <version>3.11.0</version>
    <configuration>
        <source>17</source>
        <target>17</target>
        <encoding>UTF-8</encoding>
        <compilerArgs>
            <arg>-parameters</arg>
            <arg>-Xlint:all</arg>
        </compilerArgs>
    </configuration>
</plugin>
```

### Surefire Plugin (Unit Tests)

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.2.2</version>
    <configuration>
        <!-- Parallel test execution -->
        <parallel>methods</parallel>
        <threadCount>4</threadCount>
        <useUnlimitedThreads>false</useUnlimitedThreads>

        <!-- Test naming patterns -->
        <includes>
            <include>**/*Test.java</include>
            <include>**/*Tests.java</include>
        </includes>

        <!-- System properties for tests -->
        <systemPropertyVariables>
            <java.util.logging.config.file>
                src/test/resources/logging.properties
            </java.util.logging.config.file>
        </systemPropertyVariables>
    </configuration>
</plugin>
```

### Failsafe Plugin (Integration Tests)

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-failsafe-plugin</artifactId>
    <version>3.2.2</version>
    <configuration>
        <!-- Integration test naming patterns -->
        <includes>
            <include>**/*IT.java</include>
            <include>**/*IntegrationTest.java</include>
        </includes>
    </configuration>
    <executions>
        <execution>
            <goals>
                <goal>integration-test</goal>
                <goal>verify</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

### JaCoCo Plugin (Code Coverage)

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <id>prepare-agent</id>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <execution>
            <id>check</id>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>PACKAGE</element>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### Maven Enforcer Plugin (Version Requirements)

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-enforcer-plugin</artifactId>
    <version>3.4.1</version>
    <executions>
        <execution>
            <id>enforce-versions</id>
            <goals>
                <goal>enforce</goal>
            </goals>
            <configuration>
                <rules>
                    <!-- Require Maven 3.8+ -->
                    <requireMavenVersion>
                        <version>[3.8,)</version>
                    </requireMavenVersion>

                    <!-- Require Java 17+ -->
                    <requireJavaVersion>
                        <version>[17,)</version>
                    </requireJavaVersion>

                    <!-- Ban duplicate dependencies -->
                    <banDuplicatePomDependencyVersions/>

                    <!-- Ban specific dependencies -->
                    <bannedDependencies>
                        <excludes>
                            <exclude>commons-logging:commons-logging</exclude>
                            <exclude>log4j:log4j</exclude>
                        </excludes>
                    </bannedDependencies>

                    <!-- Require dependency convergence -->
                    <dependencyConvergence/>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### Versions Maven Plugin (Dependency Updates)

```xml
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>versions-maven-plugin</artifactId>
    <version>2.16.2</version>
    <configuration>
        <generateBackupPoms>false</generateBackupPoms>
    </configuration>
</plugin>
```

**Usage:**
```bash
# Check for dependency updates
./mvnw versions:display-dependency-updates

# Check for plugin updates
./mvnw versions:display-plugin-updates

# Update version in POM
./mvnw versions:set -DnewVersion=2.0.0-SNAPSHOT
```

## Maven Wrapper Setup

### Install Maven Wrapper

```bash
# Install wrapper with specific Maven version
mvn wrapper:wrapper -Dmaven=3.9.6

# Or if Maven is not installed, download wrapper script first
curl -O https://raw.githubusercontent.com/takari/maven-wrapper/master/mvnw
chmod +x mvnw
./mvnw wrapper:wrapper -Dmaven=3.9.6
```

### Wrapper Properties (.mvn/wrapper/maven-wrapper.properties)

```properties
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip
wrapperUrl=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar
```

### Always Use Wrapper

```bash
# ✅ Correct
./mvnw clean verify
./mvnw install

# ❌ Avoid
mvn clean verify
mvn install
```

## Lifecycle & Build Commands

### Maven Lifecycle Phases

```
validate → compile → test → package → verify → install → deploy
```

### Common Build Commands

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

## Spring Boot Integration

### Spring Boot Parent POM

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
    <relativePath/>
</parent>
```

### Spring Boot with Custom Parent

```xml
<!-- Custom parent -->
<parent>
    <groupId>com.example</groupId>
    <artifactId>parent-project</artifactId>
    <version>1.0.0-SNAPSHOT</version>
</parent>

<!-- Import Spring Boot BOM -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.2.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- Spring Boot Maven Plugin -->
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <version>3.2.0</version>
            <executions>
                <execution>
                    <goals>
                        <goal>repackage</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

## Security Scanning

### OWASP Dependency-Check Plugin

```xml
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>9.0.9</version>
    <configuration>
        <!-- Fail build if CVSS score >= 7 (High) -->
        <failBuildOnCVSS>7</failBuildOnCVSS>

        <!-- Skip provided scope (container-provided dependencies) -->
        <skipProvidedScope>true</skipProvidedScope>

        <!-- Suppression file for false positives -->
        <suppressionFiles>
            <suppressionFile>owasp-suppressions.xml</suppressionFile>
        </suppressionFiles>

        <!-- Output formats -->
        <formats>
            <format>HTML</format>
            <format>JSON</format>
        </formats>
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

**Run security scan:**
```bash
./mvnw org.owasp:dependency-check-maven:check
```

## Profile Configuration

### Environment-Specific Profiles

```xml
<profiles>
    <!-- Development profile -->
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <spring.profiles.active>dev</spring.profiles.active>
        </properties>
    </profile>

    <!-- Production profile -->
    <profile>
        <id>prod</id>
        <properties>
            <spring.profiles.active>prod</spring.profiles.active>
        </properties>
        <build>
            <plugins>
                <!-- Minify resources in production -->
                <plugin>
                    <groupId>com.github.eirslett</groupId>
                    <artifactId>frontend-maven-plugin</artifactId>
                    <version>1.15.0</version>
                    <executions>
                        <execution>
                            <id>npm-build</id>
                            <goals>
                                <goal>npm</goal>
                            </goals>
                            <configuration>
                                <arguments>run build</arguments>
                            </configuration>
                        </execution>
                    </executions>
                </plugin>
            </plugins>
        </build>
    </profile>

    <!-- CI/CD profile -->
    <profile>
        <id>ci</id>
        <build>
            <plugins>
                <!-- Generate code coverage report -->
                <plugin>
                    <groupId>org.jacoco</groupId>
                    <artifactId>jacoco-maven-plugin</artifactId>
                    <executions>
                        <execution>
                            <id>report</id>
                            <goals>
                                <goal>report</goal>
                            </goals>
                        </execution>
                    </executions>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```

**Activate profile:**
```bash
./mvnw clean verify -Pprod
./mvnw clean verify -Pci
```

## Best Practices Summary

### DO ✅
- Use Maven wrapper (`./mvnw`) for reproducibility
- Use `<dependencyManagement>` in parent POM for version control
- Use version properties for consistency
- Import framework BOMs (Spring Boot, Jackson, etc.)
- Run `mvn verify` for local development (faster)
- Use `mvn install` only when needed for local multi-project dependencies
- Enable parallel builds (`-T 1C`) for faster builds
- Pin plugin versions in `<pluginManagement>`
- Separate unit tests (`*Test.java`) from integration tests (`*IT.java`)
- Use Maven Enforcer plugin for version requirements
- Run OWASP dependency-check for security scanning

### DON'T ❌
- Don't use global `mvn` command (use `./mvnw` wrapper)
- Don't hardcode versions in child POMs (use parent `<dependencyManagement>`)
- Don't use `mvn install` for every build (use `mvn verify` instead)
- Don't skip tests without good reason (`-DskipTests`)
- Don't commit `target/` directory to git
- Don't mix compile and test dependencies (use correct scopes)
- Don't forget to exclude transitive dependencies causing conflicts

---

**Quick Start Command:**
```bash
# Setup new Maven project with wrapper
mvn archetype:generate \
  -DarchetypeGroupId=org.apache.maven.archetypes \
  -DarchetypeArtifactId=maven-archetype-quickstart \
  -DarchetypeVersion=1.4 && \
mvn wrapper:wrapper -Dmaven=3.9.6
```
