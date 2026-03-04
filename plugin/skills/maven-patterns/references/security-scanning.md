# Security Scanning

## OWASP Dependency-Check Plugin

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
