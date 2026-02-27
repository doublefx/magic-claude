# Screenshot Analysis (Native)

## Overview

Claude's built-in multimodal capability for analyzing screenshots, mockups, wireframes, and existing UI. Always available — no installation or MCP required. Uses the Read tool on image files or user-provided screenshots.

## Tier

**Free** — Built into Claude (always available).

## Rate Limits

- No MCP rate limits (uses Claude's native vision)
- Subject to conversation context window limits for image tokens

## Installation

No installation required. Available in every Claude Code session.

## Key Capabilities

| Capability | How |
|------------|-----|
| Screenshot analysis | User provides image path, Claude reads with Read tool |
| Layout extraction | Describe spatial relationships, component hierarchy |
| Color identification | Extract approximate colors from visual elements |
| Component recognition | Identify UI patterns (nav bars, cards, forms, modals) |
| Responsive inference | Estimate breakpoint behavior from visible layout |

## Usage in UI Design Phase

1. **Ask for screenshots**: Request the user provide screenshots of existing UI, mockups, or reference designs
2. **Read the image**: Use the Read tool on the image file path
3. **Extract structure**: Describe the layout hierarchy, component types, spacing patterns
4. **Map to components**: Identify which UI library components match the visual elements
5. **Document in spec**: Include screenshot references and extracted details in the design spec

## Prompting Tips

When analyzing a screenshot, focus on:
- Component hierarchy (what contains what)
- Spacing and alignment patterns
- Color scheme and typography
- Interactive elements (buttons, inputs, links)
- Responsive clues (fixed vs. fluid widths)

## Limitations

- Approximate — colors and spacing are estimates, not exact values
- No design token extraction — visual inspection only
- Quality depends on screenshot resolution and clarity
- Cannot access live DOM or CSS — purely visual analysis
- User must provide the screenshots (not automated)

## Last Verified

2026-02-27
