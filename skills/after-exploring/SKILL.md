---
description: Use this skill AFTER code exploration to document findings in Serena memory. Evaluates significance and creates/updates memories with proper naming conventions.
context: fork
---

# /after-exploring - Document Exploration Findings

## When to Use

**After**:
- Any code exploration session
- Investigate agent completes
- Learning something new about the codebase
- Discovering architectural patterns or integrations

## Workflow

### Step 1: Evaluate Finding Significance

**Significant (DOCUMENT)**:
- Architecture decisions or patterns
- Integration points between systems
- Non-obvious code flows
- Configuration patterns
- Testing strategies
- Performance considerations
- Security-related findings

**Not Significant (SKIP)**:
- Trivial code (simple getters/setters)
- Already documented patterns
- Debugging artifacts
- One-time fixes

### Step 2: Choose Memory Name

**Pattern**: `{scope}_{topic}_{type}`

**Valid Types** (suffixes):
- `_architecture` - High-level design
- `_workflow` - Process/flow
- `_guide` - How-to
- `_conventions` - Standards
- `_configuration` - Setup
- `_troubleshooting` - Debugging
- `_overview` - General summary
- `_specifics` - Detailed implementation
- `_patterns` - Design patterns
- `_design` - Design decisions
- `_implementation` - Implementation details

**Examples**:
- `backend_api_layer_architecture`
- `auth_oauth_flow_workflow`
- `testing_e2e_playwright_guide`
- `database_connection_configuration`

**Invalid Names** (will be rejected):
- `notes`, `temp`, `misc`, `stuff`, `test`, `tmp`, `todo`, `scratch`, `draft`

### Step 3: Structure Memory Content

Use this template:

```markdown
# [Topic Title]

**Last Updated**: YYYY-MM-DD
**Confidence**: High | Medium | Low | Needs Review
**Status**: Active
**Scope**: [branch/version/module/product/all]

## Overview

[2-3 sentence summary]

## Key Points

- Point 1
- Point 2
- Point 3

## Details

[Detailed explanation with code references]

## Code References

- `path/to/file.ts:line` - Description
- `path/to/other.ts:line` - Description

## Related Memories

- [list related memory names if any]

## Open Questions

- [Any unresolved questions]
```

### Step 4: Decide Create vs Update

**List existing memories**:
```
Use Serena MCP: list_memories()
```

**Check for related memories**:
- Same topic area?
- Overlapping content?
- Parent/child relationship?

**If related memory exists**:
- Use `edit_memory()` to update
- Preserve existing content, add new findings
- Update `Last Updated` and `Confidence`

**If no related memory**:
- Use `write_memory()` to create new
- Follow naming conventions strictly

### Step 5: Check Consolidation Need

After creating/updating:

**Count memories in same topic area**:
- If 5+ related memories exist → Consider consolidation
- Create parent overview memory
- Update children with parent link

**Example consolidation**:
```
backend_api_layer_architecture (parent - overview)
├── backend_api_endpoints_specifics
├── backend_api_authentication_workflow
├── backend_api_error_handling_patterns
├── backend_api_rate_limiting_configuration
└── backend_api_testing_guide
```

### Step 6: Return Documentation Summary

```
## Memory Documentation Complete

**Action**: [Created/Updated]
**Memory**: `memory_name`
**Confidence**: [High/Medium]

### Summary
[What was documented]

### Consolidation Status
[If 5+ related memories exist, note this]
```

## Serena MCP Tools

**Write new memory**:
```
write_memory("memory_name", "content")
```

**Update existing**:
```
edit_memory("memory_name", "old_text", "new_text", regex=false)
```

**List all**:
```
list_memories()
```

**Read memory**:
```
read_memory("memory_name")
```

## Important Notes

1. **This skill runs in FORKED context** - focus on documentation
2. **Follow naming conventions** - invalid names will be rejected
3. **Set confidence accurately** - affects future trust decisions
4. **Link related memories** - maintain hierarchy
5. **Keep content focused** - one topic per memory
