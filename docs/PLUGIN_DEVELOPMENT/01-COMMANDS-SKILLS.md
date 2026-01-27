# Commands and Skills - Complete Reference

## Commands (Slash Commands)

Commands are user-triggered actions that execute when a user types `/command-name`. They can be Markdown files with frontmatter or Node.js scripts.

## Command Types and Formats

### Type 1: Markdown-Based Commands (Claude-Driven)

**File Location:** `commands/command-name.md`

**Frontmatter Fields - COMPLETE REFERENCE:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `description` | string | Yes | - | One-line description shown in command list (max 80 chars) |
| `command` | string | No | - | Node.js command to execute (optional, can be run before or without Claude) |
| `disable-model-invocation` | boolean | No | false | If true, command runs as pure Node.js without Claude interpretation |

**Complete Minimal Example:**
```markdown
---
description: Configure your preferred package manager (npm/pnpm/yarn/bun)
---

# Package Manager Setup

Configure your preferred package manager for this project or globally.

## Usage

```bash
/setup-pm --detect
/setup-pm --global pnpm
/setup-pm --project bun
```

## Step 1: Detect Current Setup
[Instructions for Claude...]

## Step 2: Configure
[More instructions...]
```

**Complete Example with Script Execution:**
```markdown
---
description: Configure your preferred package manager (npm/pnpm/yarn/bun)
disable-model-invocation: false
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-package-manager.cjs" $ARGUMENTS
---

# Package Manager Setup

[Content that Claude reads after script runs]
```

### Type 2: Node.js-Based Commands (Script-Driven)

**File Location:** `commands/script-name.cjs`

**Format:** Executable Node.js file (CommonJS for compatibility)

```javascript
#!/usr/bin/env node

const { program } = require('commander');

program
  .version('1.0.0')
  .description('Command description');

program
  .command('setup')
  .description('Setup something')
  .option('-g, --global', 'Global configuration')
  .action((options) => {
    console.log('Setting up...');
    if (options.global) {
      console.log('Global mode enabled');
    }
  });

program.parse(process.argv);
```

**Benefits:**
- Fast execution
- No Claude interpretation needed
- Direct system interaction
- Suitable for setup/detection logic

### Type 3: Hybrid Commands (Script + Markdown)

Combines script execution with markdown guidance:

```markdown
---
description: Complete project setup with detection and configuration
disable-model-invocation: false
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-complete.cjs" --detect
---

# Complete Project Setup

The script above has detected your project structure.

Based on the results, here are the recommended next steps...

[Claude provides guidance and context based on script output]
```

**Execution Flow:**
1. Script executes (result output to stdout/stderr)
2. Claude reads markdown body
3. Claude interprets markdown with script output as context
4. Claude provides guidance and next steps

## Command Variable Substitution

**All Variables Are Available in All Commands**

### Environment Variables

| Variable | Value | When Available | Example Usage |
|----------|-------|------------------|---|
| `${CLAUDE_PLUGIN_ROOT}` | Absolute path to plugin root directory | Always | `node "${CLAUDE_PLUGIN_ROOT}/scripts/setup.js"` |
| `${CLAUDE_SESSION_ID}` | Unique identifier for current session | In commands | Save logs: `~/logs/${CLAUDE_SESSION_ID}.log` |
| `CLAUDE_PACKAGE_MANAGER` | Detected package manager | When available | Detected by session-start hook |
| `HOME` (or `USERPROFILE` on Windows) | User home directory | Always | Config file location |
| `PWD` | Current working directory | In scripts | File operations |

### Command Arguments

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `$0` | string | Full command invocation | `/setup-pm --global pnpm` |
| `$1`, `$2`, `$3`... | string | Individual arguments | First arg: `--global` |
| `$ARGUMENTS` | string | All arguments combined | Pass all to script |

**Usage Examples:**

```markdown
---
description: Run tests with custom options
disable-model-invocation: true
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/test.cjs" $ARGUMENTS
---
```

User invokes: `/my-test --coverage --watch`
Script receives: `["--coverage", "--watch"]`

```markdown
---
description: Show current AWS profile
command: echo "Profile: $1" || echo "No profile specified"
---
```

**Complete Example with Multiple Arguments:**

```markdown
---
description: Deploy to specified environment
disable-model-invocation: false
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/deploy.cjs" --env $1 --region $2
---

# Deployment Guide

The deployment script has been configured for your specified environment.

Usage:
```bash
/deploy production us-west-2
```

The script receives:
- Environment: $1 = "production"
- Region: $2 = "us-west-2"

[Provide guidance based on deployment context]
```

## Command Execution Flow Details

### Markdown-Based Command Execution

