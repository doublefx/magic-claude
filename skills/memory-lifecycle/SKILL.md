---
description: Memory health management, consolidation, and deprecation. Consolidates when 5+ related memories exist, marks outdated content, and maintains memory hierarchy.
context: fork
---

# /memory-lifecycle - Memory Health & Consolidation

## When to Use

- Periodically (weekly recommended)
- After creating many new memories
- When finding duplicates or overlaps
- Before major exploration sessions
- When `/serena-status` shows health issues

## Workflow

### Step 1: Memory Inventory

**List all memories**:
```
Use Serena MCP: list_memories()
```

**Categorize by**:
- Topic prefix (backend_, frontend_, auth_, etc.)
- Type suffix (architecture, workflow, guide, etc.)
- Confidence level
- Last updated date

### Step 2: Health Check

#### A. Stale Detection

**Criteria for stale memories**:
- Last updated > 30 days ago
- Confidence is Low or Needs Review
- Referenced files no longer exist

**Action**:
- Mark as `Needs Review`
- Consider verification or deprecation

#### B. Duplicate Detection

**Check for overlapping content**:
- Similar names (e.g., `auth_login_workflow` vs `auth_signin_workflow`)
- Same topic from different angles
- Redundant information

**Action**:
- Merge into single comprehensive memory
- Deprecate redundant one with reference

#### C. Orphan Detection

**Check for**:
- Child memories without parent
- References to deleted memories
- Broken "Related Memories" links

**Action**:
- Establish parent-child relationships
- Update or remove broken links

### Step 3: Consolidation (5+ Related Memories)

**Threshold**: When 5+ memories exist on related topic, create parent overview.

**Example before consolidation**:
```
backend_api_endpoints_specifics
backend_api_authentication_workflow
backend_api_error_handling_patterns
backend_api_rate_limiting_configuration
backend_api_testing_guide
```

**After consolidation**:
```
backend_api_layer_architecture (NEW - parent overview)
├── backend_api_endpoints_specifics
├── backend_api_authentication_workflow
├── backend_api_error_handling_patterns
├── backend_api_rate_limiting_configuration
└── backend_api_testing_guide
```

**Parent overview content**:
```markdown
# Backend API Layer Architecture

**Last Updated**: YYYY-MM-DD
**Confidence**: High
**Status**: Active
**Type**: Overview (consolidation)

## Summary

This is a consolidated overview of the backend API layer.
For detailed information, see child memories below.

## Key Components

1. **Endpoints** - See: backend_api_endpoints_specifics
2. **Authentication** - See: backend_api_authentication_workflow
3. **Error Handling** - See: backend_api_error_handling_patterns
4. **Rate Limiting** - See: backend_api_rate_limiting_configuration
5. **Testing** - See: backend_api_testing_guide

## Child Memories

- `backend_api_endpoints_specifics`
- `backend_api_authentication_workflow`
- `backend_api_error_handling_patterns`
- `backend_api_rate_limiting_configuration`
- `backend_api_testing_guide`

## Quick Reference

[High-level summary of the entire API layer]
```

**Update child memories** with parent link:
```markdown
**Parent Memory**: backend_api_layer_architecture
```

### Step 4: Deprecation

**When to deprecate**:
- Feature/code was removed
- Superseded by newer approach
- Factually incorrect

**Deprecation process**:

1. **Update status**:
```markdown
**Status**: Deprecated
**Deprecation Date**: YYYY-MM-DD
**Superseded By**: [new_memory_name]
**Deprecation Reason**: [explanation]
```

2. **Keep content** for historical reference

3. **Update references** in other memories

**DO NOT delete** unless:
- Content is completely wrong
- Poses security risk
- User explicitly requests

### Step 5: Refactoring

#### Split Large Memories

If a memory is > 500 lines:
- Split into overview + specifics
- Create child memories for sections
- Update with proper links

#### Merge Tiny Memories

If memories are < 50 lines and related:
- Combine into comprehensive memory
- Deprecate originals with reference

#### Rename Vague Memories

If names don't follow conventions:
- Propose better names
- Use `rename_symbol` or create new + deprecate old

### Step 6: Report Lifecycle Results

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Memory Lifecycle Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Health Summary

Total Memories: 25

By Confidence:
  - High: 15 (60%)
  - Medium: 7 (28%)
  - Low/Needs Review: 3 (12%)

By Status:
  - Active: 22
  - Deprecated: 2
  - Needs Review: 1

## Actions Taken

### Consolidation (1)
Created parent overview:
  - backend_api_layer_architecture (5 children)

### Deprecation (1)
Marked deprecated:
  - legacy_auth_v1_workflow (superseded by auth_oauth_flow_workflow)

### Health Updates (3)
Marked as Needs Review:
  - frontend_state_management_patterns (stale, 45 days)
  - database_indexes_configuration (file moved)
  - testing_mocks_setup_guide (possibly outdated)

### Recommendations
1. Review and update 3 stale memories
2. Consider splitting backend_service_layer_architecture (650 lines)
3. Merge auth_login_* and auth_signin_* memories (duplicates)

## Next Scheduled Check
Recommended: 7 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Consolidation Threshold

**Default**: 5 related memories triggers consolidation suggestion

**Configurable** in `.claude/serena-config.json`:
```json
{
  "serena": {
    "consolidation_threshold": 5
  }
}
```

## Best Practices

1. **Run lifecycle checks weekly** - prevent memory sprawl
2. **Consolidate early** - don't wait for 10+ fragments
3. **Deprecate don't delete** - history is valuable
4. **Keep hierarchy shallow** - max 2 levels (parent → children)
5. **Use meaningful names** - conventions prevent confusion
