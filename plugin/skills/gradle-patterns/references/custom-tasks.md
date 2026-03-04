# Custom Tasks

## Simple Custom Task

```kotlin
tasks.register("hello") {
    group = "custom"
    description = "Prints a greeting"

    doLast {
        println("Hello from Gradle!")
    }
}
```

## Typed Custom Task

```kotlin
abstract class GenerateVersionTask : DefaultTask() {
    @get:Input
    abstract val version: Property<String>

    @get:OutputFile
    abstract val outputFile: RegularFileProperty

    @TaskAction
    fun generate() {
        outputFile.get().asFile.writeText(
            "const val VERSION = \"${version.get()}\""
        )
    }
}

tasks.register<GenerateVersionTask>("generateVersion") {
    version.set(project.version.toString())
    outputFile.set(layout.buildDirectory.file("generated/Version.kt"))
}
```

## Task Dependencies

```kotlin
tasks.register("taskA") {
    doLast { println("Task A") }
}

tasks.register("taskB") {
    doLast { println("Task B") }
}

tasks.register("taskC") {
    dependsOn("taskA", "taskB")
    doLast { println("Task C") }
}

// Task execution order: taskA, taskB, then taskC
```
