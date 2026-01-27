# Commands and Skills - Complete Reference

## Commands (Slash Commands)

Commands are user-triggered actions that execute when a user types `/command-name`. They can be Markdown files with frontmatter or Node.js scripts.

### Command File Types

#### 1. Markdown-Based Commands

Markdown files with YAML frontmatter that describe a command Claude should execute.

**File:** `commands/command-name.md`

**Frontmatter Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | Yes | One-line description shown in command list |
| `command` | string | No | Node.js command to execute directly |
| `disable-model-invocation` | boolean | No | If true, command runs without Claude (pure Node.js) |

**Example: Command Description**
```markdown
---
description: Configure your preferred package manager (npm/pnpm/yarn/bun)
---

# Package Manager Setup

Configure your preferred package manager for this project or globally.
```

**Example: Command with Script Execution**
```markdown
---
description: Configure your preferred package manager (npm/pnpm/yarn/bun)
disable-model-invocation: true
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-package-manager.cjs"
---

# Package Manager Setup

Setup helper for configuring package managers.
```

#### 2. Node.js-Based Commands

Executable JavaScript/Node.js files that handle command logic directly.

**File:** `commands/script-name.cjs`

```javascript
#!/usr/bin/env node

const { program } = require('commander');

program
  .version('1.0.0')
  .description('Command description');

program
  .command('subcommand')
  .description('Subcommand description')
  .action((options) => {
    console.log('Executing subcommand');
  });

program.parse(process.argv);
```

### Command Structure

```
commands/
├── command-name.md              # Markdown-based command
├── another-command.md           # Another command
└── script-command.cjs           # Node.js-based command
```

### Markdown Command Best Practices

**1. Clear Description Frontmatter**
```markdown
---
description: Clear, concise one-liner about what this does
---
```

**2. Helpful Usage Section**
```markdown
## Usage

```bash
/command-name --option value
/command-name --help
```
```

**3. Examples**
```markdown
## Example

```
User: /setup-pm --global pnpm

Claude:
I'll configure pnpm as your global package manager...
[Executes command and shows results]
```
```

**4. Related Commands**
```markdown
## Related Commands

- `/tdd` - Test-driven development workflow
- `/code-review` - Code quality review
```

### Command Execution Flow

For markdown-based commands:

1. User types `/command-name --options`
2. Claude reads the markdown file
3. Claude executes the frontmatter command (if present)
4. Claude reads the markdown body
5. Claude follows the instructions

Example flow:
```
/setup-pm --global pnpm
  ↓
Claude reads setup-pm.md
  ↓
Claude executes: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-package-manager.cjs" --global pnpm
  ↓
Claude reads markdown body with explanation
  ↓
Claude provides context and next steps
```

## Skills

Skills are reusable domain knowledge and workflows that provide detailed, progressive disclosure of information. Users or other components can activate a skill to get comprehensive guidance.

### Skill Structure

#### Directory-Based Skills

For complex skills with configuration:

```
skills/skill-name/
├── SKILL.md                     # Main skill content
├── config.json                  # Optional: Skill configuration
└── templates/                   # Optional: Templates and examples
    ├── example1.md
    └── example2.md
```

#### Single-File Skills

For simpler skills:

```
skills/skill-name.md            # Entire skill in one file
```

### Skill File Format

**File:** `skills/skill-name/SKILL.md` or `skills/skill-name.md`

**Frontmatter Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Skill name (machine readable) |
| `description` | string | Yes | What the skill teaches or enables |

**Minimal Example:**
```markdown
---
name: tdd-workflow
description: Use this skill when writing new features. Enforces test-driven development with comprehensive test coverage.
---

# Test-Driven Development Workflow

Instructions and guidance for TDD...
```

### Skill Content Structure

**1. When to Activate**
```markdown
## When to Activate

- Writing new features or functionality
- Fixing bugs or issues
- Refactoring existing code
- Adding API endpoints
```

