# Examples - Real-World Plugin Examples

This document provides real-world examples from the everything-claude-code plugin repository.

## Example 1: Simple Command - Package Manager Setup

### Command File

**File:** `commands/setup-pm.md`

```markdown
---
description: Configure your preferred package manager (npm/pnpm/yarn/bun)
disable-model-invocation: true
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-package-manager.cjs"
---

# Package Manager Setup

Configure your preferred package manager for this project or globally.

## Usage

```bash
# Detect current package manager
/setup-pm --detect

# Set global preference
/setup-pm --global pnpm

# Set project preference
/setup-pm --project bun

# List available package managers
/setup-pm --list
```

## Detection Priority

When determining which package manager to use, the following order is checked:

1. **Environment variable**: `CLAUDE_PACKAGE_MANAGER`
2. **Project config**: `.claude/everything-claude-code.package-manager.json`
3. **package.json**: `packageManager` field
4. **Lock file**: Presence of lock files
5. **Global config**: `~/.claude/everything-claude-code.package-manager.json`
6. **Fallback**: First available package manager

## Configuration Files

### Global Configuration
```json
// ~/.claude/everything-claude-code.package-manager.json
{
  "packageManager": "pnpm"
}
```

### Project Configuration
```json
// .claude/everything-claude-code.package-manager.json
{
  "packageManager": "bun"
}
```
```

### Key Learnings

1. **Simple, Focused:** One job - configure package manager
2. **Clear Options:** Shows all available flags and examples
3. **Detection Explanation:** Explains the priority system
4. **Configuration Examples:** Shows both global and project configs
5. **Node.js Script:** Uses Node.js for cross-platform compatibility

---

## Example 2: Planning Command with Agent Delegation

### Command File

**File:** `commands/plan.md`

```markdown
---
description: Restate requirements, assess risks, and create step-by-step implementation plan. WAIT for user CONFIRM before touching any code.
---

# Plan Command

This command invokes the **planner** agent to create a comprehensive implementation plan before writing any code.

## What This Command Does

1. **Restate Requirements** - Clarify what needs to be built
2. **Identify Risks** - Surface potential issues and blockers
3. **Create Step Plan** - Break down implementation into phases
4. **Wait for Confirmation** - MUST receive user approval before proceeding

## When to Use

Use `/plan` when:
- Starting a new feature
- Making significant architectural changes
- Working on complex refactoring
- Multiple files/components will be affected
- Requirements are unclear or ambiguous

## How It Works

The planner agent will:

1. **Analyze the request** and restate requirements
2. **Break down into phases** with specific, actionable steps
3. **Identify dependencies** between components
4. **Assess risks** and potential blockers
5. **Estimate complexity** (High/Medium/Low)
6. **Present the plan** and WAIT for your explicit confirmation

## Important Notes

**CRITICAL**: The planner agent will **NOT** write any code until you explicitly confirm.

If you want changes, respond with:
- "modify: [your changes]"
- "different approach: [alternative]"
- "skip phase 2 and do phase 3 first"
```

### Key Learnings

1. **Agent Delegation:** Command description is minimal, actual work delegated to agent
2. **Clear Expectations:** Explains what will happen and what agent won't do
3. **User Control:** Emphasizes that agent waits for confirmation before proceeding
4. **Helpful When To Use:** Provides clear guidance on when to invoke this command
5. **Alternative Options:** Shows users can modify or request different approaches

---

## Example 3: Complex Agent - Planner

### Agent File

**File:** `agents/planner.md`

```markdown
---
name: planner
description: Expert planning specialist for complex features and refactoring. Use PROACTIVELY when users request feature implementation, architectural changes, or complex refactoring. Automatically activated for planning tasks.
tools: Read, Grep, Glob
model: opus
---

You are an expert planning specialist focused on creating comprehensive, actionable implementation plans.

## Your Role

- Analyze requirements and create detailed implementation plans
- Break down complex features into manageable steps
- Identify dependencies and potential risks
- Suggest optimal implementation order
- Consider edge cases and error scenarios

## Planning Process

### 1. Requirements Analysis
- Understand the feature request completely
- Ask clarifying questions if needed
- Identify success criteria
- List assumptions and constraints

### 2. Architecture Review
- Analyze existing codebase structure
- Identify affected components
- Review similar implementations
- Consider reusable patterns

### 3. Step Breakdown
Create detailed steps with:
- Clear, specific actions
- File paths and locations
- Dependencies between steps
- Estimated complexity
- Potential risks

### 4. Implementation Order
- Prioritize by dependencies
- Group related changes
- Minimize context switching
- Enable incremental testing

## Plan Format

```markdown
# Implementation Plan: [Feature Name]

