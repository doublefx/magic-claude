# Serena Memory Lifecycle Management

## Memory States

| Status | Meaning | Action |
|--------|---------|--------|
| **Active** | Current and accurate | Use confidently |
| **Needs Review** | May be outdated | Verify before relying |
| **Deprecated** | Superseded or obsolete | Use successor instead |
| **Superseded** | Replaced by newer memory | Follow reference |

## Confidence Levels

| Level | Meaning | When to Use |
|-------|---------|-------------|
| **High** | Verified against current code | After code exploration confirms |
| **Medium** | Likely accurate, not recently verified | Initial documentation |
| **Low** | Potentially outdated | After major changes |
| **Needs Review** | Requires verification | Post-refactoring |

## Lifecycle Stages

### 1. Creation

**When to create:**
- After discovering architectural patterns
- After understanding complex integrations
- After resolving non-trivial issues
- After learning project conventions

**How to create:**
1. Use Serena `write_memory` tool
2. Follow naming conventions
3. Use memory template
4. Set initial confidence (usually Medium)

### 2. Maintenance

**Regular updates needed when:**
- Code changes affect documented areas
- New patterns emerge
- Errors found in documentation
- Confidence drops after time

**Update triggers:**
- `/git-sync` after external changes
- Manual review during exploration
- `/memory-lifecycle` periodic checks

### 3. Consolidation

**Threshold:** 5+ related memories on same topic

**Process:**
1. Identify related memories (same prefix/topic)
2. Create parent overview memory
3. Link children to parent
4. Move high-level content to parent
5. Keep specifics in children

**Example:**
```
# Before: 6 scattered memories
auth_login_flow_workflow
auth_logout_flow_workflow
auth_session_management_specifics
auth_token_refresh_patterns
auth_oauth_configuration
auth_security_troubleshooting

# After: Organized hierarchy
auth_system_architecture (NEW - parent overview)
├── auth_login_flow_workflow
├── auth_logout_flow_workflow
├── auth_session_management_specifics
├── auth_token_refresh_patterns
├── auth_oauth_configuration
└── auth_security_troubleshooting
```

### 4. Deprecation

**When to deprecate:**
- Feature/code was removed
- Better approach documented elsewhere
- Content is factually incorrect
- Superseded by newer memory

**Process:**
1. Update status to `Deprecated`
2. Add `Deprecation Date`
3. Add `Superseded By` (if applicable)
4. Add `Deprecation Reason`
5. **DO NOT DELETE** - keep for history

**Template:**
```markdown
**Status**: Deprecated
**Deprecation Date**: 2026-01-29
**Superseded By**: auth_oauth2_flow_workflow
**Deprecation Reason**: Legacy v1 auth removed in commit abc123
```

## Health Checks

Run `/memory-lifecycle` periodically to:

### Stale Detection
- Last updated > 30 days
- Confidence is Low
- Referenced files deleted

### Duplicate Detection
- Similar names
- Overlapping content
- Same topic, different angles

### Orphan Detection
- Child without parent
- References to deleted memories
- Broken links

## Best Practices

### DO

- **Check memories before exploring** - use Serena `list_memories` / `read_memory`
- **Document significant findings** - use Serena `write_memory` / `edit_memory`
- **Consolidate early** - Don't wait for fragmentation
- **Set confidence honestly** - Low is better than wrong High
- **Link related memories** - Maintain discoverability
- **Sync after git ops** - `/git-sync`

### DON'T

- **Don't create generic memories** - Be specific
- **Don't skip documentation** - Future you will thank you
- **Don't delete memories** - Deprecate instead
- **Don't ignore low confidence** - Update or verify
- **Don't create duplicates** - Check existing first
- **Don't overcomplicate hierarchy** - Max 2 levels

## Automation

### Hooks that help

### Skills that help

| Skill | Purpose |
|-------|---------|
| `/git-sync` | Sync with git changes |
| `/memory-lifecycle` | Health checks |
| `/serena-status` | Configuration diagnostics |

## Metrics

Track memory health with these metrics:

- **Total memories**: Growing over time
- **Active vs Deprecated ratio**: Should be high
- **Average confidence**: Should trend toward High
- **Consolidation rate**: Parents per total
- **Stale percentage**: Should be low

Run `/serena-status` to see current metrics.
