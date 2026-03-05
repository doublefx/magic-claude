---
name: strategic-compact
description: >
  Use this skill when you want to compress conversation history to free up context space. Invoke proactively when the conversation is getting long, context usage is climbing, or you're approaching the limit — especially at natural transition points: after finishing a task, completing a planning phase, or before moving to a new area of work. Gives you control over when compaction happens, so it occurs at logical breakpoints instead of interrupting your flow.
---

1. **Tracks tool calls** - Counts tool invocations in session
2. **Threshold detection** - Suggests at configurable threshold (default: 50 calls)
3. **Periodic reminders** - Reminds every 25 calls after threshold

## Hook Setup

Add to your `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "tool == \"Edit\" || tool == \"Write\"",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/strategic-compact/suggest-compact.sh"
      }]
    }]
  }
}
```

## Configuration

Environment variables:
- `COMPACT_THRESHOLD` - Tool calls before first suggestion (default: 50)

## Best Practices

1. **Compact after planning** - Once plan is finalized, compact to start fresh
2. **Compact after debugging** - Clear error-resolution context before continuing
3. **Don't compact mid-implementation** - Preserve context for related changes
4. **Read the suggestion** - The hook tells you *when*, you decide *if*

## Related

- [Advanced Topics Guide](../../docs/guides/advanced-topics.md) - Token optimization section
- Memory persistence hooks - For state that survives compaction
