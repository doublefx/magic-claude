# Serena Memory Naming Conventions

## Memory vs Skill: When to Use Which

**Serena Memories** store knowledge about **what the code IS**:
- Architecture and system design
- Code patterns and conventions
- Workflows and processes
- Configuration and setup
- Ideas and requirements (PRDs)
- Exploration findings

**Learned Skills** (via `/learn`) store knowledge about **how to SOLVE problems**:
- Error resolution patterns
- Debugging techniques
- Workarounds for library/framework quirks
- User corrections that should be remembered

| Finding Type | Storage | Example |
|--------------|---------|---------|
| "The auth system uses OAuth2 with PKCE" | **Memory** | `auth_oauth_architecture` |
| "Fix: Redis connection timeout by adding retry logic" | **Skill** | `.claude/skills/learned/redis-retry-pattern.md` |
| "API uses REST with versioned endpoints" | **Memory** | `api_rest_design` |
| "Workaround: Next.js hydration error fix" | **Skill** | `.claude/skills/learned/nextjs-hydration-fix.md` |
| "Idea: Add full-text search to products" | **Memory** | `search_fulltext_idea` |
| "PRD: User authentication v2" | **Memory** | `user_auth_v2_prd` |

## Pattern

```
{scope}_{topic}_{type}
```

**Examples:**
- `backend_api_layer_architecture`
- `auth_oauth_flow_workflow`
- `testing_e2e_playwright_guide`
- `database_connection_configuration`
- `search_fulltext_idea`
- `user_auth_v2_prd`

## Valid Suffixes (Types)

### Documentation Suffixes

| Suffix | Purpose | Use When |
|--------|---------|----------|
| `_architecture` | High-level design | System/component design decisions |
| `_workflow` | Process/flow | Step-by-step procedures |
| `_guide` | How-to | Instructions for accomplishing tasks |
| `_conventions` | Standards | Coding standards, naming patterns |
| `_configuration` | Setup | Environment, tool, service config |
| `_troubleshooting` | Debugging | Known issues and solutions |
| `_overview` | General summary | Consolidated parent memories |
| `_specifics` | Detailed implementation | Deep-dive technical details |
| `_patterns` | Design patterns | Reusable patterns and approaches |
| `_design` | Design decisions | Why things are built a certain way |
| `_implementation` | Implementation details | How things work |

### Exploration & Evolution Suffixes

| Suffix | Purpose | Use When |
|--------|---------|----------|
| `_exploration` | Code exploration findings | After investigating codebase areas |
| `_evolution` | Code change documentation | After significant code modifications |
| `_context` | Project context | General project information (e.g., `project_config_context`) |

### Planning & Ideas Suffixes

| Suffix | Purpose | Use When |
|--------|---------|----------|
| `_idea` | Feature ideas | Capturing ideas for future implementation |
| `_prd` | Product requirements | Storing PRDs and requirements documents |
| `_proposal` | Design proposals | Architectural or feature proposals |
| `_roadmap` | Future planning | Development roadmap and milestones |

## Scope Prefixes

| Prefix | Scope | Examples |
|--------|-------|----------|
| `project_` | Project-level | `project_config_context`, `project_goals_overview` |
| `backend_` | Server-side code | `backend_api_`, `backend_service_` |
| `frontend_` | Client-side code | `frontend_components_`, `frontend_state_` |
| `auth_` | Authentication/Authorization | `auth_oauth_`, `auth_session_` |
| `database_` | Data storage | `database_schema_`, `database_migrations_` |
| `testing_` | Test infrastructure | `testing_unit_`, `testing_e2e_` |
| `deployment_` | CI/CD, infrastructure | `deployment_pipeline_`, `deployment_docker_` |
| `api_` | API design | `api_rest_`, `api_graphql_` |
| `security_` | Security concerns | `security_validation_`, `security_encryption_` |
| `performance_` | Performance optimization | `performance_caching_`, `performance_queries_` |
| `monitoring_` | Observability | `monitoring_logging_`, `monitoring_metrics_` |
| `feature_` | Feature-specific | `feature_search_`, `feature_notifications_` |

## Invalid Names (Rejected)

The following generic names are **rejected** as too vague:

- `notes`
- `temp`
- `misc`
- `stuff`
- `test`
- `tmp`
- `todo`
- `scratch`
- `draft`

## Format Rules

1. **Lowercase only** - Use `backend_api`, not `Backend_API`
2. **Underscores for separation** - Use `backend_api`, not `backend-api`
3. **No special characters** - Only `a-z`, `0-9`, and `_`
4. **Must have valid suffix** - Name must end with one of the valid suffixes
5. **Descriptive topic** - Topic should be specific, not generic

## Good vs Bad Examples

| Bad | Good | Reason |
|-----|------|--------|
| `notes` | `backend_api_architecture` | Too generic |
| `api_stuff` | `api_rest_patterns` | Generic + no valid suffix |
| `Backend-API` | `backend_api_overview` | Wrong case and separator |
| `auth` | `auth_oauth_flow_workflow` | Too short, no suffix |
| `temp_fix` | `auth_session_troubleshooting` | Generic prefix |
| `new_feature` | `feature_search_fulltext_idea` | Use proper suffix |
| `requirements` | `user_auth_v2_prd` | Use _prd suffix |

## Ideas and PRD Examples

### Capturing an Idea

```
Memory name: feature_realtime_notifications_idea

Content:
# Real-time Notifications - Idea

**Created:** 2026-02-01
**Status:** proposed
**Priority:** medium

## Summary
Add WebSocket-based real-time notifications for user events.

## Motivation
Users currently need to refresh to see updates...

## Rough Approach
- Use Socket.io for WebSocket connections
- Redis pub/sub for cross-server communication
...
```

### Storing a PRD

```
Memory name: user_auth_v2_prd

Content:
# User Authentication v2 - PRD

**Created:** 2026-02-01
**Status:** approved
**Owner:** @team

## Overview
Upgrade authentication from session-based to JWT with refresh tokens...

## Requirements
1. JWT access tokens (15min expiry)
2. Refresh tokens (7 day expiry)
...

## Success Criteria
- [ ] All endpoints migrated
- [ ] No session storage dependency
...
```

## Hierarchy and Consolidation

When you have 5+ related memories, create a parent overview:

**Before:**
```
backend_api_endpoints_specifics
backend_api_authentication_workflow
backend_api_error_handling_patterns
backend_api_rate_limiting_configuration
backend_api_testing_guide
```

**After:**
```
backend_api_layer_architecture (parent - overview)
├── backend_api_endpoints_specifics
├── backend_api_authentication_workflow
├── backend_api_error_handling_patterns
├── backend_api_rate_limiting_configuration
└── backend_api_testing_guide
```

## Validation

Memory names are validated before writing. If validation fails:

1. You'll receive an error with the reason
2. A suggested corrected name will be provided
3. Fix the name and retry

**Validation checks:**
- Not in invalid names list
- Has valid suffix
- Matches format pattern `^[a-z][a-z0-9]*([_][a-z0-9]+)*$`
