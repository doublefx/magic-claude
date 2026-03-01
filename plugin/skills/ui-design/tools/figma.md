# Figma MCP

## Overview

Official Figma MCP server providing direct access to Figma design files, components, and design tokens. Highest fidelity design source when a Figma project exists.

## Tier

**Freemium** — Free tier: 6 MCP tool calls/month. Paid: via Figma plan.

## Rate Limits

- Free: 6 calls/month (self-ration carefully)
- Paid: Standard Figma API rate limits apply

## Installation

```bash
# Add to Claude Code MCP settings
claude mcp add figma --transport sse --url https://mcp.figma.com/sse
```

Requires Figma authentication via OAuth or personal access token.

## Key Tools

| Tool | Purpose |
|------|---------|
| `get_file` | Retrieve full Figma file structure |
| `get_file_nodes` | Get specific frames/components |
| `get_images` | Export design assets |
| `get_components` | List published components |
| `get_styles` | Get design tokens (colors, typography, spacing) |
| `get_comments` | Design feedback and annotations |

## Usage in UI Design Phase

1. **Design extraction**: Use `get_file_nodes` to retrieve the relevant frame/page
2. **Component inventory**: Use `get_components` to identify reusable components
3. **Design tokens**: Use `get_styles` to extract colors, typography, spacing values
4. **Asset generation**: Use `get_images` for icons and illustrations

## Limitations

- Free tier extremely limited (6 calls/month) — save for high-value extractions
- Requires active Figma project with published components for best results
- Large files may timeout; target specific nodes rather than full files
- No write access — read-only design extraction

## Last Verified

2026-02-27
