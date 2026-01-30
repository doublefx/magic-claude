# Serena Memory Naming Conventions

## Pattern

```
{scope}_{topic}_{type}
```

**Examples:**
- `backend_api_layer_architecture`
- `auth_oauth_flow_workflow`
- `testing_e2e_playwright_guide`
- `database_connection_configuration`

## Valid Suffixes (Types)

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

## Scope Prefixes

| Prefix | Scope | Examples |
|--------|-------|----------|
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
