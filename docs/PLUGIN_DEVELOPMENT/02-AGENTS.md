# Agents - Complete Reference

## What Are Agents?

Agents are specialized AI subagents with custom models, tools, and instructions. They can be invoked directly or delegated to for complex tasks.

## Agent File Format

**File Location:** `agents/agent-name.md`

**Format:** Markdown file with YAML frontmatter + instructions in body

### Agent Frontmatter - COMPLETE REFERENCE

| Field | Type | Required | Default | Valid Values | Description |
|-------|------|----------|---------|--------------|-------------|
| `name` | string | Yes | - | lowercase-hyphens | Agent identifier (machine-readable) |
| `description` | string | Yes | - | Any string | One-line description (shown in agent list, max 120 chars) |
| `tools` | string | Yes | - | Comma-separated tool names | Tools available to agent (subset of built-in tools) |
| `model` | string | Yes | - | `opus`, `sonnet`, `haiku` | Claude model to use for this agent |
| `skills` | string | No | - | Comma-separated skill names | Skills preloaded into agent context |
| `hooks` | string | No | - | Hook type list | Hook events this agent should trigger |

### Minimal Agent Example

```markdown
---
name: code-reviewer
description: Expert code review specialist ensuring code quality and security
tools: Read, Grep, Glob, Bash
model: opus
---

You are a senior code reviewer ensuring high standards of code quality and security.

Your responsibilities:
1. Review code for quality, security, and maintainability
2. Provide actionable feedback with specific fixes
3. Check for common vulnerabilities and issues
4. Ensure tests are adequate

Review Checklist:
- Code is simple and readable
- Functions are well-named (<50 lines each)
- No hardcoded secrets or API keys
- Proper error handling
- Good test coverage
```

### Complete Agent Example

```markdown
---
name: tdd-guide
description: Test-Driven Development specialist enforcing write-tests-first methodology
tools: Read, Write, Edit, Bash, Grep
model: opus
skills: tdd-workflow
---

You are a Test-Driven Development (TDD) specialist who ensures all code is developed test-first.

## Your Role

- Enforce tests-before-code methodology
- Guide developers through TDD Red-Green-Refactor cycle
- Ensure 80%+ test coverage
- Write comprehensive test suites (unit, integration, E2E)

## TDD Workflow

[Detailed instructions...]
```

### Agent with Multiple Skills

```markdown
---
name: security-architect
description: Security expert designing secure systems with comprehensive threat modeling
tools: Read, Grep, Glob, Bash
model: opus
skills: security-review, backend-patterns, coding-standards
---

You are a security architect ensuring all systems are designed securely from the start.

[Detailed instructions...]
```

## Agent Fields Explained in Detail

### `name`

**Type:** string
**Required:** Yes
**Rules:**
- Lowercase with hyphens only
- No spaces, underscores, camelCase
- 3-50 characters
- Unique within plugin

**Examples:**
- `code-reviewer` ✓
- `tdd-guide` ✓
- `security-reviewer` ✓
- `CodeReviewer` ✗ (not lowercase-hyphenated)
- `code_reviewer` ✗ (underscores not allowed)

### `description`

**Type:** string
**Required:** Yes
**Rules:**
- One-line description
- Should fit in UI tooltip (120 characters max)
- Describes what agent does or specializes in
- Action-oriented language

**Examples:**
- `Expert code review specialist. Proactively reviews code for quality, security, and maintainability.` ✓
- `Test-Driven Development specialist enforcing write-tests-first methodology.` ✓
- `Agent` ✗ (too vague)

### `tools`

**Type:** string
**Required:** Yes
**Rules:**
- Comma-separated list of tool names
- Tools must exist in Claude Code
- Subset of available tools (not all)

**Available Tools:**

| Tool | Purpose | When to Use |
|------|---------|-----------|
| `Read` | Read file contents | All agents that analyze code/files |
| `Write` | Create new files | Code generation, template creation |
| `Edit` | Modify file contents | Code fixes, refactoring |
| `Bash` | Run shell commands | Build, test, deploy tasks |
| `Grep` | Search file contents | Code analysis, pattern matching |
| `Glob` | Find files by pattern | File discovery, organization |
| `TaskCreate` | Create task items | Project management, delegation |
| `TaskUpdate` | Update task status | Workflow management |
| `Skill` | Invoke skills | Multi-agent workflows |