**2. Core Principles**
```markdown
## Core Principles

### 1. Tests BEFORE Code
ALWAYS write tests first, then implement code.

### 2. Coverage Requirements
- Minimum 80% coverage
- All edge cases covered
```

**3. Step-by-Step Workflow**
```markdown
## Workflow Steps

### Step 1: Write User Journeys
```

### Step 2: Generate Test Cases
```

### Step 3: Run Tests
```
```

**4. Patterns and Examples**
```markdown
## Testing Patterns

### Unit Test Pattern
```typescript
describe('Component', () => {
  it('test case', () => {
    // Test code
  })
})
```
```

**5. Best Practices**
```markdown
## Best Practices

1. Write tests first
2. Keep tests focused
3. Use descriptive names
4. Mock external dependencies
```

### Skill Examples from Repository

#### Example 1: TDD Workflow Skill
```markdown
---
name: tdd-workflow
description: Enforces test-driven development with 80%+ coverage.
---

# Test-Driven Development Workflow

## When to Activate
- Writing new features
- Fixing bugs
- Refactoring code

## Core Principles

### 1. Tests BEFORE Code
Write tests first (RED phase), implement to make pass (GREEN), refactor (IMPROVE).

## TDD Workflow Steps

### Step 1: Write User Journeys
As a [role], I want to [action], so that [benefit]

### Step 2: Generate Test Cases
Create comprehensive test cases for each user journey

### Step 3: Run Tests (Must Fail)
```bash
npm test
# Tests should fail - not implemented yet
```

## Success Metrics
- 80%+ code coverage
- All tests passing
- Fast test execution
```

#### Example 2: Coding Standards Skill
```markdown
---
name: coding-standards
description: Language best practices for TypeScript, JavaScript, React, and Node.js.
---

# Coding Standards

## TypeScript Best Practices

### 1. Strict Mode
Always enable `strict: true` in tsconfig.json

### 2. Type Annotations
Explicitly type function parameters and returns

### 3. Immutability
Never mutate objects, use spread operator

## JavaScript Best Practices

### Function Size
Keep functions under 50 lines

### File Organization
Organize by feature, not by type
```

### Skill Activation

**Direct Activation:**
```
User: /learn   (extracts and saves patterns)
User: Can you activate the security-review skill?
```

**Indirect Activation:**
```
Tool description mentions the skill
Command frontmatter references the skill
Agent instructions reference the skill
```

### Skill Configuration (Optional)

**File:** `skills/skill-name/config.json`

```json
{
  "version": "1.0.0",
  "tags": ["testing", "quality"],
  "relatedSkills": ["security-review", "coding-standards"],
  "estimatedReadTime": "10 minutes",
  "difficulty": "intermediate"
}
```

### Progressive Disclosure Pattern

Skills should follow progressive disclosure: start simple, then provide detail.

```markdown
## When to Activate
[Simple one-line summary of when to use]

## Quick Start
[Minimal 5-line example to get started]

## Core Concepts
[Deeper explanation of key ideas]

## Detailed Patterns
[Code examples and patterns]

## Advanced Usage
[Edge cases and optimization]

## Troubleshooting
[Common problems and solutions]
```

## Commands vs Skills

| Aspect | Commands | Skills |
|--------|----------|--------|
| Trigger | User typing `/command` | User request or tool reference |
| Purpose | Execute action or workflow | Provide knowledge/guidance |
| Execution | Runs code (Node.js) | Provides instruction text |
| Output | Action results | Educational content |
| Example | `/setup-pm` | `/learn tdd-workflow` |

**Commands:** "Do something"
**Skills:** "Here's how to do something"

## Real-World Examples

### Example 1: Simple Command with Description

**File:** `commands/build-fix.md`
```markdown
---
description: Fix build errors with intelligent debugging
---

# Build Error Fixer

This command invokes the **build-error-resolver** agent to diagnose and fix build errors.

## What It Does