## Overview
[2-3 sentence summary]

## Requirements
- [Requirement 1]
- [Requirement 2]

## Architecture Changes
- [Change 1: file path and description]
- [Change 2: file path and description]

## Implementation Steps

### Phase 1: [Phase Name]
1. **[Step Name]** (File: path/to/file.ts)
   - Action: Specific action to take
   - Why: Reason for this step
   - Dependencies: None / Requires step X
   - Risk: Low/Medium/High

2. **[Step Name]** (File: path/to/file.ts)
   ...

### Phase 2: [Phase Name]
...

## Testing Strategy
- Unit tests: [files to test]
- Integration tests: [flows to test]
- E2E tests: [user journeys to test]

## Risks & Mitigations
- **Risk**: [Description]
  - Mitigation: [How to address]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

## Best Practices

1. **Be Specific**: Use exact file paths, function names, variable names
2. **Consider Edge Cases**: Think about error scenarios
3. **Minimize Changes**: Prefer extending over rewriting
4. **Maintain Patterns**: Follow existing conventions
5. **Enable Testing**: Structure changes to be testable
6. **Think Incrementally**: Each step should be verifiable
7. **Document Decisions**: Explain why, not just what

## Red Flags to Check

- Large functions (>50 lines)
- Deep nesting (>4 levels)
- Duplicated code
- Missing error handling
- Hardcoded values
- Missing tests
- Performance bottlenecks

**Remember**: A great plan is specific, actionable, and considers both the happy path and edge cases.
```

### Key Learnings

1. **Clear Role Definition:** Specific expertise area
2. **Multi-Step Process:** Breaks down the planning into clear phases
3. **Output Format:** Shows exactly what output looks like
4. **Best Practices Included:** Provides guidance within agent instructions
5. **Minimal Tools:** Only Read, Grep, Glob (doesn't need Write/Edit)
6. **Opus Model:** Uses maximum reasoning for complex planning
7. **Red Flags:** Includes what to watch out for

---

## Example 4: Comprehensive Skill - TDD Workflow

### Skill File

**File:** `skills/tdd-workflow/SKILL.md`

```markdown
---
name: tdd-workflow
description: Use this skill when writing new features, fixing bugs, or refactoring code. Enforces test-driven development with 80%+ coverage including unit, integration, and E2E tests.
---

# Test-Driven Development Workflow

This skill ensures all code development follows TDD principles with comprehensive test coverage.

## When to Activate

- Writing new features or functionality
- Fixing bugs or issues
- Refactoring existing code
- Adding API endpoints
- Creating new components

## Core Principles

### 1. Tests BEFORE Code
ALWAYS write tests first, then implement code to make tests pass.

### 2. Coverage Requirements
- Minimum 80% coverage (unit + integration + E2E)
- All edge cases covered
- Error scenarios tested
- Boundary conditions verified

### 3. Test Types

#### Unit Tests
- Individual functions and utilities
- Component logic
- Pure functions
- Helpers and utilities

#### Integration Tests
- API endpoints
- Database operations
- Service interactions
- External API calls

#### E2E Tests (Playwright)
- Critical user flows
- Complete workflows
- Browser automation
- UI interactions

## TDD Workflow Steps

### Step 1: Write User Journeys
```
As a [role], I want to [action], so that [benefit]

Example:
As a user, I want to search for markets semantically,
so that I can find relevant markets even without exact keywords.
```

### Step 2: Generate Test Cases
For each user journey, create comprehensive test cases:

```typescript
describe('Semantic Search', () => {
  it('returns relevant markets for query', async () => {
    // Test implementation
  })

  it('handles empty query gracefully', async () => {
    // Test edge case
  })

  it('falls back to substring search when Redis unavailable', async () => {
    // Test fallback behavior
  })

  it('sorts results by similarity score', async () => {
    // Test sorting logic
  })
})
```

