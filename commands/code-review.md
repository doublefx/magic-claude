---
description: Comprehensive security and quality review of uncommitted changes with severity-based reporting
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

## Step 3: Dispatch to Language Reviewers

For language-specific idiomatic review, delegate to specialized reviewers:

| File Type | Reviewer Agent |
|-----------|---------------|
| `.java` | **java-reviewer** |
| `.kt`, `.kts` | **kotlin-reviewer** |
| `.groovy` | **groovy-reviewer** |
| `.py` | **python-reviewer** |
| `.ts`, `.tsx`, `.js` | (inline review - no separate agent) |

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