1. Analyzes build error output
2. Identifies the root cause
3. Suggests fixes
4. Implements and verifies

## Usage

```
/build-fix
```

When build fails, just run this command and provide the error message.
```

### Example 2: Advanced Command with Script

**File:** `commands/setup-ecosystem.md`
```markdown
---
description: Check and configure your development environment
disable-model-invocation: true
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-ecosystem.cjs"
---

# Ecosystem Setup

Comprehensive check and configuration of development tools.

## Features

- Detects installed tools
- Checks versions
- Recommends upgrades
- Configures settings

## Usage

```
/setup-ecosystem
```
```

### Example 3: Complex Skill

**File:** `skills/backend-patterns/SKILL.md`
```markdown
---
name: backend-patterns
description: API design, database optimization, caching patterns for Node.js and Express.
---

# Backend Patterns

## When to Activate

- Building API endpoints
- Optimizing database queries
- Implementing caching
- Designing microservices

## Core Principles

### 1. API Response Format
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: { total: number; page: number }
}
```

### 2. Repository Pattern
Isolate data access logic

### 3. Error Handling
Use try-catch with meaningful error messages

## Patterns

### Repository Pattern
[Implementation details...]

### Caching Strategy
[Cache types and when to use...]

### Database Optimization
[Indexing, query optimization...]

## Best Practices

1. Return consistent API response format
2. Validate all inputs with Zod
3. Use repositories for data access
4. Implement proper error handling
5. Add caching for expensive operations
```

## Creating Your Own Commands and Skills

### Step 1: Plan Your Command

Ask yourself:
- Is this a one-time action (command) or reusable knowledge (skill)?
- What should the user experience be?
- What's the simplest version?

### Step 2: Create the File

For commands:
```bash
# Create simple markdown command
touch commands/my-command.md
```

For skills:
```bash
# Create skill directory
mkdir skills/my-skill
touch skills/my-skill/SKILL.md
```

### Step 3: Write Clear Documentation

- Use descriptive headings
- Provide concrete examples
- Include usage instructions
- Link to related features

### Step 4: Test

- Verify markdown formatting
- Test execution (if applicable)
- Check examples work
- Validate all links

### Step 5: Add to Plugin

Update `plugin.json` if needed:
```json
{
  "commands": "./commands",
  "skills": "./skills"
}
```

Auto-discovery happens for files in `commands/` and `skills/` directories.

## Best Practices

### For Commands

1. **Clear Description:** One-line description that explains what it does
2. **Helpful Examples:** Show actual usage
3. **Error Handling:** Explain what to do if it fails
4. **Related Links:** Link to related commands or skills
5. **Quick Start:** Get users productive in < 30 seconds

### For Skills

1. **Progressive Disclosure:** Start simple, go deep
2. **Practical Patterns:** Provide copy-paste examples
3. **Real-World Usage:** Show when and how to use
4. **Best Practices:** Include dos and don'ts
5. **Success Metrics:** How to know it worked

### Cross-Cutting

1. **Naming:** Use kebab-case, be descriptive
2. **Consistency:** Follow repository style
3. **Documentation:** Over-document rather than under
4. **Testing:** Verify on all platforms
5. **Performance:** Keep commands fast, skills concise

## Frontmatter Reference

### Command Frontmatter

```yaml
---
description: One-line description
disable-model-invocation: true     # Optional: Run without Claude
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/file.cjs"  # Optional: Script to run
---
```

### Skill Frontmatter

```yaml
---
name: skill-name                   # Required: Machine-readable name
description: What skill teaches    # Required: Human-readable description
---
```

## Integration with Plugin System

Commands and skills are automatically discovered from their directories:

```
.claude-plugin/plugin.json
↓
commands: "./commands"    → Auto-loads all *.md files in commands/
skills: "./skills"        → Auto-loads all */SKILL.md and *.md files in skills/
```

No manual registration needed!

---

**Last Updated:** 2025-01-27
**Version:** 2.0.0
