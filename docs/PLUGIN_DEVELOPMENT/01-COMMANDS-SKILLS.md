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

> **Note:** Custom slash commands have been merged into skills. A file at `.claude/commands/review.md` and a skill at `.claude/skills/review/SKILL.md` both create `/review` and work the same way. Your existing `.claude/commands/` files keep working. Skills add optional features: a directory for supporting files, frontmatter to control invocation, and the ability for Claude to load them automatically when relevant.

### Skill Formats

#### Format 1: Directory-Based Skill

**Directory Structure:**
```
skills/skill-name/
├── SKILL.md              # Main skill content (required)
├── reference.md          # Detailed reference docs (loaded when needed)
├── examples.md           # Usage examples (loaded when needed)
├── config.json          # Optional configuration
└── templates/           # Optional templates
    ├── template1.md
    └── template2.md
```

**File:** `skills/tdd-workflow/SKILL.md`

Keep `SKILL.md` under 500 lines. Move detailed reference material to separate files. Reference supporting files from `SKILL.md` so Claude knows what each file contains and when to load it:

```markdown
## Additional resources

- For complete API details, see [reference.md](reference.md)
- For usage examples, see [examples.md](examples.md)
```

#### Format 2: Single-File Skill

```
skills/quick-skill.md
```

### Where Skills Live (Precedence)

Where you store a skill determines who can use it and its precedence:

| Location   | Path                                             | Applies to                     | Priority |
| :--------- | :----------------------------------------------- | :----------------------------- | :------- |
| Enterprise | See managed settings documentation               | All users in your organization | Highest  |
| Personal   | `~/.claude/skills/<skill-name>/SKILL.md`         | All your projects              | High     |
| Project    | `.claude/skills/<skill-name>/SKILL.md`           | This project only              | Medium   |
| Plugin     | `<plugin>/skills/<skill-name>/SKILL.md`          | Where plugin is enabled        | Namespaced |

When skills share the same name across levels, higher-priority locations win: enterprise > personal > project. Plugin skills use a `plugin-name:skill-name` namespace, so they cannot conflict with other levels.

**Automatic Discovery from Nested Directories:**

When you work with files in subdirectories, Claude Code automatically discovers skills from nested `.claude/skills/` directories. For example, if you're editing a file in `packages/frontend/`, Claude Code also looks for skills in `packages/frontend/.claude/skills/`. This supports monorepo setups where packages have their own skills.

### Skill Frontmatter - COMPLETE REFERENCE

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | No | directory name | Display name for the skill. Lowercase letters, numbers, and hyphens only (max 64 characters). |
| `description` | string | Recommended | first paragraph | What the skill does and when to use it. Claude uses this to decide when to apply the skill automatically. |
| `argument-hint` | string | No | - | Hint shown during autocomplete to indicate expected arguments. Example: `[issue-number]` or `[filename] [format]` |
| `disable-model-invocation` | boolean | No | false | If true, only you can invoke the skill. Claude cannot load it automatically. Use for side-effect workflows. |
| `user-invocable` | boolean | No | true | If false, hide from the `/` menu. Only Claude can invoke it. Use for background knowledge. |
| `allowed-tools` | string | No | - | Tools Claude can use without asking permission when this skill is active. Comma-separated list. |
| `model` | string | No | - | Model to use when this skill is active (e.g., `opus`, `sonnet`, `haiku`). |
| `context` | string | No | - | Set to `fork` to run in a forked subagent context (isolated from main conversation). |
| `agent` | string | No | general-purpose | Which subagent type to use when `context: fork` is set. Options: `Explore`, `Plan`, `general-purpose`, or custom agent name. |
| `hooks` | array | No | - | Hooks scoped to this skill's lifecycle. See Hooks documentation for configuration format. |

### Invocation Control: Who Can Trigger Skills

By default, both you and Claude can invoke any skill. You can type `/skill-name` to invoke it directly, and Claude can load it automatically when relevant to your conversation. Two frontmatter fields let you restrict this:

| Frontmatter                      | You can invoke | Claude can invoke | When loaded into context |
| :------------------------------- | :------------- | :---------------- | :----------------------- |
| (default)                        | Yes            | Yes               | Description always in context, full skill loads when invoked |
| `disable-model-invocation: true` | Yes            | No                | Description not in context, full skill loads when you invoke |
| `user-invocable: false`          | No             | Yes               | Description always in context, full skill loads when invoked |

