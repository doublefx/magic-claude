# shadcn/ui MCP

## Overview

Official MCP server for shadcn/ui component library. Provides access to component documentation, usage examples, and installation commands for React projects using Tailwind CSS.

## Tier

**Free** — Open source.

## Rate Limits

- No rate limits (local execution)

## Installation

```bash
# Official shadcn/ui MCP server
claude mcp add shadcn-ui -- npx @shadcn/ui@canary mcp
```

No authentication required. Requires Node.js 18+.

## Key Tools

| Tool | Purpose |
|------|---------|
| `list_components` | Browse all available shadcn/ui components |
| `get_component` | Get component details, props, and usage |
| `get_component_code` | Get component source code and variants |
| `install_component` | Generate installation command for a component |

## Usage in UI Design Phase

1. **Component selection**: Use `list_components` to find components matching design needs
2. **API reference**: Use `get_component` for props, variants, and accessibility features
3. **Code patterns**: Use `get_component_code` for implementation reference
4. **Spec enrichment**: Map design elements to specific shadcn/ui components with prop values

## Limitations

- React + Tailwind CSS only — not applicable for Vue, Svelte, or other frameworks
- Components are starting points — customization still required for unique designs
- Canary channel required for MCP support (may have breaking changes)
- No design token extraction — provides code patterns, not visual specs

## Last Verified

2026-02-27