```
User Input: /setup-pm --global pnpm
    ↓
Claude Code locates: commands/setup-pm.md
    ↓
Claude reads frontmatter:
  - description: [shown in list]
  - command: [execute if present]
  - disable-model-invocation: [false = Claude reads body]
    ↓
[IF command field exists]
Execute: node "${CLAUDE_PLUGIN_ROOT}/scripts/..." --global pnpm
Capture output/result
    ↓
[ALWAYS if disable-model-invocation != true]
Claude reads markdown body
    ↓
Claude interprets instructions and provides response
(If command executed, output becomes context)
```

### Script-Based Command Execution

```
User Input: /my-script --option value
    ↓
Claude Code locates: commands/my-script.cjs
    ↓
Execute as Node.js script
Pass arguments: ["--option", "value"]
    ↓
Script outputs to stdout
    ↓
Claude displays output to user
No markdown interpretation
```

## Command Structure and Organization

### Directory Layout

```
commands/
├── setup-pm.md              # Markdown command
├── setup.md                 # Another markdown command
├── setup-ecosystem.md       # Another markdown command
├── ci-cd.cjs               # Node.js script command
├── e2e.md                  # Markdown command
└── orchestrate.md          # Markdown command
```

### Naming Conventions

**Valid:**
- `setup-pm.md` ✓
- `code-review.md` ✓
- `my-command.cjs` ✓
- `run-tests.md` ✓

**Invalid:**
- `setupPm.md` ✗ (use hyphens, not camelCase)
- `setup_pm.md` ✗ (use hyphens, not underscores)
- `myCommand.cjs` ✗ (use hyphens, not camelCase)

## Markdown Command Best Practices

### 1. Clear Description

```markdown
---
description: Clear one-liner (max 80 chars) describing what command does
---
```

DO:
- `description: Configure your preferred package manager (npm/pnpm/yarn/bun)`
- `description: Generate end-to-end tests with Playwright`
- `description: Review code for security and quality issues`

DON'T:
- `description: This command helps you set stuff up` ✗
- `description: Command` ✗

### 2. Usage Section

```markdown
## Usage

Display examples of how to invoke the command:

```bash
/command-name
/command-name --option value
/command-name --help
```
```

### 3. Examples Section

```markdown
## Examples

### Example 1: Basic Usage
```bash
$ /setup-pm

=== Package Manager Setup ===
Detected: npm (from package-lock.json)
Ready to change? [Y/n] n
✓ npm confirmed
```

### Example 2: With Options
```bash
$ /setup-pm --global pnpm

✓ Global preference set to pnpm
```
```

### 4. Related Commands

```markdown
## Related Commands

- `/tdd` - Test-driven development workflow
- `/code-review` - Code quality review
- `/setup` - Complete project setup
```

### 5. Script Execution Notes

If your command executes a script:

```markdown
## Behind the Scenes

This command executes:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-package-manager.cjs" $ARGUMENTS
```

The script:
1. Detects current package manager
2. Checks configuration files
3. Prompts for preferences
4. Updates configuration
```

## Skills (Reusable Workflows)

Skills are reusable domain knowledge and workflows that provide detailed, progressive disclosure of information.

### Skill Formats

#### Format 1: Directory-Based Skill

**Directory Structure:**
```
skills/skill-name/
├── SKILL.md              # Main skill content (required)
├── config.json          # Optional configuration
└── templates/           # Optional templates
    ├── template1.md
    └── template2.md
```

**File:** `skills/tdd-workflow/SKILL.md`

#### Format 2: Single-File Skill

```
skills/quick-skill.md
```

### Skill Frontmatter - COMPLETE REFERENCE

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | - | Skill identifier (lowercase, hyphens only) |
| `description` | string | Yes | - | What skill teaches/enables (one-liner) |
| `context` | string | No | - | Set to "fork" to run in forked context |

**Minimal Example:**
```markdown
---
name: tdd-workflow
description: Use this skill when writing new features. Enforces test-driven development with comprehensive test coverage.
---

# Test-Driven Development Workflow

[Skill content...]
```

**With Context Fork:**
```markdown
---
name: security-review
description: Use for authentication, user input, API endpoints, and sensitive data. Comprehensive security checklist and patterns.
context: fork
---

# Security Review Skill

[Long-form security guidance...]
```

### Skill Content Structure

**Recommended Sections:**

```markdown
---
name: skill-name
description: What this skill does
---

# Skill Title

## When to Activate

- Scenario 1
- Scenario 2
- Scenario 3

## Core Principles

### Principle 1
Explanation...

### Principle 2
Explanation...

## Workflow Steps

### Step 1: First Task
Detailed instructions...

### Step 2: Second Task
Detailed instructions...

## Examples

### Example 1: Basic Usage
```
Code example
```

### Example 2: Advanced Usage
```
Code example
```

## Related Resources

- Link 1
- Link 2
```

### Skill Activation and Context Fork

#### What is `context: fork`?

When `context: fork` is specified:

```
Skill Content
    ↓
