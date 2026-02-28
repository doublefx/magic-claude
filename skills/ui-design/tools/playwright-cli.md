# Playwright CLI

## Overview

Browser automation tool that actively navigates to running applications and captures screenshots, DOM snapshots, and page structure. Unlike passive screenshot analysis, playwright-cli can interact with live pages to capture current UI state, specific component screenshots, and structured layout information.

## Tier

**Free** — Open source CLI tool and Claude Code skill.

## Rate Limits

- No rate limits (local execution)
- Requires a running application instance to capture from

## Installation

```bash
# Global install
npm install -g playwright-cli

# Or use npx (no install needed)
npx playwright-cli open https://localhost:3000
```

Also available as a Claude Code learned skill (`playwright-cli`) which provides `Bash(playwright-cli:*)` tool access.

## Key Capabilities

| Capability | Command | Purpose |
|------------|---------|---------|
| Navigate to URL | `playwright-cli goto <url>` | Open any page in the running app |
| Full page screenshot | `playwright-cli screenshot` | Capture entire page visual state |
| Element screenshot | `playwright-cli screenshot e5` | Capture a specific component/element |
| DOM snapshot | `playwright-cli snapshot` | Structured YAML snapshot of page elements |
| Resize viewport | `playwright-cli resize 1920 1080` | Test responsive breakpoints |
| Evaluate DOM | `playwright-cli eval "document.title"` | Extract specific page metadata |
| Console output | `playwright-cli console` | Check for runtime errors |

## Usage in UI Design Phase

1. **Capture existing UI**: Navigate to the running app and take screenshots of current state
   ```bash
   playwright-cli open http://localhost:3000
   playwright-cli goto http://localhost:3000/dashboard
   playwright-cli screenshot --filename=current-dashboard.png
   ```
2. **Extract page structure**: Use snapshots to get structured component hierarchy
   ```bash
   playwright-cli snapshot --filename=dashboard-structure.yaml
   ```
3. **Responsive audit**: Resize viewport and capture at different breakpoints
   ```bash
   playwright-cli resize 375 812    # Mobile
   playwright-cli screenshot --filename=mobile.png
   playwright-cli resize 768 1024   # Tablet
   playwright-cli screenshot --filename=tablet.png
   playwright-cli resize 1440 900   # Desktop
   playwright-cli screenshot --filename=desktop.png
   ```
4. **Component-level capture**: Screenshot specific elements for detailed analysis
   ```bash
   playwright-cli snapshot  # Find element refs
   playwright-cli screenshot e15 --filename=nav-component.png
   ```

## Advantages Over Passive Screenshots

- **Active**: Claude navigates the app directly — no need to ask user for screenshots
- **Structured**: DOM snapshots provide element hierarchy, not just pixels
- **Targeted**: Can screenshot specific elements by reference
- **Responsive**: Can test multiple viewport sizes automatically
- **Live**: Captures current running state, not stale mockups

## Limitations

- Requires a running application instance (dev server must be up)
- Cannot capture designs from Figma/design tools — only live web pages
- Snapshots are DOM structure, not CSS computed styles
- Headless by default — no visual browser window

## Last Verified

2026-02-28