### Step 3: Run Tests (They Should Fail)
```bash
npm test
# Tests should fail - we haven't implemented yet
```

### Step 4: Implement Code
Write minimal code to make tests pass:

```typescript
export async function searchMarkets(query: string) {
  // Implementation here
}
```

### Step 5: Run Tests Again
```bash
npm test
# Tests should now pass
```

### Step 6: Refactor
Improve code quality while keeping tests green:
- Remove duplication
- Improve naming
- Optimize performance
- Enhance readability

### Step 7: Verify Coverage
```bash
npm run test:coverage
# Verify 80%+ coverage achieved
```

## Testing Patterns

### Unit Test Pattern (Jest/Vitest)
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### API Integration Test Pattern
```typescript
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('GET /api/markets', () => {
  it('returns markets successfully', async () => {
    const request = new NextRequest('http://localhost/api/markets')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('validates query parameters', async () => {
    const request = new NextRequest('http://localhost/api/markets?limit=invalid')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })
})
```

### E2E Test Pattern (Playwright)
```typescript
import { test, expect } from '@playwright/test'

test('user can search and filter markets', async ({ page }) => {
  await page.goto('/')
  await page.click('a[href="/markets"]')

  await expect(page.locator('h1')).toContainText('Markets')

  await page.fill('input[placeholder="Search markets"]', 'election')
  await page.waitForTimeout(600)

  const results = page.locator('[data-testid="market-card"]')
  await expect(results).toHaveCount(5, { timeout: 5000 })
})
```

## Test File Organization

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx          # Unit tests
│   └── MarketCard/
│       ├── MarketCard.tsx
│       └── MarketCard.test.tsx
├── app/
│   └── api/
│       └── markets/
│           ├── route.ts
│           └── route.test.ts         # Integration tests
└── e2e/
    ├── markets.spec.ts               # E2E tests
    ├── trading.spec.ts
    └── auth.spec.ts
```

## Mocking Patterns

### Supabase Mock
```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [{ id: 1, name: 'Test Market' }],
          error: null
        }))
      }))
    }))
  }
}))
```

### Redis Mock
```typescript
jest.mock('@/lib/redis', () => ({
  searchMarketsByVector: jest.fn(() => Promise.resolve([
    { slug: 'test-market', similarity_score: 0.95 }
  ])),
  checkRedisHealth: jest.fn(() => Promise.resolve({ connected: true }))
}))
```

## Best Practices

1. **Write Tests First** - Always TDD
2. **One Assert Per Test** - Focus on single behavior
3. **Descriptive Test Names** - Explain what's tested
4. **Arrange-Act-Assert** - Clear test structure
5. **Mock External Dependencies** - Isolate unit tests
6. **Test Edge Cases** - Null, undefined, empty, large
7. **Test Error Paths** - Not just happy paths
8. **Keep Tests Fast** - Unit tests < 50ms each
9. **Clean Up After Tests** - No side effects
10. **Review Coverage Reports** - Identify gaps

## Success Metrics

- 80%+ code coverage achieved
- All tests passing (green)
- No skipped or disabled tests
- Fast test execution (< 30s for unit tests)
- E2E tests cover critical user flows
- Tests catch bugs before production

---

**Remember**: Tests are not optional. They are the safety net that enables confident refactoring, rapid development, and production reliability.
```

### Key Learnings

1. **When to Activate:** Clear activation triggers
2. **Core Principles:** Three fundamental principles
3. **Progressive Steps:** 7 clear steps from tests to coverage
4. **Real Code Examples:** Actual, copy-paste-ready test code
5. **Multiple Patterns:** Unit, integration, and E2E patterns
6. **File Organization:** Shows where to place tests
7. **Mocking Patterns:** Common mocking scenarios
8. **Best Practices:** 10 actionable best practices
9. **Success Metrics:** How to know it worked
10. **Comprehensive:** Covers entire TDD workflow

---

## Example 5: Hook - Block Dev Servers Outside Tmux

### Hook Configuration

**File:** `hooks/hooks.json` (excerpt)

