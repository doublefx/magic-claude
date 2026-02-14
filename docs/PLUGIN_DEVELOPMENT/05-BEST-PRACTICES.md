# Best Practices - Proven Patterns and Guidelines

## General Plugin Development

### 1. Start Simple, Scale Gradually

Don't try to build the perfect plugin on day one.

**Phase 1: Foundation**
- One command or agent
- Clear documentation
- Working on all platforms

**Phase 2: Expansion**
- Add related commands
- Create skills for detailed guidance
- Add hooks for automation

**Phase 3: Maturity**
- Comprehensive coverage
- Advanced features
- Community feedback

### 2. Prioritize User Experience

Every design decision should improve the user experience.

**Questions to Ask:**
- Can the user understand what this does?
- Will they know when to use it?
- Does it work the first time?
- Is error handling clear?

**Good Examples:**
- Clear command descriptions
- Helpful error messages
- Progress feedback for long operations
- Links to related commands

### 3. Document Everything

Documentation is more important than the code.

**What to Document:**
- What each component does
- When to use it
- How to use it
- Examples
- Troubleshooting

**Documentation Locations:**
- Plugin README (overview)
- Command descriptions (one-liners)
- Skill content (detailed guides)
- Inline comments (why, not what)

### 4. Test on All Platforms

Never assume Unix-only. Windows is a first-class platform.

**Test Checklist:**
- [ ] Windows (PowerShell and cmd.exe)
- [ ] macOS (Intel and Apple Silicon)
- [ ] Linux (Ubuntu, Debian, others)
- [ ] File paths (use forward slashes or `path.join`)
- [ ] Commands (use Node.js, not bash)
- [ ] Newlines (use LF, not CRLF)

### 5. Security First

Security decisions impact all users.

**Critical Rules:**
- NO hardcoded secrets or API keys
- NO storing credentials in files
- NO direct file system access without validation
- NO executing arbitrary code
- Validate all user inputs

## Commands Best Practices

### 1. Clear, Descriptive Names

```markdown
// Good - Clear what it does
---
description: Configure package manager (npm/pnpm/yarn/bun)
---

// Bad - Vague
---
description: Setup script
---
```

### 2. Helpful Examples

```markdown
## Usage

```bash
/command-name --option value
/command-name --help
/command-name --verbose
```

## Example

```
User: /my-command --option value

Claude: Here's what I'm doing...
[Output shows results]
```
```

### 3. Error Handling

```markdown
## If Something Goes Wrong

Q: I see error "X"
A: This means Y. Try Z.

Q: Command hangs
A: It might be waiting for input. Press Ctrl+C.
```

### 4. Integration with Other Features

```markdown
## Related Commands

- `/command-a` - Does A
- `/command-b` - Does B

## After Running

Try `/next-command` for the next step.
```

### 5. Optional Arguments

```markdown
## Arguments

- `--option` - Optional description
- `--verbose` - Show detailed output

## Examples

```bash
/command --option value --verbose
/command                          # Use defaults
```
```

## Agents Best Practices

### 1. Specialized Expertise

Each agent should be expert in one domain.

```markdown
// Good - Specific expertise
---
name: tdd-guide
description: Test-driven development expert
model: sonnet
---

// Bad - Too broad
---
name: general-expert
description: Expert in everything
---
```

### 2. Clear Role Definition

```markdown
You are an expert in [specific domain].

Your role:
- Specific task 1
- Specific task 2
- Specific task 3

You are NOT responsible for:
- Other domain 1
- Other domain 2
```

### 3. Appropriate Model Selection

```markdown
// High reasoning - Opus
---
name: architect
description: System design expert
model: opus
---

// Good balance - Sonnet
---
name: code-reviewer
description: Code review expert
model: sonnet
---

// Quick tasks - Haiku
---
name: formatter
description: Code formatting
model: haiku
---
```

### 4. Minimal Tool Access

```markdown
// Good - Only needed tools
---
name: planner
tools: Read, Grep, Glob
model: opus
---

// Bad - Too many tools
---
name: planner
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
---
```

### 5. Step-by-Step Instructions

```markdown
## Process

### Step 1: Understand
- What is being requested?
- What are the constraints?

### Step 2: Analyze
- Review existing code
- Identify patterns

### Step 3: Plan
- Create detailed plan
- Identify risks

### Step 4: Output
- Present findings
- Provide recommendations
```

### 6. Consistent Output Format