**Best Practices:**
- Only include tools agent will actually use
- More tools = broader capability, more context used
- Fewer tools = focused, efficient agent

**Examples:**

```markdown
---
tools: Read, Grep, Glob, Bash
---
```

### `model`

**Type:** string
**Required:** Yes
**Valid Values:** `opus`, `sonnet`, `haiku`

**Model Comparison:**

| Model | Speed | Cost | Best For | Reasoning Depth |
|-------|-------|------|----------|-----------------|
| **opus** | Slow | Highest | Complex analysis, architecture, security | Maximum |
| **sonnet** | Medium | Medium | Feature implementation, code review | High |
| **haiku** | Fast | ~1/3 Sonnet | Simple tasks, worker agents | Good |

**Selection Strategy:**

- **Use Opus for:**
  - Complex architectural decisions
  - Security vulnerability analysis
  - Long-form planning
  - Novel problem solving

- **Use Sonnet for:**
  - Main feature implementation
  - Code generation and testing
  - Refactoring and code review

- **Use Haiku for:**
  - Quick fixes and validation
  - Worker agents (many invocations)
  - Simple formatting and checks

### `skills` (Optional)

**Type:** string
**Required:** No
**Rules:**
- Comma-separated skill names
- Skills must exist in plugin
- Multiple skills allowed
- Skills are preloaded into agent context

**What it does:**

When `skills` is specified, the skill content is:
1. Loaded into agent's system prompt
2. Available throughout agent's use
3. Integrated into agent instructions

**Examples:**

```markdown
---
skills: tdd-workflow
---
```

Multiple skills:
```markdown
---
skills: tdd-workflow, security-review, coding-standards
---
```

### `hooks` (Optional)

**Type:** string
**Required:** No
**Rules:**
- Comma-separated hook types
- Valid: `PreToolUse`, `PostToolUse`, `SessionStart`, `SessionEnd`, `PreCompact`, `Stop`

**Example:**

```markdown
---
hooks: PreToolUse, PostToolUse
---
```

## Complete Agent Structure

### Anatomy of an Agent File

```markdown
---
name: agent-identifier
description: One-line description
tools: Tool1, Tool2, Tool3
model: opus
skills: skill-name-1, skill-name-2
---

# Agent Title

## Role and Responsibilities

Description of what this agent does.

## When to Use

List scenarios for agent activation.

## Key Principles

Core principles agent follows.

## Workflow

Step-by-step instructions.

## Checklist

Success criteria:
- Criterion 1
- Criterion 2

## Example

Example interaction.
```

## Agent Invocation Patterns

### Direct Mention

```
User: Use the code-reviewer agent to review this change.
```

### Delegation in Commands

```markdown
---
description: Review code for quality and security
---

# Code Review

I'm delegating to the **code-reviewer** agent for analysis.
```

### Agent Collaboration

```markdown
---
name: architect
---

You may delegate code review to the **code-reviewer** agent.
```

## Model Selection Guide

| Scenario | Recommended Model | Reasoning |
|----------|-------------------|-----------|
| Planning complex features | opus | Deep reasoning for architecture |
| Implementing features | sonnet | Good balance of capability and speed |
| Quick validation | haiku | Fast, sufficient capability |
| Security analysis | opus | Maximum reasoning for vulnerabilities |
| Code formatting | haiku | Simple transformation, fast execution |
| Bug fixing | sonnet | Good for problem-solving |

## Permission Modes (Future/Advanced)

While not currently fully implemented, granular permission control is planned:

```markdown
---
name: restricted-agent
tools: Read, Write
# Future: permissions for read, write, execute
---
```

## Best Practices

### 1. Clear Role Definition

```markdown
---
name: good-agent
---

You are an expert in feature implementation.

Your role:
- Plan feature architecture
- Write implementation code
- Ensure tests pass
```

### 2. Focused Toolset

```markdown
---
tools: Read, Write, Edit, Bash
---
```

### 3. Appropriate Model Selection

Complex task = Opus
Standard task = Sonnet
Simple task = Haiku

### 4. Leverage Skills When Available

```markdown
---
skills: tdd-workflow
---

You MUST follow the **tdd-workflow** skill for TDD tasks.
```

## Agent Examples in This Repository

