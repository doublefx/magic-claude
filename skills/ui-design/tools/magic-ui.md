# Magic UI / 21st.dev MCP

## Overview

MCP server for Magic UI and 21st.dev component libraries. Provides access to animated, modern UI components with Tailwind CSS and Framer Motion.

## Tier

**Free** — Open source components.

## Rate Limits

- No published rate limits for MCP access

## Installation

```bash
# 21st.dev MCP server (includes Magic UI components)
claude mcp add magic-ui -- npx @21st-dev/magic@latest
```

No authentication required for basic usage.

## Key Tools

| Tool | Purpose |
|------|---------|
| `search_components` | Find components by description or category |
| `get_component` | Get component details and code |
| `list_categories` | Browse component categories (animation, layout, etc.) |
| `get_demo` | Get interactive demo configuration |

## Usage in UI Design Phase

1. **Component discovery**: Use `search_components` to find animated/interactive components
2. **Code reference**: Use `get_component` for implementation patterns with animations
3. **Category browsing**: Use `list_categories` to explore available component types
4. **Spec enrichment**: Map design interactions to specific Magic UI components

## Limitations

- React + Tailwind CSS + Framer Motion stack — not applicable for other frameworks
- Focused on animations and visual effects — not a full component library
- Component API may differ from shadcn/ui patterns despite visual similarity
- Less mature MCP integration than shadcn/ui

## Last Verified

2026-02-27