```markdown
## Output Format

# [Title]

## Summary
[Quick overview]

## Details
[Full analysis]

## Recommendations
[Actionable items]

## Questions for Clarification
[If needed]
```

## Output Styles Best Practices

Output styles allow you to adapt Claude Code for uses beyond software engineering while keeping core capabilities (file operations, scripts, TODOs).

### 1. Built-in Output Styles

| Style | Purpose | When to Use |
|-------|---------|-------------|
| **Default** | Standard software engineering | General development work |
| **Explanatory** | Educational with "Insights" | Learning implementation patterns |
| **Learning** | Collaborative with `TODO(human)` markers | Teaching/mentoring scenarios |

### 2. Creating Custom Output Styles

Store custom styles as Markdown files:
- User level: `~/.claude/output-styles/`
- Project level: `.claude/output-styles/`

```markdown
---
name: My Custom Style
description: Brief description shown in /output-style menu
keep-coding-instructions: false
---

# Custom Style Instructions

You are an interactive CLI tool that [describe behavior]...

## Specific Behaviors

[Define response patterns, formatting, tone...]
```

### 3. Frontmatter Options

| Field | Purpose | Default |
|-------|---------|---------|
| `name` | Display name | Inherits from filename |
| `description` | Description for `/output-style` UI | None |
| `keep-coding-instructions` | Keep coding-related system prompts | `false` |

### 4. When to Use Output Styles vs Other Features

**Output Styles vs CLAUDE.md:**
- Output styles modify/replace system prompt sections
- CLAUDE.md adds content as user message after system prompt
- Use output styles for fundamental behavior changes

**Output Styles vs Agents:**
- Output styles affect main agent loop globally
- Agents are invoked for specific tasks with own model/tools
- Use agents for delegated specialized work

**Output Styles vs Skills:**
- Output styles are always active once selected
- Skills are task-specific, invoked on demand
- Use output styles for consistent formatting; skills for workflows

### 5. Switching Output Styles

```bash
# Interactive menu
/output-style

# Direct switch
/output-style explanatory
/output-style learning
/output-style default

# Programmatic (in settings)
# .claude/settings.local.json: { "outputStyle": "explanatory" }
```

### 6. Best Practices for Custom Styles

**Do:**
- Keep instructions clear and focused
- Test with various prompts before deploying
- Use `keep-coding-instructions: true` for developer-focused styles
- Provide specific behavioral guidance

**Don't:**
- Create styles that conflict with core safety
- Make styles too verbose (impacts context window)
- Forget that styles exclude efficient output instructions

## Skills Best Practices

### 1. Progressive Disclosure

Start simple, provide depth on demand.

```markdown
## When to Activate

[Simple one-liner]

## Quick Start

[Minimal 5-minute example]

## Core Concepts

[Deeper understanding]

## Advanced Patterns

[Edge cases and optimization]

## Troubleshooting

[Common problems and solutions]
```

### 2. Real-World Examples

```markdown
## Pattern: Repository Pattern

### Why Use It
[Problem it solves]

### Implementation
```typescript
[Code example]
```

### When to Use
- Scenario 1
- Scenario 2

### Potential Issues
- Issue 1 and mitigation
```

### 3. Actionable Steps

```markdown
## Workflow

### Step 1: Write Tests
1. Create test file
2. Write failing test
3. Run to confirm failure

### Step 2: Implement Code
1. Write minimal implementation
2. Run tests to verify
3. Refactor if needed
```

### 4. Copy-Paste Ready Code

Always provide complete, working code examples.

```markdown
### Complete Example

```typescript
// This should be copy-paste ready
function example() {
  return result;
}
```
```

### 5. Links to Related Skills

```markdown
## Related Skills

- [TDD Workflow](../tdd-workflow/SKILL.md) - How to use TDD
- [Coding Standards](../coding-standards/SKILL.md) - Code quality
```

## Hooks Best Practices

### 1. Specific Matchers

Only run hooks when necessary.

```json
// Good - Specific matcher
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.ts$\"",
  "hooks": [...]
}

// Bad - Too general
{
  "matcher": "*",
  "hooks": [...]
}
```

### 2. Fast Execution

Keep hook execution under 1 second.

