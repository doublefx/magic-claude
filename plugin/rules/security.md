# Security Guidelines

## Mandatory Security Checks (All Ecosystems)

Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

## Secret Management

### TypeScript/JavaScript
```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-proj-xxxxx"

// ALWAYS: Environment variables
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

### JVM (Java/Kotlin)
```java
// NEVER: Hardcoded secrets
String apiKey = "sk-proj-xxxxx";

// ALWAYS: Environment variables or Spring config
String apiKey = System.getenv("OPENAI_API_KEY");

// Spring Boot
@Value("${openai.api-key}")
private String apiKey;
```

### Python
```python
# NEVER: Hardcoded secrets
api_key = "sk-proj-xxxxx"

# ALWAYS: Environment variables
import os
api_key = os.environ["OPENAI_API_KEY"]

# Pydantic Settings
class Settings(BaseSettings):
    openai_api_key: str
    model_config = SettingsConfigDict(env_file=".env")
```

## Ecosystem-Specific Security

### TypeScript/JavaScript
- SQL injection: Use parameterized queries, never string concatenation
- XSS: Sanitize all user input rendered in HTML
- npm audit: Run `npm audit` regularly
- Use `magic-claude:ts-security-reviewer` agent for review

### JVM (Java/Kotlin)
- SQL injection: Use JPA parameterized queries, never JPQL string concatenation
- XXE: Disable external entities in XML parsers (DocumentBuilderFactory)
- Deserialization: Never use ObjectInputStream with untrusted data
- Spring Security: Use `@PreAuthorize` on sensitive endpoints
- Dependencies: Run OWASP dependency-check (`./gradlew dependencyCheckAnalyze`)
- Use `magic-claude:jvm-security-reviewer` agent for review

### Python
- SQL injection: Use SQLAlchemy parameterized queries, never f-strings in queries
- Deserialization: Never use `pickle.loads()` or `yaml.load()` with untrusted data
- Command injection: Never use `subprocess` with `shell=True` and user input
- Code execution: Never use `eval()` or `exec()` with user input
- Dependencies: Run `pip-audit` and `bandit` regularly
- Use `magic-claude:python-security-reviewer` agent for review

## Security Response Protocol

If security issue found:
1. STOP immediately
2. Use the appropriate security reviewer agent:
   - TypeScript/JavaScript: **magic-claude:ts-security-reviewer**
   - JVM: **magic-claude:jvm-security-reviewer**
   - Python: **magic-claude:python-security-reviewer**
3. Fix CRITICAL issues before continuing
4. Rotate any exposed secrets
5. Review entire codebase for similar issues
