---
name: proactive-review
description: Proactive code quality and security review. Claude invokes this automatically when tasks are completed, before commits, or when significant code changes are made.
user-invocable: false
context: fork
agent: code-reviewer
---

# Proactive Code Review

This skill provides automatic code quality and security review at strategic moments in the development workflow. It detects the project ecosystem and applies appropriate checks.

## When Claude Should Invoke This Skill

Claude should proactively invoke this skill when:

1. **Task Completion** - A development task was just completed
2. **Before Commit** - User is about to commit code changes
3. **Significant Changes** - Multiple files or complex logic was modified
4. **Security-Sensitive Code** - Authentication, authorization, input handling, or API endpoints were touched

## Ecosystem Detection

Detect the ecosystem from changed files:

**TypeScript/JavaScript**: `.ts`, `.tsx`, `.js`, `.jsx` files
**JVM (Java/Kotlin/Groovy)**: `.java`, `.kt`, `.kts`, `.groovy` files
**Python**: `.py` files

## Review Checklist

### Security Issues (CRITICAL - Must Fix)

**All Ecosystems:**
- [ ] **Hardcoded credentials** - API keys, passwords, tokens in source
- [ ] **Missing input validation** - User input not sanitized
- [ ] **SSRF vulnerabilities** - User-controlled URLs fetched
- [ ] **Path traversal** - User-controlled file paths
- [ ] **Authentication bypass** - Missing auth checks on routes

**TypeScript/JavaScript:**
- [ ] **SQL injection** - String concatenation in queries
- [ ] **XSS vulnerabilities** - Unescaped user input in HTML
- [ ] **console.log statements** - Debug statements left in

**JVM (Java/Kotlin/Groovy):**
- [ ] **SQL injection** - String concatenation in JPQL/native queries
- [ ] **XXE** - Default XML parser without feature disabling
- [ ] **Deserialization** - ObjectInputStream with untrusted data
- [ ] **System.out.println** / **e.printStackTrace()** - Debug statements left in
- [ ] **Missing @PreAuthorize** - Sensitive endpoints unprotected

**Python:**
- [ ] **SQL injection** - f-strings/format in SQL queries
- [ ] **pickle/yaml.load** - Deserialization of untrusted data
- [ ] **eval/exec** - Execution of user input
- [ ] **subprocess shell=True** - Command injection risk
- [ ] **print() statements** - Debug statements left in

### Code Quality (HIGH - Should Fix)

- [ ] **Large functions** - Functions > 50 lines
- [ ] **Large files** - Files > 800 lines
- [ ] **Deep nesting** - Nesting depth > 4 levels
- [ ] **Missing error handling** - try/catch missing
- [ ] **Mutation patterns** - Objects mutated instead of copied
- [ ] **Missing tests** - New code without test coverage

### Best Practices (MEDIUM - Consider)

- [ ] **Magic numbers** - Unexplained numeric constants
- [ ] **Poor naming** - Unclear variable/function names
- [ ] **TODO/FIXME** - Unresolved comments without tickets

## Review Process

1. **Get changed files**
   ```bash
   git diff --name-only HEAD
   ```

2. **Detect ecosystem** from file extensions

3. **For each file**, check against ecosystem-appropriate checklist

4. **Delegate to language reviewers** if needed:
   - `.java` files -> `java-reviewer` agent
   - `.kt` files -> `kotlin-reviewer` agent
   - `.groovy` files -> `groovy-reviewer` agent
   - `.py` files -> `python-reviewer` agent

5. **Generate report** with:
   - Severity level (CRITICAL, HIGH, MEDIUM, LOW)
   - File path and line number
   - Issue description
   - Suggested fix with code example

6. **Recommendation**:
   - BLOCK - CRITICAL or HIGH issues found
   - WARN - Only MEDIUM issues found
   - APPROVE - No significant issues

## Output Format

```markdown
## Code Review Report

**Files Reviewed:** X
**Ecosystems:** [TypeScript, Java, Python]
**Risk Level:** HIGH/MEDIUM/LOW

### CRITICAL Issues (Fix Immediately)
1. **[Issue]** @ `file.ext:42`
   - Problem: [description]
   - Fix: [code example]

### HIGH Issues (Fix Before Commit)
...

### Recommendation
[BLOCK/WARN/APPROVE with explanation]
```

## Context Forking Note

This skill runs with `context: fork` to preserve the main conversation context. The review output will be summarized back to the main context, keeping only actionable findings.

## Related

- `/code-review` command - Explicit user-invoked full review (with ecosystem router)
- `code-reviewer` agent - General quality and security review
- `java-reviewer` agent - Java idioms and security
- `kotlin-reviewer` agent - Kotlin idioms and null safety
- `python-reviewer` agent - Python idioms and security
- `groovy-reviewer` agent - Groovy/Spock patterns
- `ts-security-reviewer` agent - TypeScript/JavaScript security specialist
- `jvm-security-reviewer` agent - JVM security specialist
- `python-security-reviewer` agent - Python security specialist
- `security-review` skill - TypeScript/JavaScript security checklist
- `jvm-security-review` skill - JVM security checklist
- `python-security-review` skill - Python security checklist
