# Profile Configuration

## Environment-Specific Profiles

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