Injected into SEPARATE context (forked)
    ↓
Claude gets skill in SYSTEM PROMPT
    ↓
Skill guidance available throughout skill use
    ↓
Main conversation context PRESERVED
    ↓
Can be exited back to main conversation
```

**Benefits:**
- Long-form guidance (500+ lines) without bloating main context
- Progressive disclosure of detailed information
- Separate from main conversation state
- Can maintain skill context while working

**When to Use `context: fork`:**
1. **Long-Form Guides** (>500 lines)
   - TDD methodology
   - Security frameworks
   - Architecture patterns

2. **Progressive Disclosure**
   - Complex workflows
   - Multi-step procedures
   - Reference documentation

3. **Domain-Specific Knowledge**
   - Language-specific patterns
   - Framework best practices
   - Industry standards

4. **Detailed Checklists**
   - Security review checklist
   - Code quality criteria
   - Testing requirements

**When NOT to Use `context: fork`:**
- Short tips (< 100 lines)
- Quick references (< 200 lines)
- Inline guidance
- Real-time interactive workflows

### Examples of Skills

#### Example 1: TDD Workflow (with context: fork)

```markdown
---
name: tdd-workflow
description: Use this skill when writing new features, fixing bugs, or refactoring code. Enforces test-driven development with 80%+ coverage.
context: fork
---

# Test-Driven Development Workflow

[500+ lines of detailed TDD guidance...]

## Step 1: Write User Journeys
[Detailed explanation...]

## Step 2: Generate Test Cases
[Detailed explanation...]

## Step 3-6: Red-Green-Refactor Cycle
[Complete workflow...]
```

#### Example 2: Security Review Checklist

```markdown
---
name: security-review
description: Use for authentication, user input, API endpoints, and sensitive data handling.
context: fork
---

# Security Review Skill

## Vulnerability Categories

### Authentication & Authorization
- [ ] Hardcoded credentials
- [ ] Weak password validation
- [ ] Missing CSRF protection
- [ ] Session management issues

### Input Validation
- [ ] SQL injection risks
- [ ] Command injection risks
- [ ] Path traversal vulnerabilities
- [ ] XXE vulnerabilities

### Data Protection
- [ ] Unencrypted sensitive data
- [ ] Weak encryption algorithms
- [ ] API key exposure
- [ ] Database credential exposure

### Infrastructure
- [ ] Insecure dependencies
- [ ] Missing security headers
- [ ] Exposed debug endpoints
- [ ] Unpatched vulnerabilities
```

#### Example 3: Quick Reference (no context fork)

```markdown
---
name: git-workflow
description: Git commit and branching conventions for this project
---

# Git Workflow

## Commit Message Format

```
<type>: <description>
```

## Types

- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code reorganization
- `docs:` Documentation changes
- `test:` Test changes

## Examples

```
feat: Add semantic search API endpoint
fix: Handle null values in search query
```
```

## Complete Skill Example: Multi-File Skill

**Directory Structure:**
```
skills/backend-patterns/
├── SKILL.md              # Main content
├── config.json          # Optional config
└── templates/
    ├── api-endpoint.ts
    └── database-query.ts
```

**SKILL.md:**
```markdown
---
name: backend-patterns
description: Backend architecture patterns, API design, database optimization, and server-side best practices for Node.js.
context: fork
---

# Backend Development Patterns

## When to Use This Skill

- Designing API endpoints
- Optimizing database queries
- Structuring backend services
- Implementing caching strategies
- Error handling patterns

## API Design Pattern

### RESTful Endpoint Design

[Detailed explanation...]

### Error Response Format

```json
{
  "success": false,
  "error": "User-friendly message",
  "code": "ERROR_CODE"
}
```

## Database Optimization

### Query Patterns

[Examples with explanations...]

## Caching Strategy

[Patterns for Redis, in-memory, etc...]

## Security Best Practices

[Security-specific backend guidance...]
```

## How Commands and Skills Differ

| Aspect | Commands | Skills |
|--------|----------|--------|
| **Invocation** | `/command-name` | Referenced or explicitly activated |
| **Execution** | Immediate, can run Node.js | Guidance only, no code execution |
| **Purpose** | Perform actions | Provide knowledge/methodology |
| **Interactivity** | Can execute scripts | Interactive conversation |
| **Duration** | Quick, focused | Extended, detailed |
| **Context** | Main conversation | Can use separate context (fork) |
| **Use Case** | Setup, automation | Learning, planning, guidance |

## Integration Patterns

### Command Activates Skill

```markdown
---
description: Start test-driven development workflow
---

# TDD Workflow Command

This command activates the TDD workflow skill. Use this skill to guide
your development process through the red-green-refactor cycle.

## Next Steps

