---
name: continuous-learning
description: Use when session contains error resolutions, user corrections, workarounds, or reusable patterns worth preserving. Also triggered by ContinuousLearning hook signal.
allowed-tools: Read, Grep, Glob, Write
---

# Continuous Learning Skill

Automatically evaluates Claude Code sessions on end to extract reusable patterns that can be saved as learned skills.

## When to Activate

- At session end (triggered automatically by Stop hook)
- When a non-trivial problem has been solved during the session
- When reusable patterns or workarounds are discovered

## How It Works

This skill runs as a **Stop hook** at the end of each session:

1. **Session Evaluation**: Checks if session has enough messages (default: 10+)
2. **Pattern Detection**: Identifies extractable patterns from the session
3. **Skill Extraction**: Saves useful patterns to appropriate location:
   - Project-level: `.claude/skills/learned/` (project-specific patterns)
   - User-level: `~/.claude/skills/learned/` (general reusable patterns)

## Configuration

Edit `config.json` to customize:

```json
{
  "min_session_length": 10,
  "extraction_threshold": "medium",
  "auto_approve": false,
  "project_skills_path": ".claude/skills/learned/",
  "user_skills_path": "~/.claude/skills/learned/",
  "default_scope": "project",
  "patterns_to_detect": [
    "error_resolution",
    "user_corrections",
    "workarounds",
    "debugging_techniques",
    "project_specific"
  ],
  "ignore_patterns": [
    "simple_typos",
    "one_time_fixes",
    "external_api_issues"
  ]
}
```

## Pattern Types

| Pattern | Description |
|---------|-------------|
| `error_resolution` | How specific errors were resolved |
| `user_corrections` | Patterns from user corrections |
| `workarounds` | Solutions to framework/library quirks |
| `debugging_techniques` | Effective debugging approaches |
| `project_specific` | Project-specific conventions |

## Hook Setup

Add to your `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning/evaluate-session.sh"
      }]
    }]
  }
}
```

## Why Stop Hook?

- **Lightweight**: Runs once at session end
- **Non-blocking**: Doesn't add latency to every message
- **Complete context**: Has access to full session transcript

## Related

- [Advanced Topics Guide](../../docs/guides/advanced-topics.md) - Section on continuous learning
- `magic-claude:learn` command - Manual pattern extraction mid-session
