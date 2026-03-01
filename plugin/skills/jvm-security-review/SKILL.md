---
name: jvm-security-review
description: Use this skill for JVM (Java/Kotlin/Groovy) projects when adding authentication, handling user input, working with secrets, creating API endpoints, or implementing sensitive features. Provides 10-point JVM security checklist using SpotBugs, OWASP Dependency-Check, and Spring Security patterns.
context: fork
agent: Explore
---

# JVM Security Review Skill

This skill ensures all JVM (Java/Kotlin/Groovy) code follows security best practices and identifies potential vulnerabilities specific to the JVM ecosystem.

## When to Activate

- Implementing Spring Security configuration
- Handling user input in REST controllers
- Creating new API endpoints
- Working with database queries (JPA, Hibernate, JDBC)
- Parsing XML or deserializing data
- Integrating external APIs
- Managing secrets and credentials
- Implementing file upload/download

## 10-Point JVM Security Checklist

### 1. Secrets Management

```java
// NEVER hardcode secrets
// WRONG
String apiKey = "sk-proj-xxxxx";
String dbPassword = "password123";

// CORRECT: Environment variables
String apiKey = System.getenv("API_KEY");

// CORRECT: Spring @Value
@Value("${api.key}")
private String apiKey;

// CORRECT: Spring Vault
@VaultPropertySource("secret/myapp")
```

**Verification:**
- [ ] No hardcoded API keys, passwords, tokens
- [ ] All secrets via environment variables or vault
- [ ] application.yml uses `${ENV_VAR}` placeholders
- [ ] No secrets in git history

### 2. SQL Injection Prevention

```java
// WRONG: String concatenation
entityManager.createNativeQuery("SELECT * FROM users WHERE email = '" + email + "'");

// CORRECT: JPA named parameters
@Query("SELECT u FROM User u WHERE u.email = :email")
Optional<User> findByEmail(@Param("email") String email);

// CORRECT: Criteria API
CriteriaBuilder cb = em.getCriteriaBuilder();
CriteriaQuery<User> q = cb.createQuery(User.class);
Root<User> root = q.from(User.class);
q.where(cb.equal(root.get("email"), email));
```

**Verification:**
- [ ] All queries use parameterized parameters
- [ ] No string concatenation in native queries
- [ ] Spring Data JPA methods used where possible

### 3. Authentication & Authorization

```java
// Spring Security 6.x
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

// Method-level security
@PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
public User getUser(Long userId) { ... }
```

**Verification:**
- [ ] All endpoints have explicit access rules
- [ ] @PreAuthorize on sensitive methods
- [ ] Resource ownership verified (not just role)
- [ ] Session management configured

### 4. Input Validation

```java
// Bean Validation (Jakarta)
public record CreateUserRequest(
    @NotBlank @Size(max = 100) String name,
    @Email @NotBlank String email,
    @Min(0) @Max(150) Integer age
) {}

// Controller validation
@PostMapping("/users")
public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
    // request is already validated
}
```

**Verification:**
- [ ] All DTOs have validation annotations
- [ ] @Valid on controller parameters
- [ ] Custom validators for complex rules
- [ ] Error messages don't leak internal details

### 5. XXE Prevention

```java
// CORRECT: Disable external entities
DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
```

**Verification:**
- [ ] XML parsers configured to disable DTD
- [ ] No default DocumentBuilderFactory usage
- [ ] Consider JSON over XML where possible

### 6. Deserialization Safety

```java
// NEVER deserialize untrusted data with ObjectInputStream
// Use JSON with Jackson instead
// If ObjectInputStream required, use filters:
ObjectInputFilter filter = ObjectInputFilter.Config.createFilter("com.example.*;!*");
```

**Verification:**
- [ ] No ObjectInputStream with untrusted input
- [ ] Jackson ObjectMapper configured securely
- [ ] No polymorphic deserialization without safeguards

### 7. CSRF & CORS Configuration

```java
// CSRF (enabled by default in Spring Security)
.csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))

// CORS
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

**Verification:**
- [ ] CSRF enabled (or justified if disabled for API-only)
- [ ] CORS origins explicitly allowlisted
- [ ] No wildcard (*) in CORS origins in production

### 8. Logging & Error Handling

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

**Verification:**
- [ ] No passwords, tokens, PII in logs
- [ ] Generic error messages for users
- [ ] Detailed errors only in server logs
- [ ] No stack traces in API responses

### 9. Dependency Security

```bash
# Gradle OWASP check
./gradlew dependencyCheckAnalyze

# Maven OWASP check
./mvnw org.owasp:dependency-check-maven:check
```

**Verification:**
- [ ] No critical CVEs in dependencies
- [ ] OWASP dependency-check configured
- [ ] Dependencies regularly updated
- [ ] BOM versions managed centrally

### 10. Kotlin-Specific Safety

```kotlin
// Null safety prevents NPE-based vulnerabilities
val email = user?.email ?: throw IllegalArgumentException("Required")

// kotlinx.serialization (safe by default)
@Serializable
data class UserRequest(val name: String, val email: String)
```

**Verification:**
- [ ] Nullable types used correctly
- [ ] Platform types from Java handled safely
- [ ] kotlinx.serialization preferred over reflection-based

## Quick Security Scan Commands

```bash
# SpotBugs + FindSecurityBugs (Gradle)
./gradlew spotbugsMain

# OWASP Dependency-Check (Gradle)
./gradlew dependencyCheckAnalyze

# Secret scan
grep -rn "password\s*=\s*\"" --include="*.java" --include="*.kt" --include="*.properties" --include="*.yml" .
```

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [SpotBugs Bug Descriptions](https://spotbugs.readthedocs.io/en/latest/bugDescriptions.html)

---

**Remember**: Security is not optional for JVM applications. Spring Security provides excellent defaults -- make sure they're not disabled without justification.
