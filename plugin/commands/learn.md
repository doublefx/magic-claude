---
description: Extract reusable patterns from the current session and save as skills
argument-hint: "[pattern description]"
---

# /learn - Extract Reusable Patterns

Analyze the current session and extract any patterns worth saving as skills.

## Usage

```bash
# Extract patterns automatically (analyze full session)
/learn

# Extract a specific pattern
/learn "redis connection pooling fix"
/learn "Next.js middleware authentication pattern"
/learn "error handling workaround"

# From a specific source file
/learn from path/to/file.md
```

## Trigger

Run `/learn` at any point during a session when you've solved a non-trivial problem.

If you specify a pattern description, focus the extraction on that specific area.

## Skill Storage Locations

**IMPORTANT: Paths are relative to the CURRENT WORKING PROJECT, not the plugin repository.**

**Choose the right level based on skill scope:**

| Scope | Path | Use When |
|-------|------|----------|
| **Project-level** | `{PROJECT_ROOT}/.claude/skills/<name>/SKILL.md` | Pattern is specific to THIS project (codebase conventions, project-specific fixes, domain knowledge) |
| **User-level** | `~/.claude/skills/<name>/SKILL.md` | Pattern is reusable across ALL projects (general debugging techniques, framework patterns, tool usage) |

**Default: Project-level** - Most learned patterns are project-specific.

**Skill directory structure:** Each skill is a directory containing `SKILL.md`:
```
.claude/skills/
  my-pattern/
    SKILL.md    <-- the skill file
  another-fix/
    SKILL.md
```

This matches the standard Claude Code skill discovery pattern, ensuring learned skills are registered in the Skill tool and invocable.

**NEVER create skills in:**
- The plugin's `skills/` directory (that's for plugin-provided skills only)
- `{PROJECT_ROOT}/skills/` (wrong path - must be in `.claude/skills/`)

## What to Extract

Look for:

1. **Error Resolution Patterns**
   - What error occurred?
   - What was the root cause?
   - What fixed it?
   - Is this reusable for similar errors?

2. **Debugging Techniques**
   - Non-obvious debugging steps
   - Tool combinations that worked
   - Diagnostic patterns

3. **Workarounds**
   - Library quirks
   - API limitations
   - Version-specific fixes

4. **Project-Specific Patterns**
   - Codebase conventions discovered
   - Architecture decisions made
   - Integration patterns

## Output Format

Create a skill file following the official Claude Code skill format:

```markdown
---
name: pattern-name-lowercase-with-hyphens
description: Brief description of what this pattern does and when to use it
user-invocable: false
---

# [Descriptive Pattern Name]

**Extracted:** [Date]
**Context:** [Brief description of when this applies]

## Problem

[What problem this solves - be specific]

## Solution

[The pattern/technique/workaround]

## Example

```code
[Code example if applicable]
```

## When to Activate

[Trigger conditions - what should activate this skill]
```

### Frontmatter Fields

| Field | Value | Purpose |
|-------|-------|---------|
| `name` | lowercase-with-hyphens | Skill identifier (max 64 chars) |
| `description` | Short sentence | Claude uses this to decide when to apply automatically |
| `user-invocable` | `false` | Reference skills shouldn't appear in `/` menu |

## Process

1. **Determine project root**: Use `process.cwd()` - the directory where Claude Code was launched (NOT the plugin directory)
2. Review the session for extractable patterns
3. Identify the most valuable/reusable insight
4. **Determine scope**: Is this project-specific or generally reusable?
5. Draft the skill file with proper frontmatter
6. Ask user to confirm before saving
7. Save to appropriate location:
   - Project: `{PROJECT_ROOT}/.claude/skills/[pattern-name]/SKILL.md`
   - User: `~/.claude/skills/[pattern-name]/SKILL.md`
8. Create the skill directory if it doesn't exist: `mkdir -p .claude/skills/[pattern-name]/`

## Example Decision Tree

**Is the pattern specific to this codebase?**
- Uses project-specific APIs → **Project-level**
- References project architecture → **Project-level**
- Contains project domain knowledge → **Project-level**
- General framework pattern → **User-level**
- Universal debugging technique → **User-level**
- Tool usage pattern → **User-level**

## Notes

- Don't extract trivial fixes (typos, simple syntax errors)
- Don't extract one-time issues (specific API outages, etc.)
- Focus on patterns that will save time in future sessions
- Keep skills focused - one pattern per skill
- Always use proper frontmatter for skill files
- Prefer project-level when in doubt - it's easier to promote later
