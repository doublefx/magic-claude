---
name: claude-mem-context
description: Cross-session memory search via claude-mem MCP. Use BEFORE exploring code for architectural understanding, investigating bugs, or planning changes to existing systems — past sessions likely contain decisions, patterns, and resolutions that eliminate redundant exploration. Search component names, error messages, or concepts before spawning Explore agents. Skip entirely if claude-mem tools are unavailable.
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
| Get architectural context | `search(query about component/area)` | When planning changes to existing systems |
| Explore timeline around an event | `timeline(anchor=ID)` | Understanding cause-effect sequences |
| Get full observation details | `get_observations([IDs])` | When search summaries aren't sufficient |

### Keep Using Native Tools For

- **Explore agent**: Current codebase structure and implementation details
- **Serena tools**: Symbol definitions, references, type hierarchies
- **Grep/Glob**: Finding current code patterns and files
- **Read**: Reading current file contents

## 3-Layer Retrieval Workflow

claude-mem uses a progressive retrieval pattern to minimize token usage:

### Layer 1: Search (cheap — ~50-100 tokens per result)
Call `search` with a query. Returns an index with observation IDs, titles, types, and timestamps. Scan this to identify relevant results.

**Useful parameters beyond `query`:**
- `orderBy: "recency"` — recent work first (default is relevance)
- `type: "change"` — only what was modified (vs discovered or decided)
- `topics: ["refactoring", "hooks"]` — filter by topic tags
- `entity: "component-name"` — filter by named entity
- `dateStart / dateEnd` — restrict to a time range
- `limit` — control result count (default varies)

### Layer 2: Timeline (moderate — context around results)
Call `timeline` with `anchor: observation-id`. Shows observations around a specific result chronologically.

**When to use timeline:**
- Debugging — understand the sequence of events leading to a bug
- Cause-effect analysis — what happened before and after a decision
- Understanding multi-step operations — tracing a refactoring across steps

**When to skip timeline and go straight to Layer 3:**
- You already know which specific observation IDs you need
- You're doing an audit or quality check on specific results
- The search index titles are sufficient to filter

### Layer 3: Full Details (expensive — full observation content)
Call `get_observations` with `ids: [id1, id2]`. Fetches complete observation content. Only use for the specific IDs you've filtered down to.

**Always start at Layer 1.** Only go deeper when the index isn't sufficient.

## Trust But Verify

claude-mem observations are **generally reliable but not authoritative**. Known limitations:

- **Intermediate states**: An observation may capture a moment mid-operation (e.g., "file deleted but config not yet updated") that was resolved seconds later
- **Minor factual errors**: Tool names, hook types, or counts may be slightly wrong in narratives
- **Stale information**: An observation from a previous session may describe code that has since been refactored or deleted

**Rule**: For any critical detail from claude-mem (file paths, architectural claims, tool configurations), verify against the current codebase before acting on it. A quick `Read` or `Grep` costs less than debugging a wrong assumption.

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