```json
{
  "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm run dev|pnpm( run)? dev|yarn dev|bun run dev)\"",
  "hooks": [
    {
      "type": "command",
      "command": "node -e \"console.error('[Hook] BLOCKED: Dev server must run in tmux for log access');console.error('[Hook] Use: tmux new-session -d -s dev \\\"npm run dev\\\"');console.error('[Hook] Then: tmux attach -t dev');process.exit(1)\""
    }
  ],
  "description": "Block dev servers outside tmux - ensures you can access logs"
}
```

### Key Learnings

1. **Specific Matcher:** Only matches dev server commands
2. **Clear Blocker:** Uses `process.exit(1)` to block execution
3. **Helpful Message:** Shows exactly what to do instead
4. **Pattern Matching:** Uses regex to match multiple package managers
5. **PreToolUse Hook:** Can block because it runs before tool execution

---

## Example 6: Hook - Auto-Format Code on Edit

### Hook Configuration

**File:** `hooks/hooks.json` (excerpt)

```json
{
  "matcher": "tool == \"Edit\" || tool == \"Write\"",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/smart-formatter.js\""
    }
  ],
  "description": "Auto-format files based on project type (Python: ruff, Java: google-java-format, Kotlin: ktfmt, JS/TS: prettier)"
}
```

### Script Implementation

**File:** `scripts/hooks/smart-formatter.js` (conceptual)

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  const input = JSON.parse(data);
  const filePath = input.tool_input?.file_path;

  if (!filePath || !fs.existsSync(filePath)) {
    console.log(data);
    return;
  }

  const ext = path.extname(filePath);
  try {
    // Format based on file type
    if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
      execSync(`npx prettier --write "${filePath}"`, { stdio: 'pipe' });
      console.error(`[Hook] Formatted: ${filePath}`);
    } else if (ext === '.py') {
      execSync(`ruff format "${filePath}"`, { stdio: 'pipe' });
      console.error(`[Hook] Formatted: ${filePath}`);
    } else if (ext === '.java') {
      execSync(`google-java-format --replace "${filePath}"`, { stdio: 'pipe' });
      console.error(`[Hook] Formatted: ${filePath}`);
    }
  } catch (error) {
    console.error(`[Hook] Format failed: ${error.message}`);
  }

  console.log(data); // Return original input
});
```

### Key Learnings

1. **PostToolUse Hook:** Doesn't block, just formats after edit
2. **Multi-Language Support:** Detects language and uses appropriate formatter
3. **Stdin/Stdout Pattern:** Reads from stdin, processes, outputs original
4. **Script Reference:** Uses `${CLAUDE_PLUGIN_ROOT}` for cross-platform paths
5. **Error Handling:** Gracefully handles formatter failures
6. **Non-Blocking:** Always returns original data

---

## Example 7: Security Reviewer Agent

### Agent File (excerpt)

**File:** `agents/security-reviewer.md`

```markdown
---
name: security-reviewer
description: Security expert analyzing code for vulnerabilities and best practices
tools: Read, Grep, Bash
model: opus
---

You are a security expert focused on identifying vulnerabilities,
enforcing security best practices, and ensuring secure coding standards.

## Your Role

- Identify security vulnerabilities
- Check for common attack vectors
- Verify secure coding practices
- Ensure compliance with standards
- Recommend security improvements

## Security Analysis Checklist

### Authentication & Authorization
- [ ] All protected endpoints verify authentication
- [ ] Authorization checks prevent privilege escalation
- [ ] Session management is secure (HTTPS only, secure flags)
- [ ] Password storage uses strong hashing

### Input Validation & Sanitization
- [ ] All user inputs are validated
- [ ] Input lengths are checked
- [ ] Special characters are properly escaped
- [ ] SQL injection is prevented (parameterized queries)
- [ ] XSS is prevented (output encoding)

### Secrets Management
- [ ] No hardcoded secrets in code
- [ ] API keys use environment variables
- [ ] Database credentials are secure
- [ ] Sensitive data is not logged
- [ ] Secrets are not in version control

## Security Review Format

# Security Review: [Component/Feature]

## Summary
[Overview of security posture]

## Critical Vulnerabilities
- [ ] Issue: [Vulnerability description]
  - Impact: [Severity and impact]
  - Fix: [How to remediate]