| Agent | Model | Purpose | Tools |
|-------|-------|---------|-------|
| `code-reviewer` | opus | Code quality and security | Read, Grep, Glob, Bash |
| `tdd-guide` | opus | Test-driven development | Read, Write, Edit, Bash, Grep |
| `security-reviewer` | opus | Security analysis | Read, Bash, Grep |
| `planner` | opus | Feature planning | Read, Write, Grep |
| `architect` | opus | System architecture | Read, Grep |
| `build-error-resolver` | sonnet | Fix build errors | Read, Bash, Grep, Edit |
| `e2e-runner` | sonnet | E2E test generation | Read, Write, Edit, Bash |
| `refactor-cleaner` | haiku | Dead code removal | Read, Bash, Grep |
| `doc-updater` | haiku | Documentation updates | Read, Write, Edit |

## Complete Reference Checklist

### Creating an Agent

- [ ] File in `agents/` directory
- [ ] Filename: `lowercase-with-hyphens.md`
- [ ] Frontmatter: `name`, `description`, `tools`, `model`
- [ ] Clear role statement
- [ ] When to use scenarios
- [ ] Core principles explained
- [ ] Process/workflow documented
- [ ] Success criteria listed
- [ ] Example interaction shown
- [ ] Tools match responsibilities

---

**Last Updated:** 2025-01-27
**Version:** 2.0.0
**Status:** Complete Specification

**Strategy:**
- **Opus:** Planning, architecture, security review (1-2 agents)
- **Sonnet:** Main development work (2-4 agents)
- **Haiku:** Worker agents, quick fixes (1-2 agents)

### Tool Selection

Available tools for agents:

| Category | Tools |
|----------|-------|
| **File Operations** | Read, Write, Edit, Glob |
| **Search** | Grep |
| **System** | Bash |
| **Specialized** | Skill, TaskCreate, TaskUpdate, NotebookEdit |

**Tool Selection Tips:**
- Only include tools agent actually needs
- Fewer tools = faster reasoning
- Can reference other agents in instructions

## Agent Examples from Repository

### Example 1: Planner Agent (Opus)

```markdown
---
name: planner
description: Expert planning specialist for complex features and refactoring
tools: Read, Grep, Glob
model: opus
---

You are an expert planning specialist focused on creating comprehensive,
actionable implementation plans.

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

## Plan Format

# Implementation Plan: [Feature Name]

## Overview
[2-3 sentence summary]

## Requirements
- [Requirement 1]
- [Requirement 2]

## Architecture Changes
- [Change 1: file path and description]

## Implementation Steps

### Phase 1: [Phase Name]
1. **[Step Name]** (File: path/to/file.ts)
   - Action: Specific action to take
   - Why: Reason for this step
   - Dependencies: None / Requires step X
   - Risk: Low/Medium/High

**Remember**: A great plan is specific, actionable, and considers both the happy path and edge cases.
```

### Example 2: Code Reviewer Agent (Opus)

```markdown
---
name: code-reviewer
description: Expert code review focused on quality, security, and best practices
tools: Read, Grep, Glob, Bash
model: opus
---

You are an expert code reviewer focused on comprehensive code quality,
security, and adherence to best practices.

## Your Role

- Review code for functionality, performance, and security
- Identify bugs, edge cases, and error handling issues
- Check adherence to coding standards and patterns
- Ensure test coverage is adequate
- Provide actionable improvement suggestions

## Review Process

### 1. Understand the Context
- Read related files and understand the architecture
- Check existing tests and test patterns
- Review similar implementations
- Understand the feature requirements

### 2. Code Quality Analysis
- Check for code smells (large functions, deep nesting, duplication)
- Verify error handling completeness
- Check input validation
- Review for performance issues
- Verify immutability and side effects

### 3. Security Analysis
- Check for hardcoded secrets
- Verify input validation
- Check for SQL injection vulnerabilities
- Verify authentication/authorization
- Review external API calls

### 4. Testing Analysis
- Verify test coverage (80%+ required)
- Check test quality and isolation
- Review edge case coverage
- Verify error scenario testing

## Review Format

# Code Review: [File/Feature]

## Summary
[1-2 sentence summary of findings]

## Critical Issues
- [ ] Issue: [Description]
  - Impact: [Why it matters]
  - Fix: [How to fix it]

## High Priority Issues
- [ ] Issue: [Description]
  - Suggestion: [How to improve]

## Medium Priority Issues
- [ ] Issue: [Description]
  - Suggestion: [Improvement]

## Low Priority Issues
- [ ] Issue: [Description]
  - Note: [Optional improvement]

## Summary
- Overall quality: [Excellent/Good/Fair/Poor]
- Ready to merge: [Yes/No - explain]
- Estimated fixes: [Time estimate]
```

