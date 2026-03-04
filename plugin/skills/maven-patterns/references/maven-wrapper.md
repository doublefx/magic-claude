# Maven Wrapper Setup

## Install Maven Wrapper

```bash
# Install wrapper with specific Maven version
mvn wrapper:wrapper -Dmaven=3.9.6

# Or if Maven is not installed, download wrapper script first
curl -O https://raw.githubusercontent.com/takari/maven-wrapper/master/mvnw
chmod +x mvnw
./mvnw wrapper:wrapper -Dmaven=3.9.6
```

## Wrapper Properties (.mvn/wrapper/maven-wrapper.properties)

```properties
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip
wrapperUrl=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar
```

## Always Use Wrapper

```bash
# Correct
./mvnw clean verify
./mvnw install

# Avoid - relies on system Maven version, breaks reproducibility
mvn clean verify
mvn install
```