1. Activate the **tdd-workflow** skill
2. Write your first test
3. Run tests and verify they fail
4. Implement code to pass tests
5. Refactor and improve

[The TDD workflow skill provides detailed guidance for each step]
```

### Agent Uses Skill

Agents can reference skills in their instructions:

```markdown
---
name: tdd-guide
description: TDD specialist using the tdd-workflow skill
tools: Read, Write, Edit, Bash
model: opus
---

You MUST use the **tdd-workflow** skill to guide developers through
test-driven development with 80%+ coverage.

[Rest of agent instructions...]
```

## Complete Command-Skill Integration Example

### Command: /tdd

```markdown
---
description: Test-driven development workflow with comprehensive testing
disable-model-invocation: false
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/tdd-setup.cjs"
---

# TDD Workflow

The TDD setup script has prepared your environment.

This command activates the **tdd-workflow** skill for detailed guidance.

## Your Next Steps

1. Follow the **tdd-workflow** skill for methodology
2. Write tests first (RED phase)
3. Implement code (GREEN phase)
4. Refactor (IMPROVE phase)
5. Verify 80%+ coverage

The skill provides step-by-step instructions for each phase.
```

### Skill: tdd-workflow/SKILL.md

```markdown
---
name: tdd-workflow
description: Test-driven development with 80%+ coverage including unit, integration, and E2E tests
context: fork
---

# Test-Driven Development Workflow

## When to Activate

- Writing new features
- Fixing bugs
- Refactoring code

## RED Phase

[500+ lines of detailed RED phase guidance...]

## GREEN Phase

[Detailed GREEN phase guidance...]

## IMPROVE Phase

[Detailed IMPROVE phase guidance...]

## Coverage Requirements

[Coverage details...]
```

## File Organization Best Practices

### Commands Directory

```
commands/
├── core/                    # Core functionality
│   ├── setup.md
│   ├── setup-pm.md
│   └── setup-ecosystem.md
├── testing/                 # Testing commands
│   ├── tdd.md
│   ├── e2e.md
│   └── test-coverage.md
├── review/                  # Review commands
│   ├── code-review.md
│   └── checkpoint.md
└── automation/              # Automation scripts
    ├── ci-cd.cjs
    └── update-codemaps.md
```

### Skills Directory

```
skills/
├── core/
│   ├── tdd-workflow/
│   │   ├── SKILL.md
│   │   └── templates/
│   └── security-review/
│       └── SKILL.md
├── language-specific/
│   ├── python-patterns/
│   │   └── SKILL.md
│   ├── kotlin-patterns/
│   │   └── SKILL.md
│   └── typescript-patterns/
│       └── SKILL.md
└── domain-specific/
    ├── backend-patterns/
    │   └── SKILL.md
    └── frontend-patterns/
        └── SKILL.md
```

## Security Considerations

### In Commands

**DO:**
- Store secrets in environment variables
- Load from `.env.local` or similar
- Use secure APIs for sensitive operations

**DON'T:**
- Hardcode API keys, passwords, or tokens
- Use plain text for credentials
- Log sensitive information

```markdown
---
description: Deploy application securely
---

# Secure Deployment

# ✓ GOOD: Uses environment variables
const apiKey = process.env.DEPLOY_API_KEY
const token = process.env.GITHUB_TOKEN

# ✗ BAD: Hardcoded credentials
const apiKey = "sk-abc123def456"  // NEVER
const token = "ghp_xyz789"         // NEVER
```

### In Skills

**DO:**
- Document security best practices
- Provide secure code examples
- Explain security principles

**DON'T:**
- Include example credentials
- Suggest insecure patterns

## Complete Reference Checklist

### Creating a Markdown Command

- [ ] File in `commands/` directory
- [ ] Filename: `lowercase-with-hyphens.md`
- [ ] Frontmatter with `description` field
- [ ] Clear usage section with examples
- [ ] Step-by-step instructions for Claude
- [ ] Related commands section (if applicable)
- [ ] No hardcoded secrets

### Creating a Script Command

- [ ] File in `commands/` directory
- [ ] Filename: `lowercase-with-hyphens.cjs`
- [ ] Executable Node.js code (CommonJS)
- [ ] Proper argument handling
- [ ] Error handling with helpful messages
- [ ] Cross-platform compatibility (Windows/Mac/Linux)
- [ ] Use `path.resolve()` for file paths

### Creating a Skill

- [ ] File in `skills/` directory
- [ ] Directory-based: `skill-name/SKILL.md`
- [ ] Frontmatter with `name` and `description`
- [ ] `context: fork` if >500 lines
- [ ] "When to Activate" section
- [ ] Step-by-step instructions
- [ ] Code examples
- [ ] Related resources section

---

**Last Updated:** 2025-01-27
**Version:** 2.0.0
**Status:** Complete Specification