### Example 3: TDD Guide Agent (Sonnet)

```markdown
---
name: tdd-guide
description: Test-driven development expert ensuring tests are written first
tools: Read, Write, Edit, Bash
model: sonnet
---

You are a Test-Driven Development expert who enforces the TDD workflow: RED → GREEN → REFACTOR.

## Your Role

- Enforce test-first development
- Generate comprehensive test suites
- Guide implementation to pass tests
- Ensure 80%+ coverage
- Review test quality

## TDD Workflow

### Phase 1: RED (Write Tests First)
- Generate test file with failing tests
- Each test covers one behavior
- Use Arrange-Act-Assert pattern
- Test edge cases and error paths

### Phase 2: GREEN (Write Code to Pass Tests)
- Write minimal code to pass tests
- No over-engineering
- Ignore optimization at this stage

### Phase 3: REFACTOR (Improve Code)
- Remove duplication
- Improve naming
- Optimize performance
- Keep tests green throughout

## Test Templates

### Unit Test Template
```typescript
describe('FunctionName', () => {
  describe('when [condition]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      const input = ...

      // Act
      const result = FunctionName(input)

      // Assert
      expect(result).toBe(...)
    })
  })
})
```

### Integration Test Template
```typescript
describe('GET /api/endpoint', () => {
  it('should return success response', async () => {
    const response = await request(app).get('/api/endpoint')
    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })
})
```

## Coverage Requirements
- Minimum 80% coverage
- All edge cases
- Error scenarios
- Boundary conditions

## Best Practices
1. One assertion per test
2. Descriptive test names
3. Independent tests (no dependencies)
4. Mock external dependencies
5. Fast test execution
6. Clean up after tests
```

### Example 4: Security Reviewer Agent (Opus)

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

### Data Protection
- [ ] Sensitive data is encrypted at rest
- [ ] Sensitive data uses HTTPS in transit
- [ ] PII is properly protected
- [ ] Access logs exist for sensitive operations
- [ ] Data retention policies are enforced

### Error Handling
- [ ] Error messages don't leak sensitive info
- [ ] Stack traces not exposed to users
- [ ] Graceful fallbacks for failures
- [ ] Security warnings logged appropriately

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

## Medium Risk Issues
- [ ] Issue: [Consideration]
  - Note: [Explanation]

## Recommendations
- [Security improvement 1]
- [Security improvement 2]

## Overall Assessment
- Secure: [Yes/No]
- Ready for production: [Yes/No]
```

### Example 5: Refactor Cleaner Agent (Haiku)

```markdown
---
name: refactor-cleaner
description: Quick refactoring for dead code removal and code cleanup
tools: Read, Grep, Bash, Edit
model: haiku
---

You are a refactoring specialist focused on identifying and removing
dead code, improving code clarity, and maintaining code health.

## Your Role

- Identify unused functions, variables, imports
- Remove dead code safely
- Simplify overcomplicated code
- Improve code clarity
- Maintain test coverage during refactoring

## Dead Code Patterns to Find

### Unused Imports
```typescript
import { unusedFunction } from './module'  // Never used
```

### Unused Variables
```typescript
const unused = getValue()  // Assigned but never used
```

### Unused Functions
```typescript
export function neverCalled() { }  // No callers
```

### Unreachable Code
```typescript
throw new Error('error')
console.log('unreachable')  // After throw
```

### Duplicate Code
```typescript
// Same code in multiple places
```

## Refactoring Process

1. **Identify Dead Code**
   - Use grep to find potential dead code
   - Check imports and exports
   - Verify no callers exist

2. **Remove Safely**
   - Keep tests green
   - Remove dead code
   - Verify no breakage

3. **Simplify**
   - Remove unnecessary complexity
   - Improve readability
   - Keep functionality same

4. **Verify**
   - Run tests
   - Check coverage unchanged
   - Confirm refactoring worked
