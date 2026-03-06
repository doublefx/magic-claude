---
name: security-review
description: >
  Security review for TypeScript/JavaScript, JVM (Java/Kotlin/Groovy), and Python projects.
  Use when adding authentication, handling user input, working with secrets, creating API
  endpoints, or implementing sensitive features. Detects ecosystem and loads the matching
  security checklist automatically.
context: fork
agent: general-purpose
---

# Security Review

## Ecosystem Detection

Detect the project ecosystem from context, then **immediately read the matching reference**:

| Ecosystem | Indicators | Reference to read |
|-----------|-----------|-------------------|
| TypeScript / JavaScript | `package.json`, `.ts`, `.tsx`, `.js` | [references/typescript-patterns.md](references/typescript-patterns.md) |
| JVM (Java / Kotlin / Groovy) | `build.gradle`, `pom.xml`, `.java`, `.kt` | [references/jvm-patterns.md](references/jvm-patterns.md) |
| Python | `pyproject.toml`, `requirements.txt`, `.py` | [references/python-patterns.md](references/python-patterns.md) |

## When to Activate

- Implementing authentication or authorization
- Handling user input or file uploads
- Creating new API endpoints
- Working with secrets or credentials
- Implementing payment or sensitive features
- Storing or transmitting sensitive data
- Integrating third-party APIs

## Related

- `magic-claude:ts-security-reviewer` agent — TypeScript/JavaScript deep vulnerability analysis
- `magic-claude:jvm-security-reviewer` agent — JVM security analysis (SpotBugs, OWASP)
- `magic-claude:python-security-reviewer` agent — Python security analysis (bandit, semgrep)
