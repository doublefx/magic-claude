---
description: Use this skill BEFORE any code exploration. Checks Serena memories first - if sufficient, returns answer immediately (saves tokens!). Only explores if memories insufficient or explicitly requested.
---

# /before-exploring - Memory-First Exploration

## When to Use

**MANDATORY** before:
- Using Serena exploration tools (find_symbol, search_for_pattern, etc.)
- Spawning Explore or general-purpose Task agents
- Investigating codebase questions

**Skip if**:
- Already checked memories for this specific question
- User explicitly says "explore anyway" or "skip memories"

## Workflow

### Step 1: List All Memories

```
Use Serena MCP: list_memories()
```

### Step 2: Identify Relevant Memories

Pattern match user's question against memory names:
- Look for topic keywords in memory names
- Check related areas (e.g., "authentication" might relate to "auth_*", "login_*", "security_*")

### Step 3: Read Potentially Relevant Memories

```
Use Serena MCP: read_memory("memory_name")
```

Read 2-5 most relevant memories based on names.

### Step 4: Evaluate Sufficiency

**Check confidence level** in memory metadata:
- `High` → Trust the content
- `Medium` → Verify if critical
- `Low` or `Needs Review` → May need exploration

**Determine if memories answer the question:**

#### Option A: Memories Fully Answer Question
- Confidence is High
- Information is complete and current
- **ACTION**: Return consolidated answer directly to user
- **DO NOT** spawn Explore agent

#### Option B: Memories Partially Answer
- Some relevant info exists
- Gaps identified
- **ACTION**: Return partial answer + targeted exploration plan
- Explore only the gaps

#### Option C: No Relevant Memories
- Nothing matches the topic
- **ACTION**: Plan full exploration
- Note: This will need documentation after (/after-exploring)

### Step 5: Execute Exploration (if needed)

If Option B or C:
1. Plan minimal exploration scope
2. Execute using Serena tools (prefer JetBrains if available)
3. **IMMEDIATELY** invoke `/after-exploring` when done

## Response Format

### When Memories Are Sufficient

```
## Answer (from Serena memories)

[Consolidated answer here]

---
**Source**: Memories consulted: [list]
**Confidence**: [High/Medium]
**Last Verified**: [date from memory metadata]
```

### When Exploration Needed

```
## Partial Answer (from memories)

[What we know]

## Exploration Plan

[Specific areas to investigate]

---
Proceeding with targeted exploration...
```

## Tool Selection

**If JetBrains Available** (check SERENA_JETBRAINS_AVAILABLE env):
- Use `jet_brains_find_symbol`, `jet_brains_get_symbols_overview`, etc.
- Faster and more accurate
- Full external library indexing

**If LSP Only**:
- Use `find_symbol`, `get_symbols_overview`, etc.
- Still effective, slightly slower

## Important Notes

1. **This skill runs in MAIN context** - you return answers directly to user
2. **Check memories FIRST** - the whole point is saving tokens
3. **Document findings** - always call `/after-exploring` if you explored
4. **Update stale memories** - if memory confidence is Low, verify and update