```json
// Good - Fast, specific check
{
  "matcher": "tool == \"Write\" && tool_input.file_path matches \"\\\\.ts$\"",
  "hooks": [{
    "type": "command",
    "command": "node -e \"console.error('[Hook] File format check')\""
  }]
}

// Bad - Slow, heavy operation
{
  "matcher": "*",
  "hooks": [{
    "type": "command",
    "command": "node -e \"execSync('npm audit'); execSync('npm test');\""
  }]
}
```

### 3. Clear Descriptions

```json
// Good - Clear purpose
{
  "matcher": "...",
  "description": "Auto-format TypeScript files after editing"
}

// Bad - Vague
{
  "matcher": "...",
  "description": "Some hook"
}
```

### 4. Non-Blocking Side Effects

PostToolUse hooks can't block, so focus on side effects.

```json
// Good - Side effect (non-blocking)
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.ts$\"",
  "hooks": [{
    "type": "command",
    "command": "node -e \"console.error('[Hook] TS format check')\""
  }],
  "description": "Side effect hook"
}

// Bad - Trying to validate/block
{
  "matcher": "tool == \"Edit\"",
  "hooks": [{
    "type": "command",
    "command": "node -e \"if(invalid) process.exit(1)\""  // Won't block
  }]
}
```

### 5. Error Handling

Always handle errors gracefully.

```javascript
// Good error handling
try {
  const result = await operation();
  console.error('[Hook] Success');
} catch (error) {
  console.error('[Hook] Warning: ' + error.message);
  // Continue - don't crash
}
console.log(JSON.stringify(data)); // Return original data
```

## Code Quality Standards

### 1. Immutability

NEVER mutate objects. Always create new ones.

```javascript
// WRONG - Mutation
function updateConfig(config, newValue) {
  config.value = newValue;  // BAD
  return config;
}

// CORRECT - Immutability
function updateConfig(config, newValue) {
  return { ...config, value: newValue };
}
```

### 2. Naming Conventions

Use clear, descriptive names.

```javascript
// Good names
const isValidEmail = true;
function calculateTotalPrice() {}
const MAX_RETRIES = 3;

// Bad names
const x = true;
function calc() {}
const mr = 3;
```

### 3. Function Size

Keep functions small and focused.

```javascript
// Good - Clear purpose
function validateEmail(email) {
  return email.includes('@');
}

// Bad - Too much responsibility
function processUserData(userData) {
  // Validate email
  // Hash password
  // Save to database
  // Send confirmation email
  // Update cache
}
```

### 4. Error Messages

Provide helpful, actionable error messages.

```javascript
// Good - Actionable
throw new Error('Email must contain @ symbol');

// Bad - Vague
throw new Error('Invalid input');
```

### 5. Comments

Comment WHY, not WHAT.

```javascript
// GOOD - Explains why
// Use startOf('day') instead of startOf('date')
// because the API requires day granularity
const dayStart = startOf(date, 'day');

// BAD - States the obvious
const dayStart = startOf(date, 'day'); // Set day start
```

## Security Best Practices

### 1. No Hardcoded Secrets

NEVER hardcode API keys, passwords, or tokens.

```javascript
// WRONG
const API_KEY = 'sk_live_abc123';

// CORRECT
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY environment variable required');
}
```

### 2. Input Validation

Always validate user input.

```javascript
// WRONG - No validation
function getUserData(userId) {
  return database.query(`SELECT * FROM users WHERE id = ${userId}`);
}

// CORRECT - Parameterized query
const { validateUserId } = require('validators');
function getUserData(userId) {
  validateUserId(userId); // Validate first
  return database.query('SELECT * FROM users WHERE id = ?', [userId]);
}
```

### 3. File Path Validation

Never trust file paths. Always validate.

```javascript
const fs = require('fs');
const path = require('path');

// WRONG - No validation
function readUserFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// CORRECT - Validate path
function readUserFile(filePath) {
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(process.cwd())) {
    throw new Error('Path must be within project');
  }
  if (!fs.existsSync(normalizedPath)) {
    throw new Error('File not found');
  }
  return fs.readFileSync(normalizedPath, 'utf8');
}
```

### 4. Command Execution

Never use string interpolation for shell commands.

```javascript
const { execSync } = require('child_process');

// WRONG - Shell injection vulnerability
function runCommand(userInput) {
  return execSync(`process ${userInput}`);
}

// CORRECT - Safe execution
function runCommand(userInput) {
  if (!/^[a-z0-9_-]+$/.test(userInput)) {
    throw new Error('Invalid input');
  }
  return execSync('process', [userInput]);
}
```

### 5. Sensitive Data Logging