```

## Creating Your Own Agent

### Step 1: Define Purpose

Ask:
- What expertise does this agent need?
- What specific tasks will it handle?
- What model best fits?
- What tools does it actually need?

### Step 2: Choose Model

- **Opus:** Complex reasoning, planning, security
- **Sonnet:** General development, code review
- **Haiku:** Quick tasks, worker agents

### Step 3: Select Tools

Include only tools agent actually uses:

```markdown
---
name: my-agent
description: Expert in [domain]
tools: Read, Grep, Bash
model: sonnet
---
```

### Step 4: Write Instructions

```markdown
You are an expert in [domain].

## Your Role

- Task 1
- Task 2

## Process

### Step 1: [Analysis]
...

### Step 2: [Implementation]
...

## Best Practices

1. Practice 1
2. Practice 2

## Format

[Output format if applicable]
```

### Step 5: Test

- Verify agent works as expected
- Check tool access
- Validate output quality
- Test error cases

## Agent Invocation

### Direct Invocation

User can directly invoke agent:
```
@agent-name Please analyze this code
```

### Delegation

Commands or other agents can delegate:

**Via Tool:**
```bash
agent-name-task
```

**Via Message:**
```
Claude uses this agent to handle the task...
```

### Proactive Activation

Some agents are invoked proactively:

```markdown
---
name: agent-name
description: Activated when [condition]
---
```

## Agent Lifecycle

1. **Creation:** Define frontmatter, write instructions
2. **Activation:** User invokes or system delegates
3. **Execution:** Agent operates with limited context
4. **Completion:** Agent provides results and returns control

## Best Practices

### 1. Clear Focus
Each agent should have a specific expertise domain:
- Good: "Test-driven development expert"
- Bad: "Expert in everything"

### 2. Appropriate Model
Match model to task complexity:
- Simple tasks → Haiku
- Complex reasoning → Opus
- Balance → Sonnet

### 3. Minimal Tools
Only grant tools actually needed:
```markdown
---
name: planner
tools: Read, Grep, Glob    # Minimal, focused
model: opus
---
```

### 4. Clear Instructions
Provide step-by-step process:
```markdown
## Process

### Step 1: Understand
- What needs to be done?

### Step 2: Analyze
- What's the current state?

### Step 3: Plan
- What's the solution?
```

### 5. Output Format
Specify expected output:
```markdown
## Output Format

# [Title]

## Summary
[One-liner]

## Details
[Full details]

## Recommendations
[Action items]
```

## Real-World Agent Patterns

### Pattern 1: Specialized Reviewer
- Model: Opus (for deep analysis)
- Tools: Read, Grep (information gathering)
- Purpose: Security, quality, standards review

### Pattern 2: Feature Implementer
- Model: Sonnet (good balance)
- Tools: Read, Write, Edit, Bash (coding)
- Purpose: Write code, tests, handle implementation

### Pattern 3: Quick Worker
- Model: Haiku (fast, cheap)
- Tools: Bash (simple operations)
- Purpose: Run commands, cleanup tasks

### Pattern 4: Architect
- Model: Opus (maximum reasoning)
- Tools: Read, Grep, Glob (codebase understanding)
- Purpose: Design systems, make architectural decisions

## Agent Directory Structure

```
agents/
├── planner.md               # Planning (Opus)
├── code-reviewer.md         # Code review (Opus)
├── architect.md             # Architecture (Opus)
├── tdd-guide.md             # TDD (Sonnet)
├── build-error-resolver.md  # Build fixes (Sonnet)
├── security-reviewer.md     # Security (Opus)
├── e2e-runner.md            # E2E tests (Sonnet)
├── refactor-cleaner.md      # Cleanup (Haiku)
├── doc-updater.md           # Docs (Haiku)
└── [custom-agents].md       # Your agents
```

## Integration with Plugin System

Agents are auto-discovered from `agents/` directory. No manual registration needed.

To use an agent:

1. **Direct:** User mentions `@agent-name`
2. **Delegation:** System delegates complex tasks
3. **Commands:** Commands invoke specific agents

## Troubleshooting Agents

### Agent Not Responding

Check:
- Is frontmatter valid YAML?
- Are all required fields present?
- Is the agent being invoked correctly?

### Agent Slow

- Check model selection (Haiku faster than Opus)
- Reduce tool count
- Simplify instructions

### Agent Wrong Results

- Review and clarify instructions
- Check tool access
- Verify example outputs

---

**Last Updated:** 2025-01-27
**Version:** 2.0.0
