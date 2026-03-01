# Storybook addon-mcp

## Overview

Storybook MCP addon that exposes project component stories, documentation, and visual states. Provides access to the project's own component library through Storybook.

## Tier

**Free** — Open source addon.

## Rate Limits

- No rate limits (local execution against project's Storybook)

## Installation

```bash
# Install the addon in your project
npm install @storybook/addon-mcp

# Add to .storybook/main.js addons array
# Then add MCP server pointing to running Storybook instance
claude mcp add storybook -- npx @storybook/addon-mcp
```

Requires a running Storybook instance in the project.

## Key Tools

| Tool | Purpose |
|------|---------|
| `list_stories` | Browse all component stories in the project |
| `get_story` | Get story details, args, and documentation |
| `get_component_docs` | Get component documentation and props |
| `screenshot_story` | Capture visual snapshot of a story variant |

## Usage in UI Design Phase

1. **Component audit**: Use `list_stories` to inventory existing project components
2. **Reuse identification**: Use `get_component_docs` to find components that match design needs
3. **Visual reference**: Use `screenshot_story` to see current component appearance
4. **Spec mapping**: Map new feature needs to existing components, identifying gaps

## Limitations

- Only useful when the project already has Storybook configured
- Requires Storybook to be running (dev server) for some tools
- Component coverage depends on story quality — gaps in stories = gaps in MCP data
- Framework-specific (React, Vue, Svelte, etc.) based on project setup

## Last Verified

2026-02-27
