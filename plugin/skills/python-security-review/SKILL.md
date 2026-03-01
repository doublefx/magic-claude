---
name: python-security-review
description: Use this skill for Python projects when adding authentication, handling user input, working with secrets, creating API endpoints, or implementing sensitive features. Provides 10-point Python security checklist using bandit, pip-audit, semgrep, and Django/FastAPI security patterns.
context: fork
agent: Explore
---

# Python Security Review Skill

This skill ensures all Python code follows security best practices and identifies potential vulnerabilities specific to the Python ecosystem.

## When to Activate

- Implementing authentication (Django/FastAPI)
- Handling user input or file uploads
- Creating new API endpoints
- Working with database queries (Django ORM, SQLAlchemy, raw SQL)
- Deserializing data (pickle, YAML, XML)
- Integrating external APIs
- Managing secrets and credentials
- Running subprocess commands

## 10-Point Python Security Checklist

### 1. Secrets Management

```python
# NEVER hardcode secrets
# WRONG
API_KEY = "sk-proj-xxxxx"
DATABASE_URL = "postgresql://user:password@host/db"

# CORRECT: Environment variables
import os
API_KEY = os.environ["API_KEY"]

# CORRECT: Pydantic Settings
from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    api_key: str
    database_url: str
    model_config = ConfigDict(env_file=".env")
```

**Verification:**
- [ ] No hardcoded API keys, passwords, tokens
- [ ] All secrets via environment variables
- [ ] .env in .gitignore
- [ ] Pydantic Settings for validation

### 2. SQL Injection Prevention

```python
# WRONG: String formatting in SQL
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")

# CORRECT: Parameterized queries
cursor.execute("SELECT * FROM users WHERE email = %s", [email])

# CORRECT: SQLAlchemy with bindparams
from sqlalchemy import text
stmt = text("SELECT * FROM users WHERE email = :email")
result = session.execute(stmt, {"email": email})

# CORRECT: Django ORM (safe by default)
User.objects.filter(email=email)
```

**Verification:**
- [ ] All queries use parameters
- [ ] No f-strings or .format() in SQL
- [ ] ORM used where possible
- [ ] Raw SQL uses bindparams

### 3. Insecure Deserialization

```python
# CRITICAL: pickle is NEVER safe with untrusted data
import pickle
data = pickle.loads(untrusted)  # Arbitrary code execution!

# CRITICAL: yaml.load is unsafe
data = yaml.load(untrusted)  # Code execution risk!

# CRITICAL: eval/exec
result = eval(user_input)  # NEVER do this!

# CORRECT alternatives:
data = json.loads(untrusted)            # JSON is safe
data = yaml.safe_load(untrusted)        # SafeLoader only
data = ast.literal_eval(user_string)    # Literals only
from defusedxml.ElementTree import parse  # XXE-safe XML
```

**Verification:**
- [ ] No pickle.loads with untrusted data
- [ ] yaml.safe_load (not yaml.load)
- [ ] No eval/exec with user input
- [ ] defusedxml for XML parsing

### 4. Command Injection Prevention

```python
# WRONG: shell=True with user input
subprocess.run(f"ping {host}", shell=True)

# CORRECT: List arguments (no shell interpretation)
subprocess.run(["ping", "-c", "1", validated_host], shell=False)

# CORRECT: shlex.quote for shell strings (if shell needed)
import shlex
subprocess.run(f"ping -c 1 {shlex.quote(host)}", shell=True)
```

**Verification:**
- [ ] No shell=True with user input
- [ ] subprocess uses list arguments
- [ ] User input validated before use

### 5. Authentication (Django)

```python
# settings.py
DEBUG = False  # NEVER True in production
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
]
```

**Verification:**
- [ ] DEBUG = False in production
- [ ] SECURE_* settings enabled
- [ ] Strong password hashers (Argon2)
- [ ] CSRF middleware active

### 6. Authentication (FastAPI)

```python
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401)
    return await get_user(user_id)
```

**Verification:**
- [ ] JWT validation on protected routes
- [ ] Token expiry checked
- [ ] Dependency injection for auth
- [ ] Algorithm explicitly specified

### 7. Input Validation

```python
# Pydantic (FastAPI)
from pydantic import BaseModel, EmailStr, Field, field_validator

class CreateUser(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    age: int = Field(ge=0, le=150)

# Django Forms
class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ["name", "email"]
```

**Verification:**
- [ ] Pydantic models for all API inputs
- [ ] Field constraints (min/max length, ranges)
- [ ] Custom validators for business rules
- [ ] Error messages don't leak internals

### 8. SSRF Prevention

```python
# WRONG: Fetching user-provided URL
response = requests.get(user_url)

# CORRECT: Validate and allowlist
from urllib.parse import urlparse
ALLOWED_HOSTS = {"api.example.com", "cdn.example.com"}

def safe_fetch(url: str):
    parsed = urlparse(url)
    if parsed.hostname not in ALLOWED_HOSTS:
        raise ValueError(f"Host not allowed: {parsed.hostname}")
    return requests.get(url, timeout=10)
```

**Verification:**
- [ ] No unvalidated URL fetching
- [ ] Hostname allowlist enforced
- [ ] Timeout on all HTTP requests
- [ ] Private IP ranges blocked

### 9. Logging & Error Handling

```python
# WRONG
logger.info(f"Login: {email}, password: {password}")
except Exception as e:
    return {"error": str(e), "traceback": traceback.format_exc()}

# CORRECT
logger.info(f"Login attempt: {mask_email(email)}")
except Exception as e:
    logger.exception("Internal error")
    return {"error": "An error occurred"}
```

**Verification:**
- [ ] No passwords, tokens, PII in logs
- [ ] Generic error messages for users
- [ ] logger.exception() for server-side detail
- [ ] No traceback in API responses

### 10. Dependency Security

```bash
# pip-audit
pip-audit

# bandit (code scanning)
bandit -r src/ --severity-level medium

# semgrep (pattern matching)
semgrep --config=p/python --config=p/owasp-top-ten
```

**Verification:**
- [ ] No critical CVEs in dependencies
- [ ] pip-audit runs in CI
- [ ] bandit configured in pyproject.toml
- [ ] Dependencies regularly updated

## Quick Security Scan Commands

```bash
# Code security
bandit -r src/ -f json

# Dependency audit
pip-audit

# OWASP patterns
semgrep --config=p/owasp-top-ten --include="*.py"

# Secret scan
grep -rn "password\s*=\s*['\"]" --include="*.py" .
grep -rn "api[_-]?key\s*=\s*['\"]" --include="*.py" .
```

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security](https://docs.djangoproject.com/en/5.0/topics/security/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [bandit Documentation](https://bandit.readthedocs.io/)

---

**Remember**: Security is not optional for Python applications. Pay special attention to pickle, eval, shell=True, and string-formatted SQL -- these are the most common Python-specific vulnerability vectors.
