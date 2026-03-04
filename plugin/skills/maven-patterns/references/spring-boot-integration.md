# Spring Boot Integration

## Spring Boot Parent POM (Simplest Option)

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
    <relativePath/>
</parent>
```

Use when you have no corporate/custom parent POM. Provides opinionated defaults for compiler, encoding, and plugin versions.

## Spring Boot with Custom Parent (Recommended for Multi-Module)

When you already have a corporate/custom parent POM, import the BOM instead of inheriting from `spring-boot-starter-parent`:

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
