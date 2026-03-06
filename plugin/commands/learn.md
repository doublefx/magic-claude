---
description: Extract reusable patterns from the current session and save as skills
argument-hint: "[pattern description]"
---

# /learn - Extract Reusable Patterns

Invoke the `magic-claude:continuous-learning` skill to analyze the current session and extract patterns worth saving as learned skills.

## Usage

```bash
# Extract patterns automatically (analyze full session)
/learn

# Extract a specific pattern
/learn "redis connection pooling fix"
/learn "Next.js middleware authentication pattern"

# From a specific source file
/learn from path/to/file.md
```

## Delegation

If the user provided an argument, pass it as context to focus the extraction:

- **No argument** → invoke `magic-claude:continuous-learning` — scan the full session
- **Pattern description** (e.g., `"redis connection pooling fix"`) → invoke `magic-claude:continuous-learning` and tell it to focus extraction on that specific pattern/topic
- **`from <path>`** → invoke `magic-claude:continuous-learning` and tell it to read the specified file as the source material for extraction

The skill handles: scanning, filtering, drafting the skill template (with trigger-oriented descriptions and "explain the why" guidance), user confirmation, and writing the files.

## Skill Storage (Quick Reference)

| Scope | Path | Use When |
|-------|------|----------|
| **Project-level** | `{PROJECT_ROOT}/.claude/skills/<name>/SKILL.md` | Pattern is specific to THIS project |
| **User-level** | `~/.claude/skills/<name>/SKILL.md` | Pattern is reusable across ALL projects |

**Default: Project-level.** Most learned patterns are project-specific.

**NEVER create skills in** the plugin's `skills/` directory — that's for plugin-provided skills only.
