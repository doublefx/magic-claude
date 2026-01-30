---
name: proactive-review
description: Proactive code quality and security review. Claude invokes this automatically when tasks are completed, before commits, or when significant code changes are made.
user-invocable: false
context: fork
agent: code-reviewer
---

# Proactive Code Review

This skill provides automatic code quality and security review at strategic moments in the development workflow.

## When Claude Should Invoke This Skill

Claude should proactively invoke this skill when:

1. **Task Completion** - A development task was just completed
2. **Before Commit** - User is about to commit code changes
3. **Significant Changes** - Multiple files or complex logic was modified
4. **Security-Sensitive Code** - Authentication, authorization, input handling, or API endpoints were touched

## Review Checklist

### Security Issues (CRITICAL - Must Fix)

- [ ] **Hardcoded credentials** - API keys, passwords, tokens in source
- [ ] **SQL injection** - String concatenation in queries
- [ ] **XSS vulnerabilities** - Unescaped user input in HTML
- [ ] **Missing input validation** - User input not sanitized
- [ ] **SSRF vulnerabilities** - User-controlled URLs fetched
- [ ] **Path traversal** - User-controlled file paths
- [ ] **Authentication bypass** - Missing auth checks on routes

### Code Quality (HIGH - Should Fix)

- [ ] **Large functions** - Functions > 50 lines
- [ ] **Large files** - Files > 800 lines
- [ ] **Deep nesting** - Nesting depth > 4 levels
- [ ] **Missing error handling** - try/catch missing
- [ ] **console.log statements** - Debug statements left in
- [ ] **Mutation patterns** - Objects mutated instead of copied
- [ ] **Missing tests** - New code without test coverage

### Best Practices (MEDIUM - Consider)

- [ ] **Magic numbers** - Unexplained numeric constants
- [ ] **Poor naming** - Unclear variable/function names
- [ ] **Missing JSDoc** - Public APIs undocumented
- [ ] **Accessibility** - Missing ARIA labels, poor contrast
- [ ] **TODO/FIXME** - Unresolved comments without tickets

## Review Process

1. **Get changed files**
   ```bash
   git diff --name-only HEAD
   ```

2. **For each file**, check against checklist

3. **Generate report** with:
   - Severity level (CRITICAL, HIGH, MEDIUM, LOW)
   - File path and line number
   - Issue description
   - Suggested fix with code example

4. **Recommendation**:
   - ❌ **BLOCK** - CRITICAL or HIGH issues found
   - ⚠️ **WARN** - Only MEDIUM issues found
   - ✅ **APPROVE** - No significant issues

## Output Format

```markdown
## Code Review Report

**Files Reviewed:** X
**Risk Level:** HIGH/MEDIUM/LOW

### CRITICAL Issues (Fix Immediately)
1. **[Issue]** @ `file.ts:42`
   - Problem: [description]
   - Fix: [code example]

### HIGH Issues (Fix Before Commit)
1. **[Issue]** @ `file.ts:100`
   - Problem: [description]
   - Fix: [code example]

### MEDIUM Issues (Consider Fixing)
1. **[Issue]** @ `file.ts:200`
   - Problem: [description]
   - Suggestion: [recommendation]

### Recommendation
[BLOCK/WARN/APPROVE with explanation]
```

## Context Forking Note

This skill runs with `context: fork` to preserve the main conversation context. The review output will be summarized back to the main context, keeping only actionable findings.

## Related

- `/code-review` command - Explicit user-invoked full review
- `code-reviewer` agent - Full agent with code-reviewer tools
- `security-review` skill - Deep security analysis
