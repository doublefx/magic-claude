---
name: claude-mem-context
description: claude-mem MCP cross-session context. Prefer claude-mem for past decisions, architectural history, bug patterns, and session continuity.
user-invocable: false
---

# claude-mem Cross-Session Context

> **Guard clause**: This skill only applies when claude-mem MCP is available (tools from `plugin_claude-mem_mcp-search`). If claude-mem is not installed, ignore this entire skill and use codebase exploration normally.

## Tool Mapping

When claude-mem is available, use it for historical and cross-session context:

| Need | Tool | When to Use |
|------|------|-------------|
| Find past decisions/rationale | `search(query)` | Before making architectural choices |
| Understand why something was done | `search(query about decision)` | When encountering unfamiliar patterns |
| Check if bug was seen before | `search(error/symptom)` | When debugging recurring issues |
| Get architectural context | `search(component/area)` | When planning changes to existing systems |
| Explore timeline around an event | `timeline(anchor=ID)` | After search returns interesting results |
| Get full observation details | `get_observations([IDs])` | When search summaries aren't sufficient |

### Keep Using Native Tools For

- **Explore agent**: Current codebase structure and implementation details
- **Serena tools**: Symbol definitions, references, type hierarchies
- **Grep/Glob**: Finding current code patterns and files
- **Read**: Reading current file contents

## 3-Layer Retrieval Workflow

claude-mem uses a progressive retrieval pattern to minimize token usage:

### Layer 1: Search (cheap — ~50-100 tokens per result)
Call `mcp__plugin_claude-mem_mcp-search__search` with `{"query": "authentication architecture decision"}`.
Returns an index with observation IDs, titles, types, and timestamps. Scan this to identify relevant results.

### Layer 2: Timeline (moderate — context around results)
Call `mcp__plugin_claude-mem_mcp-search__timeline` with `{"anchor": "observation-id"}`.
Shows observations around a specific result chronologically. Useful for understanding the sequence of events.

### Layer 3: Full Details (expensive — full observation content)
Call `mcp__plugin_claude-mem_mcp-search__get_observations` with `{"ids": ["id1", "id2"]}`.
Fetches complete observation content. Only use for the specific IDs you've filtered down to.

**Always start at Layer 1.** Only go deeper when the index isn't sufficient.

## Decision Tree

```
Need context for current task?
  |
  +-- Was this discussed in a previous session?
  |     +-- YES --> search(query about topic)
  |
  +-- Need to understand why something was done?
  |     +-- YES --> search(query about decision/rationale)
  |
  +-- Encountering a bug that might have been seen before?
  |     +-- YES --> search(query about error/symptom)
  |
  +-- Need architecture/design context?
  |     +-- YES --> search(query about component/area)
  |
  +-- Working on fresh code with no history?
        +-- YES --> Skip claude-mem, use Serena + Explore
```

## Fallback

If claude-mem is unavailable or returns no results, fall back to codebase exploration (Serena tools, Explore agents, Grep/Glob). Do not retry claude-mem tools more than once per failure type in a session.
