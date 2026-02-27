# Penpot

## Overview

Open-source design platform (Figma alternative) with self-hosting capability. Community MCP integrations available for extracting design data.

## Tier

**Free / Open Source** — Self-hosted or cloud (penpot.app).

## Rate Limits

- Self-hosted: No limits
- Cloud: Standard API rate limits

## Installation

```bash
# Community MCP server (check for latest package name)
# Example: npx @penpot/mcp-server
claude mcp add penpot -- npx @penpot/mcp-server
```

Requires Penpot instance URL and API token. See [penpot.app](https://penpot.app) for setup.

## Key Tools

| Tool | Purpose |
|------|---------|
| `get_project` | Retrieve project structure |
| `get_page` | Get page with components and layers |
| `get_components` | List shared components |
| `export_frame` | Export frames as images |

## Usage in UI Design Phase

1. **Project exploration**: Use `get_project` to understand design file structure
2. **Component discovery**: Use `get_components` to identify reusable elements
3. **Frame extraction**: Use `get_page` to retrieve specific page layouts
4. **Asset export**: Use `export_frame` for visual reference

## Limitations

- MCP integration is community-driven, not official
- Smaller ecosystem than Figma — fewer published component libraries
- Self-hosted requires infrastructure setup
- Tool names and APIs may vary by MCP implementation

## Last Verified

2026-02-27
