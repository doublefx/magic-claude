# JVM (Java / Kotlin / Groovy) — Security Patterns

**Tools:** SpotBugs + FindSecurityBugs, OWASP Dependency-Check, Semgrep, Spring Security

## Quick Scan Commands

```bash
# SpotBugs + FindSecurityBugs
./gradlew spotbugsMain

# OWASP Dependency-Check
./gradlew dependencyCheckAnalyze
./mvnw org.owasp:dependency-check-maven:check

# Secret scan
grep -rn "password\s*=\s*\"" --include="*.java" --include="*.kt" --include="*.properties" --include="*.yml" .
```

## 1. Secrets Management

```java
// WRONG
String apiKey = "sk-proj-xxxxx";

// CORRECT: Environment variables
String apiKey = System.getenv("API_KEY");

// CORRECT: Spring @Value
@Value("${api.key}")
private String apiKey;
```

- [ ] No hardcoded API keys, passwords, tokens
- [ ] All secrets via environment variables or vault
- [ ] `application.yml` uses `${ENV_VAR}` placeholders
- [ ] No secrets in git history

## 2. SQL Injection Prevention

```java
// WRONG: String concatenation
entityManager.createNativeQuery("SELECT * FROM users WHERE email = '" + email + "'");

// CORRECT: JPA named parameters
@Query("SELECT u FROM User u WHERE u.email = :email")
Optional<User> findByEmail(@Param("email") String email);

// CORRECT: Criteria API
CriteriaBuilder cb = em.getCriteriaBuilder();
q.where(cb.equal(root.get("email"), email));
```

- [ ] All queries use parameterized parameters
- [ ] No string concatenation in native queries
- [ ] Spring Data JPA methods used where possible

## 3. Authentication & Authorization

```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/public/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated()
        )
        .build();
}

@PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
public User getUser(Long userId) { ... }
```

- [ ] All endpoints have explicit access rules
- [ ] `@PreAuthorize` on sensitive methods
- [ ] Resource ownership verified (not just role)
- [ ] Session management configured

## 4. Input Validation

```java
public record CreateUserRequest(
    @NotBlank @Size(max = 100) String name,
    @Email @NotBlank String email,
    @Min(0) @Max(150) Integer age
) {}

@PostMapping("/users")
public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) { ... }
```

- [ ] All DTOs have validation annotations
- [ ] `@Valid` on controller parameters
- [ ] Error messages don't leak internal details

## 5. XXE Prevention

```java
DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
```

- [ ] XML parsers configured to disable DTD
- [ ] No default `DocumentBuilderFactory` usage
- [ ] Consider JSON over XML where possible

## 6. Deserialization Safety

```java
// NEVER deserialize untrusted data with ObjectInputStream
// Use JSON with Jackson instead
// If ObjectInputStream required, use filters:
ObjectInputFilter filter = ObjectInputFilter.Config.createFilter("com.example.*;!*");
```

- [ ] No `ObjectInputStream` with untrusted input
- [ ] Jackson `ObjectMapper` configured securely
- [ ] No polymorphic deserialization without safeguards

## 7. CSRF & CORS Configuration

```java
.csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))

@Bean
CorsConfigurationSource corsConfigurationSource() {
    var config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://myapp.com"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

- [ ] CSRF enabled (or justified if disabled for API-only)
- [ ] CORS origins explicitly allowlisted
- [ ] No wildcard (`*`) in CORS origins in production

## 8. Logging & Error Handling

```java
// WRONG
log.info("Login: {}, password: {}", email, password);
catch (Exception e) { return ResponseEntity.status(500).body(e.getMessage()); }

// CORRECT
log.info("Login attempt: {}", maskEmail(email));
catch (Exception e) {
    log.error("Internal error", e);
    return ResponseEntity.status(500).body("An error occurred");
}
```

- [ ] No passwords, tokens, PII in logs
- [ ] Generic error messages for users
- [ ] No stack traces in API responses

## 9. Dependency Security

```bash
./gradlew dependencyCheckAnalyze
./mvnw org.owasp:dependency-check-maven:check
```

- [ ] No critical CVEs in dependencies
- [ ] OWASP dependency-check configured
- [ ] Dependencies regularly updated

## 10. Kotlin-Specific Safety

```kotlin
// Null safety prevents NPE-based vulnerabilities
val email = user?.email ?: throw IllegalArgumentException("Required")

// kotlinx.serialization (safe by default)
@Serializable
data class UserRequest(val name: String, val email: String)
```

- [ ] Nullable types used correctly
- [ ] Platform types from Java handled safely
- [ ] `kotlinx.serialization` preferred over reflection-based
