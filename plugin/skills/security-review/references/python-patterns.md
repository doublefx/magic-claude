# Python — Security Patterns

**Tools:** bandit, pip-audit, semgrep, defusedxml

## Quick Scan Commands

```bash
bandit -r src/ --severity-level medium
bandit -r src/ -f json
pip-audit
semgrep --config=p/owasp-top-ten --include="*.py"
grep -rn "password\s*=\s*['\"]" --include="*.py" .
grep -rn "api[_-]?key\s*=\s*['\"]" --include="*.py" .
```

## 1. Secrets Management

```python
# WRONG
API_KEY = "sk-proj-xxxxx"

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

- [ ] No hardcoded API keys, passwords, tokens
- [ ] All secrets via environment variables
- [ ] `.env` in .gitignore
- [ ] Pydantic Settings for validation

## 2. SQL Injection Prevention

```python
# WRONG: String formatting in SQL
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")

# CORRECT: Parameterized queries
cursor.execute("SELECT * FROM users WHERE email = %s", [email])

# CORRECT: SQLAlchemy bindparams
from sqlalchemy import text
result = session.execute(text("SELECT * FROM users WHERE email = :email"), {"email": email})

# CORRECT: Django ORM (safe by default)
User.objects.filter(email=email)
```

- [ ] All queries use parameters
- [ ] No f-strings or `.format()` in SQL
- [ ] ORM used where possible

## 3. Insecure Deserialization

```python
# CRITICAL — these are NEVER safe with untrusted data:
pickle.loads(untrusted)      # Arbitrary code execution!
yaml.load(untrusted)         # Code execution risk!
eval(user_input)             # NEVER do this!

# CORRECT alternatives:
data = json.loads(untrusted)
data = yaml.safe_load(untrusted)
data = ast.literal_eval(user_string)
from defusedxml.ElementTree import parse  # XXE-safe XML
```

- [ ] No `pickle.loads` with untrusted data
- [ ] `yaml.safe_load` (not `yaml.load`)
- [ ] No `eval`/`exec` with user input
- [ ] `defusedxml` for XML parsing

## 4. Command Injection Prevention

```python
# WRONG: shell=True with user input
subprocess.run(f"ping {host}", shell=True)

# CORRECT: List arguments (no shell interpretation)
subprocess.run(["ping", "-c", "1", validated_host], shell=False)

# If shell is truly required:
import shlex
subprocess.run(f"ping -c 1 {shlex.quote(host)}", shell=True)
```

- [ ] No `shell=True` with user input
- [ ] `subprocess` uses list arguments
- [ ] User input validated before use

## 5. Authentication — Django

```python
# settings.py
DEBUG = False  # NEVER True in production
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
PASSWORD_HASHERS = ["django.contrib.auth.hashers.Argon2PasswordHasher"]
```

- [ ] `DEBUG = False` in production
- [ ] `SECURE_*` settings enabled
- [ ] Strong password hashers (Argon2)
- [ ] CSRF middleware active

## 6. Authentication — FastAPI

```python
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

- [ ] JWT validation on protected routes
- [ ] Token expiry checked
- [ ] Algorithm explicitly specified

## 7. Input Validation

```python
# FastAPI / Pydantic
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

- [ ] Pydantic models for all API inputs
- [ ] Field constraints (min/max length, ranges)
- [ ] Error messages don't leak internals

## 8. SSRF Prevention

```python
# WRONG: Fetching user-provided URL
response = requests.get(user_url)

# CORRECT: Validate and allowlist
ALLOWED_HOSTS = {"api.example.com", "cdn.example.com"}

def safe_fetch(url: str):
    parsed = urlparse(url)
    if parsed.hostname not in ALLOWED_HOSTS:
        raise ValueError(f"Host not allowed: {parsed.hostname}")
    return requests.get(url, timeout=10)
```

- [ ] No unvalidated URL fetching
- [ ] Hostname allowlist enforced
- [ ] Timeout on all HTTP requests

## 9. Logging & Error Handling

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

- [ ] No passwords, tokens, PII in logs
- [ ] `logger.exception()` for server-side detail
- [ ] No traceback in API responses

## 10. Dependency Security

```bash
pip-audit
bandit -r src/ --severity-level medium
semgrep --config=p/owasp-top-ten --include="*.py"
```

- [ ] No critical CVEs in dependencies
- [ ] `pip-audit` runs in CI
- [ ] `bandit` configured in `pyproject.toml`