Never log sensitive information.

```javascript
// WRONG - Logs password
console.log('User login:', { email: user.email, password: user.password });

// CORRECT - Sanitized logging
console.log('User login:', { email: user.email });
```

## Testing Best Practices

### 1. Write Tests for Commands

Test command execution and edge cases.

```javascript
describe('setup-pm command', () => {
  it('should detect current package manager', () => {
    const result = detectPackageManager();
    expect(result).toBeDefined();
  });

  it('should handle missing package.json', () => {
    expect(() => detectPackageManager('/nonexistent')).toThrow();
  });
});
```

### 2. Test Plugin Validation

Verify plugin structure is correct.

```javascript
describe('plugin.json', () => {
  it('should have required fields', () => {
    const plugin = require('./.claude-plugin/plugin.json');
    expect(plugin.name).toBeDefined();
    expect(plugin.version).toBeDefined();
    expect(plugin.description).toBeDefined();
  });
});
```

### 3. Test Hook Matchers

Verify CEL expressions work correctly.

```javascript
describe('hooks', () => {
  it('should match TypeScript files', () => {
    const matcher = 'tool == "Edit" && tool_input.file_path matches "\\\\.ts$"';
    expect(evaluateMatcher(matcher, {
      tool: 'Edit',
      tool_input: { file_path: 'src/index.ts' }
    })).toBe(true);
  });
});
```

## Documentation Best Practices

### 1. README Structure

```markdown
# Plugin Name

[One-line description]

## Features

- Feature 1
- Feature 2

## Installation

```bash
/plugin install ...
```

## Quick Start

[5-minute walkthrough]

## Commands

- `/cmd1` - What it does
- `/cmd2` - What it does

## Agents

- `agent-name` - Expertise and when to use

## Skills

- `skill-name` - What you'll learn

## Configuration

How to configure

## Contributing

How to contribute

## License

[License type]
```

### 2. Consistent Formatting

- Use headers (# ## ###)
- Use bold for emphasis (**text**)
- Use code blocks for examples
- Use lists for multiple items
- Include examples

### 3. Helpful Headings

```markdown
// Good - Specific
## How to Set Up Package Manager
## Common Errors

// Bad - Vague
## Setup
## Errors
```

### 4. Examples

Always provide working examples.

```markdown
## Example Usage

Here's a complete, working example:

```bash
/command --option value
```

This will output:
```
[Expected output]
```
```

## Performance Guidelines

### 1. Command Performance

Commands should complete in < 5 seconds.

```markdown
- < 1 second: Instant (preferred)
- 1-5 seconds: Acceptable
- > 5 seconds: Consider async feedback
```

### 2. Hook Performance

Hooks should complete in < 1 second.

```javascript
// Good - < 100ms
function quickHook() {
  console.error('[Hook] Message');
}

// Bad - > 5 seconds
function slowHook() {
  execSync('npm audit'); // Too slow
}
```

### 3. Agent Performance

Choose model based on task complexity:

- Haiku: < 10 seconds
- Sonnet: < 30 seconds
- Opus: < 60 seconds

## Version Management

### Semantic Versioning

```
MAJOR.MINOR.PATCH (e.g., 1.2.3)

1.0.0 → 1.0.1   Breaking changes - rare
1.0.0 → 1.1.0   New features (backward compatible)
1.0.0 → 1.0.1   Bug fixes
```

### Update Locations

Update version in:
- `.claude-plugin/plugin.json`
- `package.json`
- `CHANGELOG.md` (recommended)
- Git tag: `v1.0.0`

### Release Notes

```markdown
## Version 1.1.0 (2025-01-27)

### New Features
- New command `/new-cmd`
- Agent improvements

### Bug Fixes
- Fixed issue with X

### Breaking Changes
None
```

## Accessibility

### 1. Clear Language

Use simple, clear language. Avoid jargon when possible.

```markdown
// Good
---
description: Automatically format and clean up code
---

// Bad
---
description: Invoke auto-reformat with opt-in DSL transpilation
---
```

### 2. Helpful Error Messages

```javascript
// Good
throw new Error('package.json not found in current directory. Run: npm init');

// Bad
throw new Error('package.json missing');
```

### 3. Progressive Complexity

Start simple, provide deeper information for advanced users.

```markdown
## Quick Start
[Simple version]

## Advanced Configuration
[Complex version]
```

---

**Last Updated:** 2026-02-14
**Version:** 3.1.0
