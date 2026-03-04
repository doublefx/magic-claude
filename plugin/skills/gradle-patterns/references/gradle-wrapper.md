# Gradle Wrapper

## Install/Update Wrapper

```bash
# Install wrapper (first time)
gradle wrapper --gradle-version 9.0 --distribution-type all

# Update wrapper (from existing project)
./gradlew wrapper --gradle-version 9.0 --distribution-type all
```

## Wrapper Files

```
gradlew              # Unix/Linux/Mac wrapper script
gradlew.bat          # Windows wrapper script
gradle/
  wrapper/
    gradle-wrapper.properties
    gradle-wrapper.jar
```

## gradle-wrapper.properties

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-9.0-all.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

**Always commit wrapper files** to version control!
