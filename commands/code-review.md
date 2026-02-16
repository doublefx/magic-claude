---
description: Security and quality review of uncommitted changes with severity reporting
---

# Code Review

## Current Changes

Changed files:
!`git diff --name-only HEAD`

Staged diff:
!`git diff --staged`

## Step 1: Detect Ecosystem

Examine the changed files to determine ecosystem(s):

**TypeScript/JavaScript**: `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` files
**JVM**: `.java`, `.kt`, `.kts`, `.groovy` files
**Python**: `.py` files

## Step 2: Ecosystem-Aware Review

For each changed file, apply ecosystem-appropriate checks:

### Security Issues (CRITICAL)

**All Ecosystems:**
- Hardcoded credentials, API keys, tokens
- Missing input validation
- Insecure dependencies
- Path traversal risks

**TypeScript/JavaScript:**
- SQL injection (string concatenation in queries)
- XSS vulnerabilities (dangerouslySetInnerHTML, innerHTML)
- console.log statements
- npm audit issues

**JVM (Java/Kotlin/Groovy):**
- SQL injection (string concatenation in JPQL/native queries)
- XXE in XML parsers (default DocumentBuilderFactory)
- ObjectInputStream deserialization
- System.out.println / e.printStackTrace() statements
- Missing @PreAuthorize on sensitive endpoints

**Python:**
- SQL injection (f-strings/format in queries)
- pickle.loads / yaml.load with untrusted data
- eval() / exec() with user input
- subprocess with shell=True
- print() statements in production code

### Code Quality (HIGH)

**All Ecosystems:**
- Functions > 50 lines
- Files > 800 lines
- Nesting depth > 4 levels
- Missing error handling
- Missing tests for new code

**TypeScript/JavaScript:**
- Mutation patterns (use immutable instead)
- Missing JSDoc for public APIs

**JVM:**
- Missing @NotNull/@Nullable annotations
- Mutable fields (prefer final/val)
- Missing @DisplayName on tests

**Python:**
- Missing type hints on public functions
- Mutable default arguments
- assert for validation (use if/raise)

### Best Practices (MEDIUM)

- TODO/FIXME comments without tickets
- Magic numbers without explanation
- Poor variable naming
- Missing accessibility (a11y) attributes

## Step 3: Dispatch to Specialist Agents

### Primary Review

Invoke the **magic-claude:code-reviewer** agent (opus) to perform comprehensive quality and security analysis across all changed files.

### Language-Specific Idiomatic Review

Delegate to specialized reviewers for ecosystem-specific patterns:

| File Type | Reviewer Agent |
|-----------|---------------|
| `.java` | **magic-claude:java-reviewer** |
| `.kt`, `.kts` | **magic-claude:kotlin-reviewer** |
| `.groovy` | **magic-claude:groovy-reviewer** |
| `.py` | **magic-claude:python-reviewer** |
| `.ts`, `.tsx`, `.js`, `.jsx` | (covered by magic-claude:code-reviewer) |

### Security Review

For security-sensitive changes (auth, input handling, API endpoints, payment), dispatch to ecosystem-specific security reviewers:

| Ecosystem | Security Agent |
|-----------|---------------|
| TypeScript/JavaScript | **magic-claude:ts-security-reviewer** |
| JVM (Java/Kotlin/Groovy) | **magic-claude:jvm-security-reviewer** |
| Python | **magic-claude:python-security-reviewer** |

## Step 4: Generate Report

```markdown
## Code Review Report

**Files Reviewed:** X
**Ecosystems:** TypeScript, Java, Python
**Risk Level:** HIGH/MEDIUM/LOW

### CRITICAL Issues (Fix Immediately)
1. **[Issue]** @ `file.ext:42`
   - Problem: [description]
   - Fix: [code example]

### HIGH Issues (Fix Before Commit)
...

### MEDIUM Issues (Consider Fixing)
...

### Recommendation
[BLOCK/WARN/APPROVE with explanation]
```

## Step 5: Verdict

- BLOCK: CRITICAL or HIGH issues found
- WARN: Only MEDIUM issues found
- APPROVE: No significant issues

Never approve code with security vulnerabilities!

## Step 6: Remediation Suggestions

If BLOCK verdict, include actionable next steps:

| Issue Type | Suggested Action |
|-----------|-----------------|
| Build errors | "Run `magic-claude:build-fix` to resolve build errors" |
| Missing tests | "Run `magic-claude:tdd` to add test coverage" |
| Coverage gaps | "Run `magic-claude:test-coverage` to fill coverage gaps" |
| Security issues | List specific fixes, then "re-run `magic-claude:code-review`" |
| Debug statements | "Remove debug statements before committing" |

If WARN verdict, list specific improvements and suggest re-running `magic-claude:code-review` after fixes.