#### When to Use `disable-model-invocation: true`

Use for workflows with **side effects** or that you want to **control timing**:
- `/commit` - You don't want Claude deciding to commit
- `/deploy` - Deployment should be user-initiated
- `/send-slack-message` - External communication needs user control
- `/publish` - Publishing actions need explicit approval

**Example:**
```markdown
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
---

Deploy $ARGUMENTS to production:

1. Run the test suite
2. Build the application
3. Push to the deployment target
4. Verify the deployment succeeded
```

#### When to Use `user-invocable: false`

Use for **background knowledge** that isn't actionable as a command:
- Context about legacy systems
- Domain-specific knowledge
- Coding conventions and patterns
- Reference documentation

Claude should know this when relevant, but `/legacy-system-context` isn't a meaningful action for users to take.

**Example:**
```markdown
---
name: legacy-api-context
description: Context about the legacy v1 API endpoints and their quirks
user-invocable: false
---

# Legacy API Context

The v1 API has several quirks Claude should know:

- All dates are in Unix timestamp format
- Error codes 5xx actually mean client errors
- The /users endpoint requires pagination even for single results
[...]
```

### Minimal Example (Default Invocation):
```markdown
---
name: tdd-workflow
description: Use this skill when writing new features. Enforces test-driven development with comprehensive test coverage.
---

# Test-Driven Development Workflow

[Skill content...]
```

### Complete Example with All Options:
```markdown
---
name: security-review
description: Use for authentication, user input, API endpoints, and sensitive data. Comprehensive security checklist and patterns.
argument-hint: [file-or-directory]
disable-model-invocation: false
user-invocable: true
allowed-tools: Read, Grep, Glob
model: opus
context: fork
agent: Explore
---

# Security Review Skill

[Long-form security guidance...]
```

### Skill String Substitutions

Skills support string substitution for dynamic values in the skill content:

| Variable | Description | Example |
|----------|-------------|---------|
| `$ARGUMENTS` | All arguments passed when invoking the skill | `/skill-name arg1 arg2` → `arg1 arg2` |
| `$ARGUMENTS[N]` | Access a specific argument by 0-based index | `$ARGUMENTS[0]` for first argument |
| `$N` | Shorthand for `$ARGUMENTS[N]` | `$0` for first, `$1` for second |
| `${CLAUDE_SESSION_ID}` | Current session ID | Useful for session-specific logs or files |

**Note:** If `$ARGUMENTS` is not present in the content, arguments are appended as `ARGUMENTS: <value>`.

**Example using indexed arguments:**
```markdown
---
name: migrate-component
description: Migrate a component from one framework to another
argument-hint: [component] [from-framework] [to-framework]
---

Migrate the $0 component from $1 to $2.
Preserve all existing behavior and tests.
```

Running `/migrate-component SearchBar React Vue` replaces:
- `$0` → `SearchBar`
- `$1` → `React`
- `$2` → `Vue`

**Example using session ID:**
```markdown
---
name: session-logger
description: Log activity for this session
---

Log the following to logs/${CLAUDE_SESSION_ID}.log:

$ARGUMENTS
```

### Dynamic Context Injection

The `!`command`` syntax runs shell commands **before** the skill content is sent to Claude. The command output replaces the placeholder, so Claude receives actual data, not the command itself.

**Example: PR Summary Skill**
```markdown
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

## Your task
Summarize this pull request...
```

**How it works:**
1. Each `!`command`` executes immediately (before Claude sees anything)
2. The output replaces the placeholder in the skill content
3. Claude receives the fully-rendered prompt with actual data

This is **preprocessing**, not something Claude executes. Claude only sees the final result.

**Tip:** To enable extended thinking (ultrathink) in a skill, include the word "ultrathink" anywhere in your skill content.

### Restricting Tool Access

Use the `allowed-tools` field to limit which tools Claude can use when a skill is active. This is useful for creating safe, read-only modes:

```markdown
---
name: safe-reader
description: Read files without making changes
allowed-tools: Read, Grep, Glob
---

Explore the codebase in read-only mode. You can:
- Read files
- Search for patterns
- Find files by name

You cannot modify any files.
```

**Common allowed-tools patterns:**
- Read-only exploration: `Read, Grep, Glob`
- GitHub operations: `Bash(gh *)`
- Testing only: `Bash(npm test), Bash(pnpm test), Bash(yarn test)`

