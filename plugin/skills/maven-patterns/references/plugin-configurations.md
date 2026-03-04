# Common Plugin Configurations

## Compiler Plugin (Java 17+)

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

## Surefire Plugin (Unit Tests)

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

## Failsafe Plugin (Integration Tests)

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

## JaCoCo Plugin (Code Coverage)

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

## Maven Enforcer Plugin (Version Requirements)

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

## Versions Maven Plugin (Dependency Updates)

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
