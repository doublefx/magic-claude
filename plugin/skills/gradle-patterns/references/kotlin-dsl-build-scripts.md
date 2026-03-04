# Kotlin DSL Build Scripts

## Root Project (build.gradle.kts)

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

## Application Module (app/build.gradle.kts)

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