### Running Skills in Subagents

Add `context: fork` to your frontmatter when you want a skill to run in isolation. The skill content becomes the prompt that drives the subagent. It won't have access to your conversation history.

**Warning:** `context: fork` only makes sense for skills with explicit instructions. If your skill contains guidelines like "use these API conventions" without a task, the subagent receives the guidelines but no actionable prompt, and returns without meaningful output.

**Example: Research skill using Explore agent**
```markdown
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:

1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

**How subagent execution works:**
1. A new isolated context is created
2. The subagent receives the skill content as its prompt
3. The `agent` field determines the execution environment (model, tools, permissions)
4. Results are summarized and returned to your main conversation

**Available agent types:**
- `Explore` - Read-only tools optimized for codebase exploration
- `Plan` - Planning and analysis tools
- `general-purpose` - Default full-capability agent
- Custom agents from `.claude/agents/` directory

### Restricting Claude's Skill Access

By default, Claude can invoke any skill that doesn't have `disable-model-invocation: true` set. Three ways to control which skills Claude can invoke:

**1. Disable all skills** by denying the Skill tool in `/permissions`:
```
# Add to deny rules:
Skill
```

**2. Allow or deny specific skills** using permission rules:
```
# Allow only specific skills
Skill(commit)
Skill(review-pr *)

# Deny specific skills
Skill(deploy *)
```

Permission syntax: `Skill(name)` for exact match, `Skill(name *)` for prefix match with any arguments.

**3. Hide individual skills** by adding `disable-model-invocation: true` to their frontmatter. This removes the skill from Claude's context entirely.

**Note:** The `user-invocable` field only controls menu visibility, not Skill tool access. Use `disable-model-invocation: true` to block programmatic invocation.

### Context Loading Behavior

In a regular session, skill descriptions are loaded into context so Claude knows what's available, but full skill content only loads when invoked.

**Character budget:** If you have many skills, descriptions may exceed the character budget (default 15,000 characters). Run `/context` to check for a warning about excluded skills.

To increase the limit, set the `SLASH_COMMAND_TOOL_CHAR_BUDGET` environment variable.

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

## Types of Skill Content

Skill files can contain any instructions, but thinking about how you want to invoke them helps guide what to include:

### Reference Content

Adds knowledge Claude applies to your current work. Conventions, patterns, style guides, domain knowledge. This content runs inline so Claude can use it alongside your conversation context.

```markdown
---
name: api-conventions
description: API design patterns for this codebase
---

When writing API endpoints:
- Use RESTful naming conventions
- Return consistent error formats
- Include request validation
```

### Task Content

Gives Claude step-by-step instructions for a specific action, like deployments, commits, or code generation. These are often actions you want to invoke directly with `/skill-name` rather than letting Claude decide when to run them.

```markdown
---
name: deploy
description: Deploy the application to production
context: fork
disable-model-invocation: true
---

Deploy the application:
1. Run the test suite
2. Build the application
3. Push to the deployment target
```

## How Commands and Skills Differ

> **Note:** Commands and skills have been merged in Claude Code. They both create slash commands and work similarly. The key difference is that skills support additional features like supporting files, invocation control, and automatic loading.

| Aspect | Commands (`.claude/commands/`) | Skills (`.claude/skills/`) |
|--------|--------------------------------|----------------------------|
| **File Structure** | Single `.md` or `.cjs` file | Directory with `SKILL.md` + supporting files |
| **Invocation** | `/command-name` | `/skill-name` or auto-loaded by Claude |
| **Script Execution** | Can run Node.js with `command` field | Can use `!`command`` preprocessing |
| **Model Control** | User controls invocation | Can use `disable-model-invocation` and `user-invocable` |
| **Tool Restriction** | N/A | `allowed-tools` field |
| **Model Override** | N/A | `model` field |
| **Subagent Execution** | N/A | `context: fork` with `agent` field |
| **Auto-Discovery** | Manual invocation only | Claude can load automatically based on description |
| **Supporting Files** | No | Yes (templates, references, examples) |
| **Precedence** | Skills take precedence if same name | Higher priority than commands |

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
    └── ci-cd.cjs
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

**Last Updated:** 2026-01-28
**Version:** 2.1.0
**Status:** Complete Specification (Updated with Official Claude Code Skills Documentation)
