# TypeScript/JavaScript — Security Patterns

**Tools:** npm audit, eslint-plugin-security, semgrep, DOMPurify

## Quick Scan Commands

```bash
npm audit
npm audit fix
semgrep --config=p/owasp-top-ten --include="*.ts" --include="*.js"
grep -rn "password\s*=\s*['\"]" --include="*.ts" --include="*.js" .
```

## 1. Secrets Management

```typescript
// WRONG
const apiKey = "sk-proj-xxxxx"
const dbPassword = "password123"

// CORRECT
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) throw new Error('OPENAI_API_KEY not configured')
```

- [ ] No hardcoded API keys, tokens, or passwords
- [ ] All secrets in environment variables
- [ ] `.env.local` in .gitignore
- [ ] Production secrets in hosting platform (Vercel, Railway)

## 2. Input Validation

```typescript
import { z } from 'zod'

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150)
})

export async function createUser(input: unknown) {
  const validated = CreateUserSchema.parse(input)
  return await db.users.create(validated)
}
```

File upload validation — size (5MB max), MIME type, extension.

- [ ] All user inputs validated with schemas
- [ ] File uploads restricted (size, type, extension)
- [ ] Whitelist validation (not blacklist)
- [ ] Error messages don't leak sensitive info

## 3. SQL Injection Prevention

```typescript
// WRONG
const query = `SELECT * FROM users WHERE email = '${userEmail}'`

// CORRECT
const { data } = await supabase.from('users').select('*').eq('email', userEmail)
// Or: await db.query('SELECT * FROM users WHERE email = $1', [userEmail])
```

- [ ] All database queries use parameterized queries
- [ ] No string concatenation in SQL
- [ ] ORM/query builder used correctly

## 4. Authentication & Authorization

```typescript
// WRONG: localStorage (vulnerable to XSS)
localStorage.setItem('token', token)

// CORRECT: httpOnly cookies
res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`)
```

```typescript
export async function deleteUser(userId: string, requesterId: string) {
  const requester = await db.users.findUnique({ where: { id: requesterId } })
  if (requester.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  await db.users.delete({ where: { id: userId } })
}
```

Row Level Security (Supabase):
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own data" ON users FOR SELECT USING (auth.uid() = id);
```

- [ ] Tokens in httpOnly cookies (not localStorage)
- [ ] Authorization checks before sensitive operations
- [ ] Row Level Security enabled in Supabase
- [ ] Role-based access control implemented

## 5. XSS Prevention

```typescript
import DOMPurify from 'isomorphic-dompurify'

function renderUserContent(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

CSP in `next.config.js`: `default-src 'self'` as base, explicit allowlist per directive.

- [ ] User-provided HTML sanitized
- [ ] CSP headers configured
- [ ] React's built-in XSS protection used

## 6. CSRF Protection

```typescript
export async function POST(request: Request) {
  const token = request.headers.get('X-CSRF-Token')
  if (!csrf.verify(token)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }
}
```

`SameSite=Strict` on all cookies.

- [ ] CSRF tokens on state-changing operations
- [ ] SameSite=Strict on all cookies

## 7. Rate Limiting

```typescript
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
app.use('/api/', limiter)

const searchLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 })
app.use('/api/search', searchLimiter)
```

- [ ] Rate limiting on all API endpoints
- [ ] Stricter limits on expensive operations

## 8. Sensitive Data Exposure

```typescript
// WRONG
console.log('User login:', { email, password })
catch (error) { return NextResponse.json({ error: error.message, stack: error.stack }) }

// CORRECT
console.log('User login:', { email, userId })
catch (error) {
  console.error('Internal error:', error)
  return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 })
}
```

- [ ] No passwords, tokens, or secrets in logs
- [ ] Generic error messages for users
- [ ] No stack traces exposed to users

## 9. Dependency Security

```bash
npm audit
npm audit fix
npm outdated
```

- [ ] No known vulnerabilities (`npm audit` clean)
- [ ] Lock files committed
- [ ] Dependabot enabled on GitHub

## Pre-Deployment Checklist

- [ ] Secrets: No hardcoded secrets, all in env vars
- [ ] Input Validation: All user inputs validated
- [ ] SQL Injection: All queries parameterized
- [ ] XSS: User content sanitized
- [ ] CSRF: Protection enabled
- [ ] Auth: Proper token handling, role checks in place
- [ ] Rate Limiting: Enabled on all endpoints
- [ ] HTTPS: Enforced in production
- [ ] Security Headers: CSP, X-Frame-Options configured
- [ ] Error Handling: No sensitive data in errors
- [ ] Logging: No sensitive data logged
- [ ] Dependencies: Up to date, no vulnerabilities
- [ ] CORS: Properly configured
- [ ] File Uploads: Validated (size, type)