## High Risk Issues
- [ ] Issue: [Risk description]
  - Recommendation: [Improvement]

## Overall Assessment
- Secure: [Yes/No]
- Ready for production: [Yes/No]
```

### Key Learnings

1. **Opus Model:** Maximum reasoning for security analysis
2. **Comprehensive Checklist:** Covers multiple security domains
3. **Clear Output Format:** Structured vulnerability reporting
4. **Actionable Fixes:** Not just identifying issues, but fixing them
5. **Minimal Tools:** Read and Grep for analysis (no Write/Edit needed)

---

## Example 8: HTTP Webhook Hook

### Hook Configuration

**File:** `hooks/hooks.json` (excerpt)

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "http",
            "url": "https://hooks.slack.com/services/$SLACK_WEBHOOK_PATH",
            "headers": {
              "Content-Type": "application/json"
            },
            "allowedEnvVars": ["SLACK_WEBHOOK_PATH"]
          }
        ],
        "description": "Notify Slack when Claude session ends"
      }
    ]
  }
}
```

### Key Learnings

1. **HTTP Hook Type:** POSTs hook input JSON to the URL endpoint
2. **Env Var Interpolation:** `$SLACK_WEBHOOK_PATH` is resolved from environment
3. **allowedEnvVars:** Required whitelist for any env var interpolation in headers/URL
4. **Non-Blocking:** HTTP errors are treated as non-blocking (won't crash Claude)
5. **Use Cases:** Slack notifications, audit logging, CI/CD triggers, external dashboards

---

## Example 9: Background Agent with Isolation

### Agent File

**File:** `agents/safe-refactor.md`

```markdown
---
name: safe-refactor
description: Safely refactor code in an isolated worktree. Use proactively for risky refactoring.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
background: true
isolation: worktree
---

You refactor code in an isolated git worktree. Your changes don't affect the main branch.

## Workflow

1. Analyze the codebase for refactoring opportunities
2. Make changes in the isolated worktree
3. Run tests to verify no regressions
4. Report results — the worktree branch can be merged if changes are approved
```

### Key Learnings

1. **`background: true`:** Agent runs without blocking the main conversation
2. **`isolation: worktree`:** Agent gets its own git worktree copy — changes are isolated
3. **Safe experimentation:** If the refactoring fails, the main branch is unaffected
4. **Worktree auto-cleanup:** If no changes are made, the worktree is cleaned up automatically

---

## Integration Patterns

### Pattern 1: Command → Agent → User Confirmation → Implementation

```
User: /plan
  ↓
plan.md command invokes planner agent
  ↓
Planner creates detailed plan
  ↓
User reviews and confirms
  ↓
User: /tdd to implement with tests
  ↓
tdd-guide agent helps implement
  ↓
Code is written
  ↓
User: /code-review for quality check
  ↓
code-reviewer agent reviews
  ↓
Done!
```

### Pattern 2: Hook → Automatic Side Effect

```
User edits file (tool = Edit)
  ↓
PostToolUse hook triggers
  ↓
smart-formatter.js runs
  ↓
File is auto-formatted
  ↓
User sees formatted file
  ↓
No user action needed
```

### Pattern 3: Skill-Guided Development

```
Developer activates TDD skill
  ↓
Skill provides step-by-step guidance
  ↓
Developer writes tests (Step 1)
  ↓
Developer implements code (Step 4)
  ↓
Developer verifies coverage (Step 7)
  ↓
Result: TDD-driven development
```

---

## Learning Resources

To understand how to create similar components:

1. **Study These Examples:** Read through each example file
2. **Review Agent Patterns:** How agents delegate and structure output
3. **Understand Hook Triggers:** When and why hooks run
4. **Copy-Paste Structure:** Use these as templates for your own
5. **Test Your Code:** Always verify on multiple platforms
6. **Document Thoroughly:** Clear docs matter more than clever code

---

**Last Updated:** 2026-02-28
**Version:** 3.2.0
**Claude Code Version:** 2.1.63
**Reference:** [Official Anthropic Docs](https://code.claude.com/docs/en/plugins) | [Platform llms.txt](https://platform.claude.com/llms.txt)
