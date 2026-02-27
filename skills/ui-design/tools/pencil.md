# Pencil.dev MCP

## Overview

AI-native design tool with MCP integration for generating UI designs, taking screenshots, and extracting layout information. Generates designs from prompts.

## Tier

**Free** — Early access (free during beta).

## Rate Limits

- No published rate limits during early access
- Expect eventual rate limiting as the product matures

## Installation

```bash
# Add to Claude Code MCP settings
claude mcp add pencil --transport sse --url https://mcp.pencil.dev/sse
```

Requires Pencil.dev account. See [docs.pencil.dev](https://docs.pencil.dev) for setup.

## Key Tools

| Tool | Purpose |
|------|---------|
| `batch_design` | Generate multiple design variants from a prompt |
| `get_screenshot` | Capture screenshots of generated designs |
| `snapshot_layout` | Extract layout structure from a design |
| `list_designs` | Browse existing designs |
| `get_design` | Retrieve a specific design's details |

## Usage in UI Design Phase

1. **Design generation**: Use `batch_design` with feature description to generate layout options
2. **Layout extraction**: Use `snapshot_layout` to get structural information for component hierarchy
3. **Screenshot reference**: Use `get_screenshot` for visual reference during implementation
4. **Iteration**: Generate variants and compare approaches

## Limitations

- Early access product — API stability not guaranteed
- Generated designs are starting points, not production-ready
- Quality depends heavily on prompt specificity
- No component library integration — generates standalone designs

## Last Verified

2026-02-27
